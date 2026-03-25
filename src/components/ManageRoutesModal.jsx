import React, { useState, useMemo, useEffect } from "react";
import { 
  FiClock, FiX, FiUser, FiBriefcase, 
  FiTrash2, FiLoader, FiCheckCircle 
} from "react-icons/fi";
import api from "../api/apiClient";
import toast from "react-hot-toast";

const DAYS_OF_WEEK = [
  { id: 1, label: "Lun" }, { id: 2, label: "Mar" }, { id: 3, label: "Mié" },
  { id: 4, label: "Jue" }, { id: 5, label: "Vie" }, { id: 6, label: "Sáb" }, { id: 0, label: "Dom" }
];

const ManageRoutesModal = ({ 
  isOpen, 
  onClose, 
  users = [], 
  locales = [], 
  companies = [], 
  onCreated, 
  initialData = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = !!initialData;
  
  const userString = localStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : null;
  const isRoot = currentUser?.role?.toUpperCase() === "ROOT";

  const [filters, setFilters] = useState({ region: "", comuna: "", cadena: "" });
  const [manualTask, setManualTask] = useState({
    user_id: "",
    local_id: "",
    company_id: "",
    selectedDays: [], 
    start_time: "09:00"
  });

  /* =========================================================
     🔄 EFECTO DE CARGA INICIAL
  ========================================================= */
  useEffect(() => {
    if (!isOpen) {
      setManualTask({ user_id: "", local_id: "", company_id: "", selectedDays: [], start_time: "09:00" });
      setFilters({ region: "", comuna: "", cadena: "" });
      return;
    }

    if (initialData) {
      const companyId = initialData.company_id?.toString() || "";
      const userId = initialData.user_id?.toString() || "";
      const localId = initialData.local_id?.toString() || "";
      const startTime = initialData.start_time?.slice(0, 5) || "09:00";

      let days = [];
      if (Array.isArray(initialData.selectedDays)) days = initialData.selectedDays.map(Number);
      else if (initialData.day_of_week !== undefined) days = [Number(initialData.day_of_week)];

      setManualTask({
        company_id: companyId,
        user_id: userId,
        local_id: localId,
        selectedDays: days,
        start_time: startTime
      });

      const foundLocal = locales.find(l => l.id === localId);
      if (foundLocal) {
        setFilters({
          region: foundLocal.region || "",
          comuna: foundLocal.comuna || "",
          cadena: foundLocal.cadena || ""
        });
      }
    }
  }, [isOpen, initialData, locales]);

  /* =========================================================
     🔍 FILTRADO DINÁMICO
  ========================================================= */
  const filteredUsers = useMemo(() => {
    let pool = users.filter(u => u.role?.toUpperCase() === 'USUARIO');
    if (isRoot && manualTask.company_id) {
      pool = pool.filter(u => u.company_id === manualTask.company_id);
    }
    return pool;
  }, [users, manualTask.company_id, isRoot]);

  const filteredLocales = useMemo(() => {
    return locales.filter(l => (
      (!filters.region || l.region === filters.region) &&
      (!filters.comuna || l.comuna === filters.comuna) &&
      (!filters.cadena || l.cadena === filters.cadena)
    ));
  }, [locales, filters]);

  const uniqueRegions = useMemo(() => [...new Set(locales.map(l => l.region))].filter(Boolean).sort(), [locales]);
  const uniqueComunas = useMemo(() => [...new Set(locales.filter(l => !filters.region || l.region === filters.region).map(l => l.comuna))].filter(Boolean).sort(), [locales, filters.region]);
  const uniqueCadenas = useMemo(() => [...new Set(locales.map(l => l.cadena))].filter(Boolean).sort(), [locales]);

  const toggleDay = (dayId) => {
    setManualTask(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId) ? prev.selectedDays.filter(d => d !== dayId) : [...prev.selectedDays, dayId]
    }));
  };

  /* =========================================================
     💾 GUARDAR / ACTUALIZAR
  ========================================================= */
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualTask.selectedDays.length === 0) return toast.error("Selecciona al menos un día");

    try {
      setLoading(true);
      const data = { ...manualTask, is_recurring: true };
      
      if (isEditing) {
        await api.put(`/routes/${initialData.id}`, data);
      } else {
        await api.post("/routes", data);
      }
      
      toast.success(isEditing ? "Planificación actualizada" : "Agendamiento creado");
      onCreated();
      onClose();
    } catch (error) { 
      toast.error(error.message || "Error al procesar"); 
    } finally { 
      setLoading(false); 
    }
  };

  /* =========================================================
     🗑️ ELIMINAR RUTA
  ========================================================= */
  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de eliminar esta planificación?")) return;

    try {
      setLoading(true);
      setIsDeleting(true);
      await api.delete(`/routes/${initialData.id}`);
      
      toast.success("Ruta eliminada correctamente");
      onCreated();
      onClose();
    } catch (error) {
      toast.error("No se pudo eliminar la ruta");
    } finally {
      setLoading(false);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 font-[Outfit]">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
        <div className="p-10 relative">
          <button onClick={onClose} className="absolute top-6 right-8 text-gray-300 hover:text-gray-600 transition-colors">
            <FiX size={24} />
          </button>
          
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800 mb-8 italic flex items-center gap-2">
            {isEditing ? "Editar Planificación" : "Nueva Planificación"}
            {isEditing && <span className="bg-orange-100 text-orange-600 text-[8px] not-italic px-2 py-1 rounded-md">MODO EDICIÓN</span>}
          </h2>

          <form onSubmit={handleManualSubmit} className="space-y-6">
            
            {/* SELECTOR DE EMPRESA (ROOT) */}
            {isRoot && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#87be00] uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FiBriefcase /> Empresa Cliente
                </label>
                <select 
                  required 
                  className="w-full bg-green-50/40 rounded-2xl px-5 py-4 text-sm font-bold border-2 border-transparent focus:border-[#87be00]/20 outline-none transition-all" 
                  value={manualTask.company_id} 
                  onChange={(e) => setManualTask({...manualTask, company_id: e.target.value, user_id: ""})}
                >
                  <option value="">Seleccionar Empresa...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FiUser /> Reponedor
                </label>
                <select 
                  required 
                  className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none border-2 border-transparent focus:border-gray-200" 
                  value={manualTask.user_id} 
                  onChange={(e) => setManualTask({...manualTask, user_id: e.target.value})} 
                  disabled={isRoot && !manualTask.company_id}
                >
                  <option value="">Seleccionar...</option>
                  {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FiClock /> Hora de Inicio
                </label>
                <input 
                  type="time" 
                  required 
                  className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none border-2 border-transparent focus:border-gray-200" 
                  value={manualTask.start_time} 
                  onChange={(e) => setManualTask({...manualTask, start_time: e.target.value})} 
                />
              </div>
            </div>

            {/* FILTROS GEOGRÁFICOS */}
            <div className="bg-gray-50/80 p-6 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-inner">
              <div className="grid grid-cols-3 gap-2">
                <select className="bg-white rounded-xl p-3 text-[10px] font-black outline-none shadow-sm" value={filters.region} onChange={(e) => setFilters({...filters, region: e.target.value, comuna: ""})}>
                  <option value="">Región</option>
                  {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className="bg-white rounded-xl p-3 text-[10px] font-black outline-none shadow-sm" value={filters.comuna} onChange={(e) => setFilters({...filters, comuna: e.target.value})}>
                  <option value="">Comuna</option>
                  {uniqueComunas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="bg-white rounded-xl p-3 text-[10px] font-black outline-none shadow-sm" value={filters.cadena} onChange={(e) => setFilters({...filters, cadena: e.target.value})}>
                  <option value="">Cadena</option>
                  {uniqueCadenas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select 
                required 
                className="w-full bg-white rounded-2xl px-6 py-5 text-sm font-bold border-2 border-[#87be00]/20 shadow-sm focus:border-[#87be00] outline-none transition-all" 
                value={manualTask.local_id} 
                onChange={(e) => setManualTask({...manualTask, local_id: e.target.value})}
              >
                <option value="">Seleccionar Local en Sala...</option>
                {filteredLocales.map(l => <option key={l.id} value={l.id}>{l.cadena} - {l.direccion}</option>)}
              </select>
            </div>

            {/* DÍAS DE LA SEMANA */}
            <div className="flex justify-between gap-1.5">
              {DAYS_OF_WEEK.map((day) => (
                <button 
                  key={day.id} 
                  type="button" 
                  onClick={() => toggleDay(day.id)} 
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black transition-all ${manualTask.selectedDays.includes(day.id) ? 'bg-[#87be00] text-white shadow-lg shadow-[#87be00]/30' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="space-y-3 pt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading && !isDeleting ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                {loading && !isDeleting ? "Procesando..." : isEditing ? "Guardar Cambios" : "Confirmar Agendamiento"}
              </button>

              {isEditing && (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                  {isDeleting ? "Eliminando..." : "Eliminar Planificación"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageRoutesModal;