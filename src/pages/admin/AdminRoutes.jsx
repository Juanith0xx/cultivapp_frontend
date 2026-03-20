import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  FiPlus, FiRefreshCw, FiEdit3, 
  FiCalendar, FiList, FiChevronLeft, FiChevronRight, FiNavigation, FiClock, 
  FiCheckCircle, FiAlertCircle, FiXCircle, FiPlayCircle 
} from "react-icons/fi";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import RouteMapModal from "../../components/RouteMapModal";
import toast from "react-hot-toast";

// --- COMPONENTE: Estatus Semanal (Círculos) ---
const WeeklyStatus = ({ activeDays = [] }) => {
  const days = [
    { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
    { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' },
  ];

  const normalized = useMemo(() => {
    return (Array.isArray(activeDays) ? activeDays : [])
      .map(d => parseInt(d, 10))
      .filter(d => !isNaN(d));
  }, [activeDays]);

  return (
    <div className="flex gap-1.5 mt-1">
      {days.map((d) => (
        <div 
          key={d.id} 
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border transition-all ${
            normalized.includes(d.id) 
              ? "bg-[#87be00] border-[#87be00] text-white shadow-sm scale-110" 
              : "bg-gray-50 border-gray-100 text-gray-200"
          }`}
        >
          {d.label}
        </div>
      ))}
    </div>
  );
};

const AdminRoutes = () => {
  const [viewMode, setViewMode] = useState("list");
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRouteGps, setSelectedRouteGps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [routesRes, usersRes, localesRes] = await Promise.all([
        api.get("/routes"), api.get("/users"), api.get("/locales")
      ]);
      const rData = Array.isArray(routesRes.data) ? routesRes.data : Array.isArray(routesRes) ? routesRes : [];
      setRoutes(rData);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []);
      setLocales(Array.isArray(localesRes.data) ? localesRes.data : Array.isArray(localesRes) ? localesRes : []);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 🚩 LÓGICA DE AGRUPACIÓN CON ESTADO INTELIGENTE
  const groupedRoutes = useMemo(() => {
    if (!Array.isArray(routes) || routes.length === 0) return [];
    const groups = {};
    
    routes.forEach(r => {
      const key = `${r.user_id}-${r.local_id}`;
      if (!groups[key]) {
        groups[key] = { 
          ...r, 
          days_array: r.day_of_week !== null ? [parseInt(r.day_of_week, 10)] : [],
          all_statuses: [r.status] // Guardamos todos los estados del grupo
        };
      } else {
        if (r.day_of_week !== null) {
          const d = parseInt(r.day_of_week, 10);
          if (!groups[key].days_array.includes(d)) groups[key].days_array.push(d);
        }
        groups[key].all_statuses.push(r.status);
      }
    });

    // Calculamos el estado final del grupo para el "Semáforo"
    return Object.values(groups).map(group => {
      let finalStatus = 'PENDING';
      if (group.all_statuses.includes('IN_PROGRESS')) {
        finalStatus = 'IN_PROGRESS';
      } else if (group.all_statuses.every(s => s === 'COMPLETED' || s === 'OK')) {
        finalStatus = 'COMPLETED';
      } else if (group.all_statuses.includes('COMPLETED') || group.all_statuses.includes('OK')) {
        finalStatus = 'PARTIAL'; // Opcional: Alguna terminada, otras no
      }
      return { ...group, displayStatus: finalStatus };
    });
  }, [routes]);

  // 🚩 FUNCIÓN SEMÁFORO ACTUALIZADA
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'OK':
        return (
          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-200 shadow-sm">
            <FiCheckCircle size={12}/> Completado
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-200 shadow-sm">
            <FiPlayCircle className="animate-pulse" size={12}/> En Curso
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest border border-indigo-200 shadow-sm">
            <FiRefreshCw size={12}/> Parcial
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">
            <FiAlertCircle size={12}/> Pendiente
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-200 shadow-sm">
            <FiXCircle size={12}/> No Realizado
          </span>
        );
    }
  };

  return (
    <div className="p-4 space-y-6 font-[Outfit]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
            Planificación {groupedRoutes.length > 0 && `(${groupedRoutes.length})`}
          </h1>
          <div className="flex bg-gray-100 p-1 rounded-xl mt-2 w-fit">
            <button onClick={() => setViewMode("list")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}><FiList className="inline mr-1"/> Lista Agrupada</button>
            <button onClick={() => setViewMode("calendar")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}><FiCalendar className="inline mr-1"/> Calendario</button>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-gray-600 transition-all">
            <FiRefreshCw className={loading ? "animate-spin" : ""}/>
          </button>
          <button onClick={() => { setSelectedRoute(null); setIsModalOpen(true); }} className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2">
            <FiPlus size={16}/> Agendar Ruta
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Mercaderista</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Punto de Venta</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Horario / Planificación</th>
                <th className="p-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado Semáforo</th>
                <th className="p-6 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 <tr><td colSpan="5" className="p-20 text-center text-[10px] font-black text-gray-300">Sincronizando...</td></tr>
              ) : groupedRoutes.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No hay rutas agendadas</td></tr>
              ) : groupedRoutes.map((r) => (
                <tr key={`${r.user_id}-${r.local_id}`} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#87be00]/10 text-[#87be00] rounded-xl flex items-center justify-center font-black text-[11px] uppercase border border-[#87be00]/20 shadow-sm">
                        {r.first_name?.[0]}{r.last_name?.[0]}
                      </div>
                      <span className="text-xs font-black text-gray-800 uppercase leading-none">{r.first_name} {r.last_name}</span>
                    </div>
                  </td>
                  <td className="p-6">
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{r.cadena}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-bold">{r.direccion}</span>
                     </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-500">
                        <FiClock className="text-[#87be00]" /> {r.start_time?.slice(0, 5)} HRS
                      </div>
                      <WeeklyStatus activeDays={r.days_array} />
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      {/* 🚩 Usamos el displayStatus calculado para el semáforo */}
                      {getStatusBadge(r.displayStatus)}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => { setSelectedRoute({ ...r, selectedDays: r.days_array }); setIsModalOpen(true); }} 
                      className="p-3 text-gray-300 hover:text-[#87be00] hover:bg-[#87be00]/10 rounded-xl transition-all"
                    >
                      <FiEdit3 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALES */}
      <ManageRoutesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} users={users} locales={locales} onCreated={fetchData} initialData={selectedRoute} />
      <RouteMapModal isOpen={!!selectedRouteGps} onClose={() => setSelectedRouteGps(null)} routeData={selectedRouteGps} />
    </div>
  );
};

export default AdminRoutes;