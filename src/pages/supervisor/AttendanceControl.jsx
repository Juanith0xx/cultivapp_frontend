import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiClock, FiAlertCircle, FiCheckCircle, FiSearch, FiRefreshCw } from "react-icons/fi";
import api from "../../api/apiClient";

const AttendanceControl = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get("/routes/attendance-report");
      const data = Array.isArray(response) ? response : (response?.data || []);
      setAttendance(data);
    } catch (error) {
      console.error("Error cargando asistencia:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = attendance.filter(item => 
    `${item.first_name} ${item.last_name}`.toLowerCase().includes(filter.toLowerCase()) ||
    item.local_name?.toLowerCase().includes(filter.toLowerCase()) ||
    item.local_code?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 font-[Outfit]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
            Control de Jornada
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
            Panel de Supervisión • Hoy: {new Date().toLocaleDateString('es-CL')}
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar mercaderista, local o código..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs focus:ring-2 focus:ring-[#87be00] outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchAttendance}
            className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#87be00] transition-all active:scale-95"
          >
            <FiRefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* TABLA DE ASISTENCIA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic">Colaborador</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic">Local / Código</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Hora de Visita</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Entrada Real</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Tiempo Real Trabajo</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Estado</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Desvío</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && attendance.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-20 text-center animate-pulse text-xs font-bold text-gray-400 uppercase">Sincronizando...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-20 text-center text-xs font-bold text-gray-400 uppercase italic">No se encontraron registros</td></tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isLate = row.check_in && row.diff > 0;
                  const isPending = !row.check_in;

                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={row.id || idx} 
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Colaborador */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black">
                            {row.first_name?.[0]}{row.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 leading-none">{row.first_name} {row.last_name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">ID: {row.worker_id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Local / Código */}
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-700 leading-tight">{row.local_name}</p>
                        <p className="text-[9px] text-[#87be00] font-black uppercase italic">Cod: {row.local_code || 'N/A'}</p>
                      </td>

                      {/* Hora de Visita (Plan) */}
                      <td className="px-6 py-5 text-center">
                        <span className="text-xs font-black text-gray-400">{row.plan_in}</span>
                      </td>

                      {/* Entrada Real */}
                      <td className="px-6 py-5 text-center">
                        <span className={`text-xs font-black ${isLate ? 'text-red-500' : 'text-gray-900'}`}>
                          {row.check_in || '--:--'}
                        </span>
                      </td>

                      {/* Tiempo Real de Trabajo */}
                      <td className="px-6 py-5 text-center">
                        {row.working_time ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-black text-gray-900">{row.working_time} min</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">Duración</span>
                          </div>
                        ) : row.status === 'IN_PROGRESS' ? (
                          <span className="text-[10px] font-black text-blue-500 animate-pulse italic">EN PROCESO</span>
                        ) : (
                          <span className="text-xs font-black text-gray-300">--</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full italic ${
                          row.status === 'COMPLETED' ? 'bg-[#87be00]/10 text-[#87be00]' : 
                          row.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 
                          'bg-red-50 text-red-600'
                        }`}>
                          {row.status === 'COMPLETED' ? 'FINALIZADO' : 
                           row.status === 'IN_PROGRESS' ? 'EN CURSO' : 'PENDIENTE'}
                        </span>
                      </td>

                      {/* Desvío */}
                      <td className="px-6 py-5 text-center">
                        {isPending ? (
                          <FiAlertCircle className="mx-auto text-red-500" size={18} />
                        ) : (
                          <span className={`text-[10px] font-black italic ${isLate ? 'text-red-500' : 'text-[#87be00]'}`}>
                            {isLate ? `+${row.diff} MIN` : 'A TIEMPO'}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceControl;