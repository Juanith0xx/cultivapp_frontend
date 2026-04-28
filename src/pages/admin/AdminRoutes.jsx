import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom"; // Añadido para el globalSelectedCompany si lo usas
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
  FiUser
} from "react-icons/fi";
import * as XLSX from "xlsx";

/**
 * 📅 COMPONENTE: VISUALIZADOR MENSUAL (S1 A S4)
 */
const MonthlyStatus = ({ scheduledDays = [] }) => {
  const weeks = [1, 2, 3, 4];
  const days = [
    { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
    { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' },
  ];

  return (
    <div className="grid grid-cols-1 gap-1 py-1">
      {weeks.map((week) => (
        <div key={week} className="flex items-center gap-2 group">
          <span className="text-[7px] font-black text-gray-300 w-3 tracking-tighter">S{week}</span>
          <div className="flex gap-1">
            {days.map((d) => {
              const isActive = scheduledDays.some(
                (item) => parseInt(item.day) === d.id && parseInt(item.week) === week
              );

              return (
                <div
                  key={d.id}
                  className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[6px] font-black border transition-all duration-300
                    ${isActive 
                      ? "bg-[#87be00] border-[#87be00] text-white shadow-[0_1px_3px_rgba(135,190,0,0.4)] scale-110" 
                      : "bg-gray-50 border-gray-100 text-gray-200"}`}
                >
                  {d.label}
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
  const [viewMode, setViewMode] = useState("list");
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

      setRoutes(Array.isArray(resRoutes.data ? resRoutes.data : resRoutes) ? (resRoutes.data || resRoutes) : []);
      setUsers(Array.isArray(resUsers.data ? resUsers.data : resUsers) ? (resUsers.data || resUsers) : []);
      setLocales(Array.isArray(resLocales.data ? resLocales.data : resLocales) ? (resLocales.data || resLocales) : []);
      setCompanies(Array.isArray(resCompanies.data ? resCompanies.data : resCompanies) ? (resCompanies.data || resCompanies) : []);
    } catch (error) {
      console.error("❌ Error en fetchData:", error);
      if (!error.offline) toast.error("Error al sincronizar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🧠 CALCULADOR DE FECHAS PARA EL FRONTEND (Guía Visual S1-S4)
  const weekRanges = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); 
    
    let firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
    
    let firstMonday = new Date(firstDay);
    if (dayOfWeek !== 1) {
      firstMonday.setDate(1 + (8 - dayOfWeek));
    }

    const ranges = [];
    const mesesAbr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for(let i=0; i<4; i++) {
      let start = new Date(firstMonday);
      start.setDate(firstMonday.getDate() + (i * 7));
      let end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      ranges.push({
        label: `S${i+1}`,
        dates: `${start.getDate()} ${mesesAbr[start.getMonth()]} - ${end.getDate()} ${mesesAbr[end.getMonth()]}`
      });
    }
    return ranges;
  }, []);

  const getWeekOfMonth = (dateStr) => {
    const date = new Date(dateStr);
    return Math.ceil(date.getDate() / 7);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const toastId = toast.loading("Analizando estructura del archivo...");

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });

        const headerRowIndex = rows.findIndex((row) =>
          row.some((cell) => {
            const c = String(cell).toLowerCase().trim();
            return (
              c.includes("rut") ||
              c.includes("codigo") ||
              c.includes("turno")
            );
          })
        );

        if (headerRowIndex === -1) {
          toast.error("No se encontraron encabezados válidos", { id: toastId });
          return;
        }

        const rawJson = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          defval: "",
        });

        const finalData = rawJson
          .map((row, index) => {
            const newRow = {};

            Object.keys(row).forEach((key) => {
              const cleanKey = key.trim().toLowerCase();
              const value = String(row[key]).trim();

              if (cleanKey.includes("rut")) {
                newRow.Rut_Mercaderista = value;
              } else if (cleanKey.includes("cod")) {
                newRow.Codigo = value;
              } else if (
                cleanKey.includes("turno") &&
                cleanKey.includes("semana")
              ) {
                newRow[key.trim()] = value;
              }
            });
            return newRow;
          })
          .filter((f) => f.Rut_Mercaderista && f.Codigo);

        const today = new Date();

        // 🚩 Mantengo exactamente tu payload estructurado
        const payload = {
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          routes: finalData,
        };

        const response = await api.post("/routes/bulk-create", payload);

        // Ajustado para leer response.data o response directo según Axios
        const resData = response.data || response;

        if (resData.success || (Array.isArray(resData) && resData.length > 0)) {
          toast.success(`Éxito en carga masiva`, { id: toastId });
          fetchData();
        } else {
          toast.error(resData.message || "Error en carga masiva", { id: toastId });
        }
      } catch (err) {
        console.error("❌ ERROR IMPORTANDO EXCEL:", err);
        toast.error("No se pudo procesar el Excel", { id: toastId });
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // 🧠 AGRUPACIÓN OPTIMIZADA: Combina tu lógica con el soporte visual S1-S4
  const groupedRoutes = useMemo(() => {
    const groups = {};

    routes.forEach((r) => {
      if (!r.user_id || !r.local_id) return;

      const key = `${r.user_id}-${r.local_id}`;
      const weekNum = r.week_number || 1; // 🚩 Capturamos la semana para el UI

      if (!groups[key]) {
        groups[key] = {
          ...r,
          scheduled_items: r.day_of_week !== null ? [{ day: r.day_of_week, week: weekNum }] : [],
          all_statuses: [r.status],
        };
      } else {
        // Evitamos duplicar la visualización del mismo día en la misma semana
        if (r.day_of_week !== null) {
          const exists = groups[key].scheduled_items.some(
            item => parseInt(item.day) === parseInt(r.day_of_week) && parseInt(item.week) === parseInt(weekNum)
          );
          if (!exists) {
            groups[key].scheduled_items.push({ day: r.day_of_week, week: weekNum });
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
    return <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${s.bg} ${s.text} text-[8px] font-black uppercase tracking-widest border ${s.border} shadow-sm`}>{s.icon} {s.label}</span>;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <FiRefreshCw className="animate-spin text-[#87be00]" size={42} />
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Sincronizando Planificación...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 font-[Outfit]">
      {/* Header Personalizado con Guía de Fechas */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight italic leading-none">Planificación Mensual</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic">Visualización de cobertura 4 semanas (S1-S4)</p>
          
          {/* GUÍA VISUAL DE FECHAS */}
          <div className="flex flex-wrap gap-2 mt-4">
            {weekRanges.map((w, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span className="text-[9px] font-black text-[#87be00]">{w.label}</span>
                <span className="text-[9px] font-bold text-gray-500 uppercase">{w.dates}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={fetchData} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-[#87be00] transition-all"><FiRefreshCw className={loading ? "animate-spin" : ""}/></button>
          
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
          <button onClick={() => fileInputRef.current.click()} className="bg-[#87be00] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 transition-all">
            <FiUploadCloud size={16}/> Cargar Excel S1-S4
          </button>
          
          <button onClick={() => { setSelectedRoute(null); setIsModalOpen(true); }} className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
            <FiPlus size={16}/> Nueva Ruta
          </button>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
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
              {groupedRoutes.length === 0 ? (
                 <tr><td colSpan="5" className="p-20 text-center text-gray-300 font-black uppercase tracking-widest italic">No hay rutas cargadas para este mes</td></tr>
              ) : groupedRoutes.map((r) => (
                <tr key={`${r.user_id}-${r.local_id}`} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-[#87be00]/10 group-hover:text-[#87be00] transition-colors"><FiHash size={14}/></div>
                      <div>
                        <p className="font-black text-gray-800 uppercase italic leading-none">{r.cadena || 'LOCAL'}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{r.direccion || 'Sin dirección'}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-900 text-white text-[8px] font-black rounded-md tracking-tighter">{r.codigo_local}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-2">
                        <p className="font-black text-gray-700 uppercase flex items-center gap-2 leading-none">
                          <FiUser size={14} className="text-[#87be00]"/> {r.first_name} {r.last_name}
                        </p>
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[9px] font-black text-[#87be00] uppercase tracking-tight italic">
                             {r.user_role || 'MERCADERISTA'}
                           </span>
                           <span className="w-fit px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[8px] font-black uppercase tracking-tighter border border-gray-200">
                             {r.nombre_turno || 'PLANIFICADO'}
                           </span>
                        </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <MonthlyStatus scheduledDays={r.scheduled_items} />
                  </td>
                  <td className="p-6 text-center">{getStatusBadge(r.displayStatus)}</td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => { setSelectedRoute(r); setIsModalOpen(true); }} 
                      className="p-3 bg-gray-50 text-gray-400 hover:bg-[#87be00] hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      <FiEdit3 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <ManageRoutesModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedRoute(null); }} 
        users={users} 
        locales={locales} 
        companies={companies} 
        onCreated={fetchData} 
        initialData={selectedRoute} 
      />
    </div>
  );
};

export default Planificacion;