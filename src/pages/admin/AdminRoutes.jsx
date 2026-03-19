import { useEffect, useState } from "react";
import { FiPlus, FiRefreshCw, FiAlertCircle, FiEdit3, FiCalendar, FiClock } from "react-icons/fi";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import toast from "react-hot-toast";

// Componente visual actualizado para mostrar MÚLTIPLES círculos activos
const WeeklyStatus = ({ activeDays }) => {
  const days = [
    { id: 1, label: 'L' },
    { id: 2, label: 'M' },
    { id: 3, label: 'X' },
    { id: 4, label: 'J' },
    { id: 5, label: 'V' },
    { id: 6, label: 'S' },
    { id: 0, label: 'D' },
  ];

  return (
    <div className="flex gap-1">
      {days.map((d) => {
        // Verificamos si el ID del día está dentro del array de días activos
        const isActive = activeDays?.includes(d.id);
        return (
          <div
            key={d.id}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all border ${
              isActive
                ? "bg-[#87be00] border-[#87be00] text-white shadow-sm scale-110"
                : "bg-gray-50 border-gray-100 text-gray-300"
            }`}
          >
            {d.label}
          </div>
        );
      })}
    </div>
  );
};

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      const [routesData, usersData, localesData] = await Promise.all([
        api.get("/routes"),
        api.get("/users"),
        api.get("/locales")
      ]);

      setRoutes(Array.isArray(routesData) ? routesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLocales(Array.isArray(localesData) ? localesData : []);
      
    } catch (error) {
      console.error("❌ ERROR AL CARGAR DATOS:", error.message);
      if (error.message.includes("401")) {
        setAuthError(true);
        toast.error("Sesión expirada.");
      } else {
        toast.error("Error de conexión");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedRoute(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedRoute(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 space-y-6 font-[Outfit] animate-in fade-in duration-500">
      
      {authError && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600">
          <FiAlertCircle size={20} />
          <span className="text-xs font-black uppercase tracking-widest">Error de autenticación</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Planificación de Rutas</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#87be00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#87be00]"></span>
            </span>
            <p className="text-[#87be00] text-[10px] font-black uppercase tracking-widest">
              {routes.length} Planificaciones activas
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={fetchData} disabled={loading} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-gray-600 transition-all">
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
          
          <button 
            onClick={handleOpenCreate}
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2"
          >
            <FiPlus size={16} />
            Agendar Ruta
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
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Planificación (Día/Fecha)</th>
                <th className="p-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                <th className="p-6 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-[10px] font-black text-gray-300 uppercase">Sincronizando...</td></tr>
              ) : routes.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-[10px] font-black text-gray-300 uppercase italic">No hay rutas registradas</td></tr>
              ) : routes.map((r) => (
                <tr key={r.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-black text-[10px] uppercase">
                        {r.first_name?.charAt(0)}{r.last_name?.charAt(0)}
                      </div>
                      <span className="text-xs font-black text-gray-800 uppercase">{r.first_name} {r.last_name}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{r.cadena}</span>
                      <span className="text-[9px] text-gray-400 uppercase font-bold">{r.direccion || r.local_nombre}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    {/* MEJORA: Detección de Array de días para mostrar una sola fila agrupada */}
                    {r.is_recurring && r.days_array && r.days_array[0] !== null ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[9px] font-black text-[#87be00] uppercase tracking-widest">
                           <FiRefreshCw size={10} /> Recurrente (Semanal)
                        </div>
                        <WeeklyStatus activeDays={r.days_array} />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                           <FiCalendar size={10} /> Fecha Única
                        </div>
                        <span className="text-xs font-black text-gray-800">
                          {r.visit_date ? new Date(r.visit_date).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : 'Sin fecha'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      r.status === 'PENDING' ? 'bg-gray-100 text-gray-400' : 'bg-[#87be00]/10 text-[#87be00]'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => handleOpenEdit(r)}
                      className="p-3 text-gray-300 hover:text-[#87be00] hover:bg-[#87be00]/10 rounded-xl transition-all active:scale-90"
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

      <ManageRoutesModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        users={users} 
        locales={locales} 
        onCreated={fetchData} 
        initialData={selectedRoute} 
      />
    </div>
  );
};

export default AdminRoutes;