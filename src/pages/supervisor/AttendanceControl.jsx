import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiClock, FiAlertCircle, FiSearch, FiRefreshCw, FiCalendar } from "react-icons/fi";
import api from "../../api/apiClient";

// Función segura para obtener la fecha local YYYY-MM-DD (Evita bugs de zona horaria)
const getLocalISODate = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
};

const AttendanceControl = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [selectedDate, setSelectedDate] = useState(getLocalISODate());

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      
      const params = searchTerm.length > 2 
        ? { search: searchTerm } 
        : { date: selectedDate };

      const response = await api.get("/routes/attendance-report", params);
      
      const data = Array.isArray(response) ? response : (response?.data || []);
      setAttendance(data);
    } catch (error) {
      console.error("❌ Error cargando asistencia:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAttendance();
    }, 500); 

    return () => clearTimeout(delayDebounce);
  }, [selectedDate, searchTerm]);

  useEffect(() => {
    const isToday = selectedDate === getLocalISODate();
    let interval;
    if (isToday && searchTerm === "") {
      interval = setInterval(fetchAttendance, 30000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [selectedDate, searchTerm]);

  // Utilidad para formatear la fecha correctamente DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '--/--/--';
    const [y, m, d] = dateString.split('T')[0].split('-');
    return `${d}-${m}-${y}`;
  };

  return (
    <div className="space-y-6 font-[Outfit]">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
            {searchTerm.length > 2 ? `Resultados para: ${searchTerm}` : "Control de Jornada"}
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
            Panel de Supervisión • {searchTerm.length > 2 ? "Búsqueda Global" : `Fecha: ${selectedDate}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {/* SELECTOR DE FECHA */}
          <div className="relative flex-1 md:flex-none">
            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87be00]" size={14} />
            <input 
              type="date" 
              className="pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20 shadow-sm"
              value={selectedDate}
              onChange={(e) => {
                setSearchTerm(""); 
                setSelectedDate(e.target.value);
              }}
            />
          </div>

          {/* BUSCADOR GLOBAL */}
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Nombre, Local o Código..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs focus:ring-2 focus:ring-[#87be00] outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button onClick={fetchAttendance} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#87be00] transition-all shadow-sm">
            <FiRefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic">Colaborador</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic">Local / Código</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Fecha Visita</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Hora Visita</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Entrada Real</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Tiempo Real</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest italic text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && attendance.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-20 text-center animate-pulse text-xs font-bold text-gray-400 uppercase italic">Sincronizando registros...</td></tr>
              ) : attendance.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-20 text-center text-xs font-bold text-gray-400 uppercase italic text-gray-300">No hay registros para mostrar</td></tr>
              ) : (
                attendance.map((row, idx) => {
                  const isLate = row.check_in && row.diff > 0;
                  
                  // 🚩 FIX FECHA: Si es recurrente (visit_date null), mostramos la fecha que se está buscando.
                  const displayDate = row.visit_date ? row.visit_date : selectedDate;

                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      key={row.id || idx} className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                            {row.first_name?.[0].toUpperCase()}{row.last_name?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 leading-none">{row.first_name} {row.last_name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">ID: {row.worker_id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-700 leading-tight">{row.local_name}</p>
                        <p className="text-[9px] text-[#87be00] font-black uppercase italic">Cod: {row.local_code || 'N/A'}</p>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span className="text-[10px] font-black text-gray-900 uppercase">
                          {formatDate(displayDate)}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span className="text-xs font-black text-gray-400">{row.plan_in || '--:--'}</span>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span className={`text-xs font-black ${isLate ? 'text-red-500' : 'text-gray-900'}`}>
                          {row.check_in || '--:--'}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-center">
                        {row.working_time ? (
                          <span className="text-xs font-black text-gray-900">{row.working_time} min</span>
                        ) : row.status === 'IN_PROGRESS' ? (
                          <span className="text-[9px] font-black text-blue-500 animate-pulse italic">EN CURSO</span>
                        ) : (
                          <span className="text-xs font-black text-gray-300 italic">--</span>
                        )}
                      </td>

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