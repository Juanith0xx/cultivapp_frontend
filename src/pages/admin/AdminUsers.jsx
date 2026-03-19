import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiTrash2, FiCalendar, FiClock, FiUser, FiMapPin, FiRepeat } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado del Formulario
  const [formData, setFormData] = useState({
    user_id: "",
    local_id: "",
    start_time: "09:00",
    visit_date: "",        // Para fecha única
    selectedDays: [],      // Para recurrentes
    is_recurring: false    // Switch de modo
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [routesData, usersData, localesData] = await Promise.all([
        api.get("routes"),
        api.get("users"),
        api.get("locales")
      ]);
      setRoutes(routesData);
      setUsers(usersData.filter(u => u.role === "USUARIO"));
      setLocales(localesData);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.user_id || !formData.local_id) return toast.error("Usuario y Local son obligatorios");
      
      // Validación según tipo
      if (!formData.is_recurring && !formData.visit_date) return toast.error("Seleccione una fecha");
      if (formData.is_recurring && formData.selectedDays.length === 0) return toast.error("Seleccione al menos un día");

      await api.post("routes", formData);
      toast.success("Ruta agendada correctamente");
      setIsModalOpen(false);
      setFormData({ user_id: "", local_id: "", start_time: "09:00", visit_date: "", selectedDays: [], is_recurring: false });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteRoute = async (id) => {
    if (!window.confirm("¿Eliminar esta planificación?")) return;
    try {
      await api.delete(`routes/${id}`);
      toast.success("Eliminado");
      fetchData();
    } catch (error) { toast.error("No se pudo eliminar"); }
  };

  const toggleDay = (day) => {
    const current = formData.selectedDays;
    setFormData({
      ...formData,
      selectedDays: current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    });
  };

  return (
    <div className="p-6 space-y-6 font-[Outfit]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Planificación de Rutas</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Asigna locales a tus mercaderistas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#87be00] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-[#87be00]/20"
        >
          <FiPlus size={18} /> Nueva Asignación
        </button>
      </div>

      {/* TABLA DE RUTAS */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Mercaderista</th>
              <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Punto de Venta</th>
              <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Tipo / Fecha</th>
              <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {routes.map(route => (
              <tr key={route.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-500 text-xs uppercase">
                      {route.first_name?.[0]}{route.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800 uppercase leading-none">{route.first_name} {route.last_name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">ID: {route.user_rut}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <p className="text-sm font-black text-gray-700 uppercase leading-none">{route.cadena}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{route.direccion}</p>
                </td>
                <td className="p-5">
                  {route.is_recurring ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-black uppercase w-fit">Recurrente</span>
                      <p className="text-[10px] font-bold text-gray-400">Días: {route.days_array?.join(', ')}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full font-black uppercase w-fit">Fecha Única</span>
                      <p className="text-[10px] font-bold text-gray-400 uppercase italic">{new Date(route.visit_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </td>
                <td className="p-5 text-right">
                  <button onClick={() => deleteRoute(route.id)} className="p-3 text-gray-300 hover:text-red-500 transition-colors">
                    <FiTrash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CREACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6 flex items-center gap-2">
              <FiCalendar className="text-[#87be00]" /> Agendar Visita
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mercaderista */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Mercaderista</label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm"
                  value={formData.user_id}
                  onChange={e => setFormData({...formData, user_id: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                </select>
              </div>

              {/* Local */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Punto de Venta</label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm"
                  value={formData.local_id}
                  onChange={e => setFormData({...formData, local_id: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {locales.map(l => <option key={l.id} value={l.id}>{l.cadena} - {l.direccion}</option>)}
                </select>
              </div>

              {/* SWITCH TIPO DE RUTA */}
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, is_recurring: false, selectedDays: []})}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${!formData.is_recurring ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                >
                  Fecha Única
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, is_recurring: true, visit_date: ""})}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${formData.is_recurring ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                >
                  Recurrente
                </button>
              </div>

              {/* CONFIGURACIÓN DE FECHA O DÍAS */}
              {!formData.is_recurring ? (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">¿Cuándo?</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20"
                    value={formData.visit_date}
                    onChange={e => setFormData({...formData, visit_date: e.target.value})}
                  />
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Días de la Semana</label>
                  <div className="flex justify-between gap-1">
                    {[1,2,3,4,5,6,0].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`w-9 h-9 rounded-full font-black text-[10px] transition-all ${formData.selectedDays.includes(d) ? 'bg-[#87be00] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                      >
                        {['D','L','M','X','J','V','S'][d]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hora */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Hora de Inicio Estimada</label>
                <input 
                  type="time" 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none"
                  value={formData.start_time}
                  onChange={e => setFormData({...formData, start_time: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                >
                  Confirmar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoutes;