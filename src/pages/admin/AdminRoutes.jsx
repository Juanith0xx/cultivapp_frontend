import { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  FiPlus, FiRefreshCw, FiEdit3, FiCalendar, FiList, FiClock, 
  FiCheckCircle, FiAlertCircle, FiXCircle, FiPlayCircle, FiBriefcase 
} from "react-icons/fi";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import RouteMapModal from "../../components/RouteMapModal";
import toast from "react-hot-toast";

const WeeklyStatus = ({ activeDays = [] }) => {
  const days = [
    { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
    { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' },
  ];
  const normalized = useMemo(() => (Array.isArray(activeDays) ? activeDays : []).map(d => parseInt(d, 10)).filter(d => !isNaN(d)), [activeDays]);

  return (
    <div className="flex gap-1.5 mt-1">
      {days.map((d) => (
        <div key={d.id} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border transition-all ${normalized.includes(d.id) ? "bg-[#87be00] border-[#87be00] text-white shadow-sm scale-110" : "bg-gray-50 border-gray-100 text-gray-200"}`}>{d.label}</div>
      ))}
    </div>
  );
};

const AdminRoutes = () => {
  const context = useOutletContext();
  const globalSelectedCompany = context?.selectedCompany || "";

  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [companies, setCompanies] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 🚩 MEJORA: Peticiones base que todos los roles pueden ver
      const [routesRes, usersRes, localesRes] = await Promise.all([
        api.get("/routes"), 
        api.get("/users"), 
        api.get("/locales")
      ]);

      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : routesRes || []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes || []);
      setLocales(Array.isArray(localesRes.data) ? localesRes.data : localesRes || []);

      // 🚩 SOLUCIÓN AL 403: Intentar cargar empresas de forma aislada
      try {
        const companiesRes = await api.get("/companies");
        setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : companiesRes || []);
      } catch (err) {
        // Si da 403, simplemente somos un Admin Cliente. No es un error crítico.
        setCompanies([]);
      }

    } catch (error) {
      toast.error("Error al sincronizar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const groupedRoutes = useMemo(() => {
    if (!Array.isArray(routes)) return [];
    
    // Si hay un filtro global de Root (selectedCompany), filtramos.
    // Si no, mostramos todo lo que el backend nos entregó (que ya viene filtrado si eres Admin)
    const filteredRoutes = globalSelectedCompany 
      ? routes.filter(r => String(r.company_id) === String(globalSelectedCompany))
      : routes;

    const groups = {};
    filteredRoutes.forEach(r => {
      const key = `${r.user_id}-${r.local_id}`;
      if (!groups[key]) {
        groups[key] = { 
          ...r, 
          days_array: r.day_of_week !== null ? [parseInt(r.day_of_week, 10)] : [],
          all_statuses: [r.status],
          // Buscamos el nombre de la empresa solo si tenemos la lista (perfil Root)
          company_name: companies.length > 0 ? (companies.find(c => c.id === r.company_id)?.name || "N/A") : null
        };
      } else {
        const d = parseInt(r.day_of_week, 10);
        if (!groups[key].days_array.includes(d)) groups[key].days_array.push(d);
        groups[key].all_statuses.push(r.status);
      }
    });

    return Object.values(groups).map(group => {
      let finalStatus = 'PENDING';
      if (group.all_statuses.includes('IN_PROGRESS')) finalStatus = 'IN_PROGRESS';
      else if (group.all_statuses.every(s => s === 'COMPLETED' || s === 'OK')) finalStatus = 'COMPLETED';
      else if (group.all_statuses.some(s => s === 'COMPLETED' || s === 'OK')) finalStatus = 'PARTIAL';
      return { ...group, displayStatus: finalStatus };
    });
  }, [routes, globalSelectedCompany, companies]);

  const getStatusBadge = (status) => {
    const config = {
      COMPLETED: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: <FiCheckCircle/>, label: 'Completado' },
      IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: <FiPlayCircle className="animate-pulse"/>, label: 'En Curso' },
      PARTIAL: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', icon: <FiRefreshCw/>, label: 'Parcial' },
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-200', icon: <FiAlertCircle/>, label: 'Pendiente' }
    };
    const s = config[status?.toUpperCase()] || { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', icon: <FiXCircle/>, label: 'No Realizado' };
    return (
      <span className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full ${s.bg} ${s.text} text-[9px] font-black uppercase tracking-widest border ${s.border} shadow-sm`}>
        {s.icon} {s.label}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-6 font-[Outfit]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Planificación</h1>
          {globalSelectedCompany && companies.length > 0 && (
            <span className="bg-[#87be00]/10 text-[#87be00] text-[10px] font-black px-3 py-1 rounded-lg w-fit uppercase tracking-tighter">
              Filtrado por: {companies.find(c => String(c.id) === String(globalSelectedCompany))?.name}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-[#87be00] transition-all">
            <FiRefreshCw className={loading ? "animate-spin" : ""}/>
          </button>
          <button onClick={() => { setSelectedRoute(null); setIsModalOpen(true); }} className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2">
            <FiPlus size={16}/> Agendar Ruta
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Mercaderista</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Punto de Venta</th>
                {/* 🚩 SOLO MOSTRAR COLUMNA EMPRESA SI HAY DATOS (ROOT) */}
                {companies.length > 0 && (
                  <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Empresa</th>
                )}
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Planificación</th>
                <th className="p-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                <th className="p-6 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 <tr><td colSpan="6" className="p-20 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest animate-pulse">Sincronizando...</td></tr>
              ) : groupedRoutes.length === 0 ? (
                <tr><td colSpan="6" className="p-20 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No hay rutas agendadas</td></tr>
              ) : groupedRoutes.map((r) => (
                <tr key={`${r.user_id}-${r.local_id}`} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-[11px] uppercase">
                        {r.first_name?.[0]}{r.last_name?.[0]}
                      </div>
                      <span className="text-xs font-black text-gray-800 uppercase">{r.first_name} {r.last_name}</span>
                    </div>
                  </td>
                  <td className="p-6 flex flex-col">
                    <span className="text-xs font-black text-gray-700 uppercase">{r.cadena}</span>
                    <span className="text-[9px] text-gray-400 uppercase font-bold">{r.direccion}</span>
                  </td>
                  {/* 🚩 DATO DE EMPRESA CONDICIONAL */}
                  {companies.length > 0 && (
                    <td className="p-6">
                      <span className="flex items-center gap-2 text-[10px] font-black text-[#87be00] uppercase">
                        <FiBriefcase /> {r.company_name}
                      </span>
                    </td>
                  )}
                  <td className="p-6">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-500 mb-1">
                      <FiClock className="text-[#87be00]" /> {r.start_time?.slice(0, 5)} HRS
                    </div>
                    <WeeklyStatus activeDays={r.days_array} />
                  </td>
                  <td className="p-6 text-center">{getStatusBadge(r.displayStatus)}</td>
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

      <ManageRoutesModal 
        key={selectedRoute ? `edit-${selectedRoute.id || selectedRoute.user_id}` : 'new'}
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedRoute(null); }} 
        users={users} 
        locales={locales} 
        onCreated={fetchData} 
        initialData={selectedRoute} 
      />
    </div>
  );
};

export default AdminRoutes;