import { useEffect, useState, useCallback } from "react";
import { 
  FiPlus, FiRefreshCw, FiAlertCircle, FiEdit3, 
  FiCalendar, FiList, FiChevronLeft, FiChevronRight 
} from "react-icons/fi";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import toast from "react-hot-toast";

// --- COMPONENTE: Estatus Semanal (Círculos) ---
const WeeklyStatus = ({ activeDays }) => {
  const days = [
    { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
    { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' },
  ];
  return (
    <div className="flex gap-1">
      {days.map((d) => (
        <div key={d.id} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border ${
          activeDays?.includes(d.id) ? "bg-[#87be00] border-[#87be00] text-white scale-110" : "bg-gray-50 border-gray-100 text-gray-300"
        }`}>{d.label}</div>
      ))}
    </div>
  );
};

// --- COMPONENTE: Vista de Calendario Mensual ---
const AdminCalendarView = ({ routes, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center mb-8 px-4">
        <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">
          {currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"><FiChevronLeft/></button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"><FiChevronRight/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase py-2 tracking-widest">{d}</div>
        ))}
        {blanks.map((_, i) => <div key={`b-${i}`} className="h-24 bg-gray-50/20 rounded-2xl"></div>)}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayRoutes = routes.filter(r => r.visit_date?.startsWith(dateStr));
          
          return (
            <div 
              key={day} 
              onClick={() => onSelectDate(dateStr)}
              className="h-24 p-3 bg-gray-50/50 rounded-2xl border border-transparent hover:border-[#87be00] hover:bg-white transition-all cursor-pointer group relative overflow-hidden"
            >
              <span className="text-sm font-black text-gray-400 group-hover:text-gray-900">{day}</span>
              <div className="mt-1 space-y-1">
                {dayRoutes.slice(0, 2).map(r => (
                  <div key={r.id} className="text-[7px] bg-[#87be00] text-white p-1 rounded font-black truncate uppercase tracking-tighter">
                    {r.cadena}
                  </div>
                ))}
                {dayRoutes.length > 2 && <div className="text-[7px] text-gray-400 font-black pl-1">+{dayRoutes.length - 2}</div>}
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white p-1.5 rounded-lg shadow-xl">
                <FiPlus size={10}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminRoutes = () => {
  const [viewMode, setViewMode] = useState("list"); // "list" o "calendar"
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [routesData, usersData, localesData] = await Promise.all([
        api.get("/routes"), api.get("/users"), api.get("/locales")
      ]);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLocales(Array.isArray(localesData) ? localesData : []);
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Abrir modal con fecha pre-seleccionada desde el calendario
  const handleCalendarSelect = (dateStr) => {
    setSelectedRoute({ visit_date: dateStr, is_recurring: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 space-y-6 font-[Outfit] animate-in fade-in duration-500">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Planificación de Rutas</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
              >
                <FiList /> Lista
              </button>
              <button 
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
              >
                <FiCalendar /> Calendario
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-gray-600 transition-all">
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => { setSelectedRoute(null); setIsModalOpen(true); }}
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2"
          >
            <FiPlus size={16} /> Agendar Ruta
          </button>
        </div>
      </div>

      {/* RENDERIZADO SEGÚN VISTA */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Mercaderista</th>
                  <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Punto de Venta</th>
                  <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Planificación (Día/Fecha)</th>
                  <th className="p-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                  <th className="p-6 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="5" className="p-20 text-center text-[10px] font-black text-gray-300 uppercase">Sincronizando...</td></tr>
                ) : routes.map((r) => (
                  <tr key={r.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-black text-[10px] uppercase">
                          {r.first_name?.[0]}{r.last_name?.[0]}
                        </div>
                        <span className="text-xs font-black text-gray-800 uppercase">{r.first_name} {r.last_name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{r.cadena}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-bold">{r.direccion}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      {r.is_recurring && r.days_array && r.days_array[0] !== null ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[9px] font-black text-[#87be00] uppercase tracking-widest"><FiRefreshCw size={10} /> Semanal</div>
                          <WeeklyStatus activeDays={r.days_array} />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest"><FiCalendar size={10} /> Fecha Única</div>
                          <span className="text-xs font-black text-gray-800">{new Date(r.visit_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      <span className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-widest">{r.status}</span>
                    </td>
                    <td className="p-6 text-right">
                      <button onClick={() => handleOpenEdit(r)} className="p-3 text-gray-300 hover:text-[#87be00] hover:bg-[#87be00]/10 rounded-xl transition-all"><FiEdit3 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AdminCalendarView routes={routes} onSelectDate={handleCalendarSelect} />
      )}

      <ManageRoutesModal 
        isOpen={isModalOpen} 
        onClose={() => { setSelectedRoute(null); setIsModalOpen(false); }} 
        users={users} 
        locales={locales} 
        onCreated={fetchData} 
        initialData={selectedRoute} 
      />
    </div>
  );
};

export default AdminRoutes;