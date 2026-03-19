import { useState, useMemo, useEffect } from "react";
import { FiUpload, FiClock, FiCalendar, FiUser, FiMapPin, FiX, FiFilter, FiTrash2 } from "react-icons/fi";
import * as XLSX from "xlsx";
import api from "../api/apiClient";
import toast from "react-hot-toast";

const DAYS_OF_WEEK = [
  { id: 1, label: "Lun" }, { id: 2, label: "Mar" }, { id: 3, label: "Mié" },
  { id: 4, label: "Jue" }, { id: 5, label: "Vie" }, { id: 6, label: "Sáb" }, { id: 0, label: "Dom" }
];

const ManageRoutesModal = ({ isOpen, onClose, users, locales, onCreated, initialData = null }) => {
  const [tab, setTab] = useState("manual");
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const [filters, setFilters] = useState({ region: "", comuna: "", cadena: "" });
  
  const [manualTask, setManualTask] = useState({
    user_id: "",
    local_id: "",
    selectedDays: [], 
    start_time: "09:00",
    visit_date: "" 
  });

  useEffect(() => {
    if (initialData && isOpen) {
      // Si editamos una ruta agrupada, el backend nos manda 'days_array'
      // Si es una ruta simple, nos manda 'day_of_week'
      const activeDays = initialData.days_array 
        ? initialData.days_array.map(Number) 
        : initialData.day_of_week !== undefined ? [Number(initialData.day_of_week)] : [];

      setManualTask({
        user_id: initialData.user_id || "",
        local_id: initialData.local_id || "",
        selectedDays: activeDays,
        start_time: initialData.start_time?.slice(0, 5) || "09:00",
        visit_date: initialData.visit_date || ""
      });
      setTab("manual");
    } else if (!isOpen) {
      setManualTask({ user_id: "", local_id: "", selectedDays: [], start_time: "09:00", visit_date: "" });
      setFilters({ region: "", comuna: "", cadena: "" });
    }
  }, [initialData, isOpen]);

  const filteredLocales = useMemo(() => {
    return locales?.filter(l => {
      return (!filters.region || l.region === filters.region) &&
             (!filters.comuna || l.comuna === filters.comuna) &&
             (!filters.cadena || l.cadena === filters.cadena);
    });
  }, [locales, filters]);

  const uniqueRegions = [...new Set(locales?.map(l => l.region))].filter(Boolean).sort();
  const uniqueComunas = [...new Set(locales?.filter(l => !filters.region || l.region === filters.region).map(l => l.comuna))].filter(Boolean).sort();
  const uniqueCadenas = [...new Set(locales?.map(l => l.cadena))].filter(Boolean).sort();

  // MEJORA: toggleDay ahora permite multiselección siempre
  const toggleDay = (dayId) => {
    setManualTask(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId) 
        ? prev.selectedDays.filter(d => d !== dayId)
        : [...prev.selectedDays, dayId]
    }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualTask.user_id || !manualTask.local_id || manualTask.selectedDays.length === 0) {
      return toast.error("Completa todos los campos, incluyendo al menos un día");
    }

    try {
      setLoading(true);
      if (isEditing) {
        // Al editar, enviamos el array completo de días seleccionados
        // El backend debe procesar esto para actualizar el grupo
        await api.put(`/routes/${initialData.id}`, manualTask);
        toast.success("Planificación actualizada");
      } else {
        await api.post("/routes/bulk", manualTask); 
        toast.success("Rutas programadas con éxito");
      }
      onCreated();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error en la operación");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de eliminar esta planificación completa?")) {
      try {
        setLoading(true);
        // El backend usará el ID para encontrar el grupo y borrarlo
        await api.delete(`/routes/${initialData.id}`);
        toast.success("Planificación eliminada");
        onCreated();
        onClose();
      } catch (error) {
        toast.error("Error al eliminar");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;
  const filteredUsers = users?.filter(u => u.role?.toUpperCase() === 'USUARIO') || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-[Outfit]">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
        
        {!isEditing && (
          <div className="flex border-b border-gray-50 bg-gray-50/50">
            <button onClick={() => setTab("manual")} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${tab === 'manual' ? 'text-[#87be00] border-b-2 border-[#87be00] bg-white' : 'text-gray-400'}`}>Individual / Recurrente</button>
            <button onClick={() => setTab("massive")} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${tab === 'massive' ? 'text-[#87be00] border-b-2 border-[#87be00] bg-white' : 'text-gray-400'}`}>Masivo (Excel)</button>
          </div>
        )}

        <div className="p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-6 text-gray-300 hover:text-gray-600 transition-colors"><FiX size={20} /></button>

          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-800 mb-6 flex items-center gap-2">
            {isEditing ? "Editar Planificación Semanal" : "Nuevo Agendamiento"}
          </h2>

          {tab === "manual" ? (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><FiUser className="text-[#87be00]" /> Reponedor</label>
                  <select required className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none border-2 border-transparent focus:border-[#87be00]/20" value={manualTask.user_id} onChange={(e) => setManualTask({...manualTask, user_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><FiClock className="text-[#87be00]" /> Hora</label>
                  <input type="time" required className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={manualTask.start_time} onChange={(e) => setManualTask({...manualTask, start_time: e.target.value})} />
                </div>
              </div>

              <div className="bg-gray-50/80 p-5 rounded-[2rem] space-y-4 border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><FiFilter className="text-[#87be00]" /> Ubicación</label>
                <div className="grid grid-cols-3 gap-2">
                  <select className="bg-white rounded-xl px-3 py-2 text-[10px] font-bold border border-gray-200" value={filters.region} onChange={(e) => setFilters({...filters, region: e.target.value, comuna: ""})}>
                    <option value="">Región</option>
                    {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select className="bg-white rounded-xl px-3 py-2 text-[10px] font-bold border border-gray-200" value={filters.comuna} onChange={(e) => setFilters({...filters, comuna: e.target.value})}>
                    <option value="">Comuna</option>
                    {uniqueComunas.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="bg-white rounded-xl px-3 py-2 text-[10px] font-bold border border-gray-200" value={filters.cadena} onChange={(e) => setFilters({...filters, cadena: e.target.value})}>
                    <option value="">Cadena</option>
                    {uniqueCadenas.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <select required className="w-full bg-white rounded-2xl px-5 py-4 text-sm font-bold border-2 border-[#87be00]/20" value={manualTask.local_id} onChange={(e) => setManualTask({...manualTask, local_id: e.target.value})}>
                  <option value="">Seleccionar Punto de Venta...</option>
                  {filteredLocales.map(l => (
                    <option key={l.id} value={l.id}>{l.cadena} - {l.nombre || l.direccion}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><FiCalendar className="text-[#87be00]" /> {isEditing ? "Días de Visita (Editar)" : "Días de Visita"}</label>
                <div className="flex justify-between gap-1.5">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${manualTask.selectedDays.includes(day.id) ? 'bg-[#87be00] text-white shadow-lg shadow-[#87be00]/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-black transition-all">
                  {loading ? "Procesando..." : isEditing ? "Guardar Cambios" : "Confirmar Agendamiento"}
                </button>

                {isEditing && (
                  <button type="button" onClick={handleDelete} className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                    <FiTrash2 /> Eliminar Planificación Completa
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="text-center py-10">
               <FiUpload size={40} className="mx-auto text-gray-300" />
               <input type="file" accept=".xlsx, .xls" className="mt-4" />
            </div>
          )}
          
          <button onClick={onClose} className="w-full text-center mt-6 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] hover:text-red-400 transition-colors">Cancelar operación</button>
        </div>
      </div>
    </div>
  );
};

export default ManageRoutesModal;