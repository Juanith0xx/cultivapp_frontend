import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  FiPlus, FiRefreshCw, FiEdit3, 
  FiCalendar, FiList, FiCheckCircle, FiClock 
} from "react-icons/fi";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import WeeklyStatus from "../../components/MiniCalendario"; // Asegúrate de que acepte activeDays (array)
import toast from "react-hot-toast";

const Planificacion = () => {
  const [viewMode, setViewMode] = useState("list"); // 'list' o 'calendar'
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // 1. Carga de datos desde el Backend
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [routesRes, usersRes, localesRes] = await Promise.all([
        api.get("/routes"),
        api.get("/users"),
        api.get("/locales")
      ]);
      setRoutes(Array.isArray(routesRes) ? routesRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setLocales(Array.isArray(localesRes) ? localesRes : []);
    } catch (error) {
      toast.error("Error al sincronizar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 2. LÓGICA DE AGRUPACIÓN: Convierte filas sueltas en una sola fila por local/usuario
  const groupedRoutes = useMemo(() => {
    const groups = {};
    routes.forEach((r) => {
      const key = `${r.user_id}-${r.local_id}`;
      if (!groups[key]) {
        groups[key] = { 
          ...r, 
          allDays: r.day_of_week !== null ? [r.day_of_week] : [] 
        };
      } else {
        if (r.day_of_week !== null && !groups[key].allDays.includes(r.day_of_week)) {
          groups[key].allDays.push(r.day_of_week);
        }
      }
    });
    return Object.values(groups);
  }, [routes]);

  const handleEdit = (route) => {
    // Pasamos los días agrupados al modal para que aparezcan marcados
    setSelectedRoute({ ...route, selectedDays: route.allDays });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 font-[Outfit] animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Planificación de Rutas</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Gestión de visitas recurrentes y únicas</p>
          
          <div className="flex bg-gray-100 p-1 rounded-xl mt-4 w-fit">
            <button 
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
            >
              <FiList /> Lista Agrupada
            </button>
            <button 
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
            >
              <FiCalendar /> Vista Mensual
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={fetchData} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all">
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => { setSelectedRoute(null); setIsModalOpen(true); }}
            className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"
          >
            <FiPlus size={16} /> Crear Plan
          </button>
        </div>
      </div>

      {/* --- CONTENIDO --- */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Mercaderista</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Punto de Venta</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Planificación</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-[10px] font-black text-gray-300 uppercase">Cargando planificación...</td></tr>
              ) : groupedRoutes.map((row) => (
                <tr key={`${row.user_id}-${row.local_id}`} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#87be00]/10 text-[#87be00] rounded-xl flex items-center justify-center font-black text-xs uppercase">
                        {row.first_name?.[0]}{row.last_name?.[0]}
                      </div>
                      <span className="text-xs font-black text-gray-800 uppercase">{row.first_name} {row.last_name}</span>
                    </div>
                  </td>
                  
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-800 uppercase tracking-tight">{row.cadena}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{row.direccion}</span>
                    </div>
                  </td>

                  <td className="p-6">
                    {row.is_recurring ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-[#87be00] uppercase tracking-widest">
                          <FiRefreshCw size={10} /> Recurrente
                        </div>
                        {/* 🚩 Componente de bolitas con múltiples días */}
                        <WeeklyStatus activeDays={row.allDays} />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                          <FiCalendar size={10} /> Fecha Única
                        </div>
                        <span className="text-xs font-black text-gray-800">
                          {new Date(row.visit_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="p-6 text-center">
                    <span className="bg-gray-100 text-gray-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {row.status || 'PENDING'}
                    </span>
                  </td>

                  <td className="p-6 text-right">
                    <button 
                      onClick={() => handleEdit(row)}
                      className="p-3 text-gray-300 hover:text-[#87be00] hover:bg-[#87be00]/10 rounded-xl transition-all"
                    >
                      <FiEdit3 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA CREAR/EDITAR */}
      <ManageRoutesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        users={users} 
        locales={locales} 
        onCreated={fetchData} 
        initialData={selectedRoute} 
      />
    </div>
  );
};

export default Planificacion;