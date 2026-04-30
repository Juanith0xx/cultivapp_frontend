import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiRefreshCw,
  FiEdit3,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiPlayCircle,
  FiHash,
  FiUser,
  FiMapPin,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

/**
 * 📅 COMPONENTE: VISUALIZADOR MENSUAL CON TOOLTIP DINÁMICO
 */
const MonthlyStatus = ({ scheduledDays = [] }) => {
  const weeks = [1, 2, 3, 4];
  const days = [
    { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
    { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' },
  ];

  const formatTime = (time) => {
    if (!time || time === "null") return "N/A";
    return String(time).substring(0, 5);
  };

  return (
    <div className="grid grid-cols-1 gap-1 py-1">
      {weeks.map((week) => (
        <div key={week} className="flex items-center gap-2 group/week">
          <span className="text-[7px] font-black text-gray-300 w-3 tracking-tighter">S{week}</span>
          <div className="flex gap-1">
            {days.map((d) => {
              const scheduleInfo = scheduledDays.find(
                (item) => parseInt(item.day) === d.id && parseInt(item.week) === week
              );

              const isActive = !!scheduleInfo;

              return (
                <div key={d.id} className="relative group/day">
                  <div
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-md flex items-center justify-center text-[6px] md:text-[7px] font-black border transition-all duration-300 cursor-default
                      ${isActive 
                        ? "bg-[#87be00] border-[#87be00] text-white shadow-[0_1px_3px_rgba(135,190,0,0.4)] hover:scale-125" 
                        : "bg-gray-50 border-gray-100 text-gray-200"}`}
                  >
                    {d.label}
                  </div>

                  {isActive && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/day:opacity-100 pointer-events-none transition-all duration-200 z-[100]">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap flex flex-col items-center gap-0.5">
                        <span className="font-black text-[#87be00] uppercase text-[7px] tracking-widest">
                          {scheduleInfo.turno || 'Planificado'}
                        </span>
                        <span className="font-bold">
                          {formatTime(scheduleInfo.time)} — {formatTime(scheduleInfo.endTime)}
                        </span>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const Planificacion = () => {
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resRoutes, resUsers, resLocales, resCompanies] = await Promise.all([
        api.get("/routes"),
        api.get("/users"),
        api.get("/locales"),
        api.get("/companies"),
      ]);

      const dRoutes = resRoutes.data || resRoutes;
      const dUsers = resUsers.data || resUsers;
      const dLocales = resLocales.data || resLocales;
      const dCompanies = resCompanies.data || resCompanies;

      setRoutes(Array.isArray(dRoutes) ? dRoutes : []);
      setUsers(Array.isArray(dUsers) ? dUsers : []);
      setLocales(Array.isArray(dLocales) ? dLocales : []);
      setCompanies(Array.isArray(dCompanies) ? dCompanies : []);
    } catch (error) {
      console.error("❌ Error en fetchData:", error);
      toast.error("Error al sincronizar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const weekRanges = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); 
    let firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
    let firstMonday = new Date(firstDay);
    if (dayOfWeek !== 1) firstMonday.setDate(1 + (8 - dayOfWeek));

    const ranges = [];
    const mesesAbr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for(let i=0; i<4; i++) {
      let start = new Date(firstMonday);
      start.setDate(firstMonday.getDate() + (i * 7));
      let end = new Date(start);
      end.setDate(start.getDate() + 6);
      ranges.push({ label: `S${i+1}`, dates: `${start.getDate()} ${mesesAbr[start.getMonth()]} - ${end.getDate()} ${mesesAbr[end.getMonth()]}` });
    }
    return ranges;
  }, []);

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const toastId = toast.loading("Analizando Excel...");

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const finalData = rawJson.map((row) => {
          const obj = {};
          Object.keys(row).forEach((key) => {
            const k = String(key).toLowerCase().trim();
            const val = String(row[key]).trim();
            if (k.includes("rut")) obj.Rut_Mercaderista = val;
            else if (k.includes("cod")) obj.Codigo = val;
            else if (k.includes("semana") || k.includes("turno")) obj[key.trim()] = val;
          });
          return obj;
        }).filter(f => f.Rut_Mercaderista && f.Codigo);

        if (finalData.length === 0) {
          toast.error("Excel sin datos válidos", { id: toastId });
          return;
        }

        const today = new Date();
        const payload = { month: today.getMonth() + 1, year: today.getFullYear(), routes: finalData };
        await api.post("/routes/bulk-create", payload);
        toast.success("¡Carga masiva exitosa!", { id: toastId });
        fetchData();
      } catch (err) {
        toast.error("Error al procesar el archivo", { id: toastId });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const groupedRoutes = useMemo(() => {
    const groups = {};
    routes.forEach((r) => {
      if (!r.user_id || !r.local_id) return;
      const key = `${r.user_id}-${r.local_id}`;
      const weekNum = r.week_number || 1; 

      if (!groups[key]) {
        groups[key] = {
          ...r,
          scheduled_items: r.day_of_week !== null ? [{ 
            day: r.day_of_week, 
            week: weekNum, 
            time: r.entrada,      
            endTime: r.salida,    
            turno: r.nombre_turno  
          }] : [],
          all_statuses: [r.status],
        };
      } else {
        if (r.day_of_week !== null) {
          const exists = groups[key].scheduled_items.some(
            item => parseInt(item.day) === parseInt(r.day_of_week) && parseInt(item.week) === parseInt(weekNum)
          );
          if (!exists) {
            groups[key].scheduled_items.push({ 
              day: r.day_of_week, 
              week: weekNum, 
              time: r.entrada,
              endTime: r.salida,
              turno: r.nombre_turno 
            });
          }
        }
        groups[key].all_statuses.push(r.status);
      }
    });

    return Object.values(groups).map(group => ({
      ...group,
      displayStatus: group.all_statuses.includes('IN_PROGRESS') ? 'IN_PROGRESS' : 
                     group.all_statuses.every(s => s === 'COMPLETED' || s === 'OK') ? 'COMPLETED' : 
                     group.all_statuses.some(s => s === 'COMPLETED' || s === 'OK') ? 'PARTIAL' : 'PENDING'
    }));
  }, [routes]);

  const getStatusBadge = (status) => {
    const config = {
      COMPLETED: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: <FiCheckCircle/>, label: 'Completado' },
      IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: <FiPlayCircle className="animate-pulse"/>, label: 'En Curso' },
      PARTIAL: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', icon: <FiRefreshCw/>, label: 'Parcial' },
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-200', icon: <FiAlertCircle/>, label: 'Pendiente' }
    };
    const s = config[status?.toUpperCase()] || config.PENDING;
    return <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${s.bg} ${s.text} text-[8px] font-black uppercase tracking-widest border ${s.border} shadow-sm w-max`}>{s.icon} {s.label}</span>;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <FiRefreshCw className="animate-spin text-[#87be00]" size={42} />
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Sincronizando Planificación...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-[Outfit] pb-20 px-2 sm:px-4">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase italic leading-none">Planificación Mensual</h1>
          <div className="flex overflow-x-auto gap-2 mt-4 pb-2 custom-scrollbar">
            {weekRanges.map((w, idx) => (
              <div key={idx} className="flex flex-col gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 shrink-0 min-w-[100px]">
                <span className="text-[9px] font-black text-[#87be00]">{w.label}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">{w.dates}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button onClick={fetchData} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-[#87be00] border border-gray-100"><FiRefreshCw size={18}/></button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
          <button onClick={() => fileInputRef.current.click()} className="bg-[#87be00] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-[#76a600] transition-all"><FiUploadCloud size={16}/> Cargar Excel</button>
          <button onClick={() => { setSelectedRoute(null); setIsModalOpen(true); }} className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-gray-800 transition-all"><FiPlus size={16}/> Nueva Ruta</button>
        </div>
      </div>

      {/* TABLA DESKTOP */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Punto de Venta / Local</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Mercaderista Asignado</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Calendario Mensual</th>
                <th className="p-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                <th className="p-6 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
              {groupedRoutes.map((r) => {
                // 🚩 MEJORA: Obtenemos los turnos únicos por cada semana (S1-S4)
                const turnsByWeek = {};
                r.scheduled_items.forEach(item => {
                  if (!turnsByWeek[item.week]) {
                    turnsByWeek[item.week] = item.turno;
                  }
                });

                return (
                  <tr key={`${r.user_id}-${r.local_id}`} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="min-w-0">
                        <p className="font-black text-gray-800 uppercase italic leading-none">{r.cadena}</p>
                        <p className="text-[10px] text-gray-400 mt-1 truncate max-w-xs">{r.direccion}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-900 text-white text-[8px] font-black rounded-md">{r.codigo_local}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-2">
                          <p className="font-black text-gray-700 uppercase flex items-center gap-2 leading-none"><FiUser size={14} className="text-[#87be00]"/> {r.first_name} {r.last_name}</p>
                          
                          {/* 🚩 DESGLOSE DE TURNOS POR SEMANA */}
                          <div className="flex flex-col gap-1">
                            {[1, 2, 3, 4].map(wNum => {
                              const tName = turnsByWeek[wNum];
                              if (!tName) return null;
                              return (
                                <div key={wNum} className="flex items-center gap-2">
                                  <span className="text-[7px] font-black text-[#87be00] bg-[#87be00]/10 px-1 rounded uppercase tracking-tighter shrink-0">S{wNum}</span>
                                  <span className="text-[8px] font-black text-gray-400 uppercase truncate max-w-[120px]">{tName}</span>
                                </div>
                              );
                            })}
                          </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <MonthlyStatus scheduledDays={r.scheduled_items} />
                    </td>
                    <td className="p-6 text-center">{getStatusBadge(r.displayStatus)}</td>
                    <td className="p-6 text-right">
                      <button onClick={() => { setSelectedRoute(r); setIsModalOpen(true); }} className="p-3 bg-gray-50 text-gray-400 hover:bg-[#87be00] hover:text-white rounded-xl shadow-sm transition-all"><FiEdit3 size={16}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <ManageRoutesModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedRoute(null); }} 
        users={users} locales={locales} companies={companies} onCreated={fetchData} initialData={selectedRoute} 
      />
    </div>
  );
};

export default Planificacion;