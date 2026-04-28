import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiClock, FiAlertCircle, FiSearch, FiRefreshCw, FiCalendar, FiMapPin, FiUser } from "react-icons/fi";
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
    <div className="space-y-6 md:space-y-8 font-[Outfit] pb-10">
      
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 px-2 md:px-0">
        <div className="w-full lg:w-auto">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
            {searchTerm.length > 2 ? `Búsqueda: ${searchTerm}` : "Control de Jornada"}
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
            Panel de Supervisión • {searchTerm.length > 2 ? "Resultados Globales" : `Fecha: ${selectedDate}`}
          </p>
        </div>

        {/* CONTROLES: Apilados en móvil, en línea en desktop */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3 w-full lg:w-auto">
          
          {/* SELECTOR DE FECHA */}
          <div className="relative w-full sm:flex-1 md:w-auto">
            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87be00]" size={14} />
            <input 
              type="date" 
              className="w-full pl-10 pr-4 py-3 md:py-4 bg-white border border-gray-100 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20 shadow-sm transition-all"
              value={selectedDate}
              onChange={(e) => {
                setSearchTerm(""); 
                setSelectedDate(e.target.value);
              }}
            />
          </div>

          {/* BUSCADOR GLOBAL */}
          <div className="relative w-full sm:flex-1 md:w-64 lg:w-72">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="COLABORADOR, LOCAL, CÓDIGO..."
              className="w-full pl-10 pr-4 py-3 md:py-4 bg-white border border-gray-100 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black outline-none focus:ring-2 focus:ring-[#87be00]/20 shadow-sm transition-all uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={fetchAttendance} 
            className="w-full sm:w-auto flex items-center justify-center p-3 md:p-4 bg-white border border-gray-100 rounded-xl md:rounded-2xl text-gray-400 hover:text-[#87be00] hover:border-[#87be00]/30 transition-all shadow-sm active:scale-95"
          >
            <FiRefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 🚩 VISTA MÓVIL: TARJETAS (CARDS) */}
      <div className="md:hidden space-y-4 px-2">
        {loading && attendance.length === 0 ? (
          <div className="py-20 text-center animate-pulse text-xs font-bold text-gray-400 uppercase italic">
            Sincronizando registros...
          </div>
        ) : attendance.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <FiClock size={24} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">No hay registros para mostrar</p>
          </div>
        ) : (
          attendance.map((row, idx) => {
            const isLate = row.check_in && row.diff > 0;
            const displayDate = row.visit_date ? row.visit_date : selectedDate;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                key={row.id || idx} 
                className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Indicador de estado lateral */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  row.status === 'COMPLETED' ? 'bg-[#87be00]' : 
                  row.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-amber-400'
                }`}></div>

                {/* Cabecera Card: Usuario y Estado */}
                <div className="flex justify-between items-start pl-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-900 text-[#87be00] flex items-center justify-center text-[11px] font-black shadow-sm shrink-0">
                      {row.first_name?.[0].toUpperCase()}{row.last_name?.[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 leading-none uppercase truncate max-w-[140px] xs:max-w-[180px]">
                        {row.first_name} {row.last_name}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-widest">ID: {row.worker_id}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black px-2.5 py-1 rounded-md italic shrink-0 border ${
                    row.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 
                    row.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {row.status === 'COMPLETED' ? 'FINALIZADO' : row.status === 'IN_PROGRESS' ? 'EN CURSO' : 'PENDIENTE'}
                  </span>
                </div>

                {/* Local */}
                <div className="bg-gray-50 p-3 rounded-xl ml-2">
                  <p className="text-[11px] font-black text-gray-800 leading-tight uppercase italic">{row.local_name}</p>
                  <p className="text-[9px] text-[#87be00] font-black uppercase mt-0.5 tracking-widest">Cod: {row.local_code || 'N/A'}</p>
                </div>

                {/* Grid de Tiempos */}
                <div className="grid grid-cols-2 gap-2 ml-2">
                  <div className="bg-white border border-gray-100 p-2.5 rounded-xl text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Planificado</p>
                    <p className="text-xs font-black text-gray-900">{row.plan_in || '--:--'}</p>
                    <p className="text-[8px] font-bold text-gray-400 mt-0.5">{formatDate(displayDate)}</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-2.5 rounded-xl text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Registro Real</p>
                    <p className={`text-xs font-black ${isLate ? 'text-red-500' : 'text-[#87be00]'}`}>
                      {row.check_in || '--:--'}
                    </p>
                    <p className="text-[8px] font-bold text-gray-400 mt-0.5">
                      {row.working_time ? `${row.working_time} min` : row.status === 'IN_PROGRESS' ? 'En Curso' : '--'}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 🚩 VISTA DESKTOP: TABLA ORIGINAL */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden mx-2 lg:mx-0">
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
                            <p className="text-xs font-black text-gray-900 leading-none uppercase">{row.first_name} {row.last_name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">ID: {row.worker_id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-700 leading-tight uppercase italic">{row.local_name}</p>
                        <p className="text-[9px] text-[#87be00] font-black uppercase italic mt-0.5">Cod: {row.local_code || 'N/A'}</p>
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
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-md italic border ${
                          row.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 
                          row.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                          'bg-amber-50 text-amber-600 border-amber-100'
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