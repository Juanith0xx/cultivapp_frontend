import React, { useState, useMemo, useEffect } from "react";
import { 
  FiClock, FiX, FiUser, FiBriefcase, 
  FiTrash2, FiLoader, FiCheckCircle, FiLayers, FiTag, FiCalendar 
} from "react-icons/fi";
import api from "../api/apiClient";
import toast from "react-hot-toast";

const DAYS_OF_WEEK = [
  { id: 1, label: "Lun" }, { id: 2, label: "Mar" }, { id: 3, label: "Mié" },
  { id: 4, label: "Jue" }, { id: 5, label: "Vie" }, { id: 6, label: "Sáb" }, { id: 0, label: "Dom" }
];

const ROLES_TURNOS = [
  { id: "MERCADERISTA FULL", label: "Mercaderista Full Time" },
  { id: "MERCADERISTA PT", label: "Mercaderista Part Time" }
];

const ManageRoutesModal = ({ isOpen, onClose, users = [], locales = [], companies = [], onCreated, initialData = null }) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [turnosRaw, setTurnosRaw] = useState([]);
  const [selectedRol, setSelectedRol] = useState("");
  
  const userString = localStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : null;
  const isRoot = currentUser?.role?.toUpperCase() === "ROOT";

  const [filters, setFilters] = useState({ region: "", comuna: "", cadena: "" });
  const [manualTask, setManualTask] = useState({
    user_id: "", local_id: "", company_id: currentUser?.company_id || "",
    selectedDays: [], start_time: "08:00", end_time: "16:00", turno_id: "",
    visit_date: new Date().toISOString().split('T')[0] // 🚩 Fecha por defecto
  });

  // ... (fetchTurnos y turnosAgrupados se mantienen igual)
  const fetchTurnos = async (companyId) => {
    try {
      const targetId = companyId || (isRoot ? manualTask.company_id : currentUser?.company_id);
      if (!targetId) {
        setTurnosRaw([]);
        return;
      }
      const res = await api.get(`/turnos-config?company_id=${targetId}`);
      setTurnosRaw(Array.isArray(res) ? res : []);
    } catch (error) { 
      setTurnosRaw([]);
    }
  };

  useEffect(() => { 
    if (isOpen) fetchTurnos(manualTask.company_id);
  }, [isOpen, manualTask.company_id]);

  const turnosAgrupados = useMemo(() => {
    if (!selectedRol || selectedRol === "INDIVIDUAL") return [];
    const filtradosPorRol = turnosRaw.filter(t => t.categoria_rol?.toString().toUpperCase() === selectedRol.toUpperCase());
    const agrupados = filtradosPorRol.reduce((acc, curr) => {
      if (!acc[curr.nombre_turno]) {
        acc[curr.nombre_turno] = { nombre: curr.nombre_turno, entrada: curr.entrada, salida: curr.salida, dias: [] };
      }
      acc[curr.nombre_turno].dias.push(curr.day_of_week);
      return acc;
    }, {});
    return Object.values(agrupados);
  }, [turnosRaw, selectedRol]);

  const handleTurnoChange = (e) => {
    const nombreTurno = e.target.value;
    if (nombreTurno === "INDIVIDUAL") {
      setManualTask(prev => ({ ...prev, turno_id: "INDIVIDUAL", selectedDays: [] }));
      return;
    }
    if (!nombreTurno) {
      setManualTask(prev => ({ ...prev, turno_id: "", selectedDays: [] }));
      return;
    }
    const t = turnosAgrupados.find(item => item.nombre === nombreTurno);
    if (t) {
      setManualTask(prev => ({
        ...prev,
        turno_id: nombreTurno,
        start_time: t.entrada ? t.entrada.slice(0, 5) : "08:00",
        end_time: t.salida ? t.salida.slice(0, 5) : "16:00",
        selectedDays: t.dias.map(Number)
      }));
    }
  };

  const toggleDay = (dayId) => {
    setManualTask(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId) ? prev.selectedDays.filter(d => d !== dayId) : [...prev.selectedDays, dayId]
    }));
  };

  // ... (Filtros se mantienen igual)
  const filteredUsers = useMemo(() => {
    let pool = users.filter(u => u.role?.toUpperCase() === 'USUARIO');
    if (isRoot && manualTask.company_id) pool = pool.filter(u => u.company_id === manualTask.company_id);
    return pool;
  }, [users, manualTask.company_id, isRoot]);

  const filteredLocales = useMemo(() => locales.filter(l => (
    (!filters.region || l.region === filters.region) &&
    (!filters.comuna || l.comuna === filters.comuna) &&
    (!filters.cadena || l.cadena === filters.cadena) &&
    (!isRoot || !manualTask.company_id || l.company_id === manualTask.company_id)
  )), [locales, filters, isRoot, manualTask.company_id]);

  const uniqueRegions = useMemo(() => [...new Set(filteredLocales.map(l => l.region))].filter(Boolean).sort(), [filteredLocales]);
  const uniqueComunas = useMemo(() => [...new Set(filteredLocales.filter(l => !filters.region || l.region === filters.region).map(l => l.comuna))].filter(Boolean).sort(), [filteredLocales, filters.region]);
  const uniqueCadenas = useMemo(() => [...new Set(filteredLocales.map(l => l.cadena))].filter(Boolean).sort(), [filteredLocales]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const isManual = selectedRol === "INDIVIDUAL" || manualTask.turno_id === "INDIVIDUAL";
    
    if (!isManual && manualTask.selectedDays.length === 0) {
      return toast.error("Selecciona los días para el turno");
    }

    setLoading(true);
    try {
      const data = { 
        ...manualTask, 
        categoria_rol: selectedRol, 
        is_recurring: !isManual,
        // Si es manual, nos aseguramos de que el día de la semana sea el de la fecha elegida
        day_of_week: isManual ? new Date(manualTask.visit_date + "T12:00:00").getDay() : null,
        origin: isManual ? 'INDIVIDUAL' : 'TURNO'
      };

      if (isEditing) await api.put(`/routes/${initialData.id}`, data);
      else await api.post("/routes", data);
      
      onCreated();
      onClose();
      toast.success(isManual ? "Visita individual agendada" : "Turno planificado correctamente");
    } catch (error) { 
      toast.error("Error al guardar"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro?")) return;
    setIsDeleting(true);
    try {
      await api.delete(`/routes/${initialData.id}`);
      onCreated();
      onClose();
      toast.success("Eliminado");
    } catch (error) { toast.error("Error"); }
    finally { setIsDeleting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 font-[Outfit]">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
        <div className="p-10 relative">
          <button onClick={onClose} className="absolute top-6 right-8 text-gray-400 hover:text-gray-900 transition-colors"><FiX size={24} /></button>
          <h2 className="text-xl font-black uppercase tracking-tighter text-gray-800 mb-8 italic leading-none">
            {isEditing ? "Gestionar Planificación" : "Nueva Planificación"}
          </h2>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            {/* SECTOR ROOT (Empresa) */}
            {isRoot && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#87be00] uppercase tracking-widest ml-1 flex items-center gap-2"><FiBriefcase /> Empresa Cliente</label>
                <select required className="w-full bg-green-50/40 rounded-2xl px-5 py-4 text-sm font-bold border-2 border-transparent outline-none focus:border-[#87be00]/20" value={manualTask.company_id} onChange={(e) => { setManualTask({...manualTask, company_id: e.target.value, user_id: "", turno_id: "", selectedDays: []}); setSelectedRol(""); }}>
                  <option value="">Seleccionar Empresa...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* SECTOR TURNOS / INDIVIDUAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/40 p-6 rounded-[2.5rem] border border-blue-100/50 shadow-inner">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2"><FiTag /> Tipo de Rol</label>
                    <select required className="w-full bg-white rounded-xl px-4 py-4 text-sm font-bold border border-blue-100 outline-none focus:ring-2 focus:ring-blue-200" value={selectedRol} onChange={(e) => { setSelectedRol(e.target.value); setManualTask(prev => ({...prev, turno_id: "", selectedDays: []})) }}>
                      <option value="">Seleccionar Rol...</option>
                      <option value="INDIVIDUAL" className="text-amber-600 font-black">Individual / Manual</option>
                      {ROLES_TURNOS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2"><FiLayers /> Turno</label>
                    <select className="w-full bg-white rounded-xl px-4 py-4 text-sm font-bold border border-blue-100 outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50" value={manualTask.turno_id} onChange={handleTurnoChange} disabled={!selectedRol}>
                      <option value="">{selectedRol === "INDIVIDUAL" ? "Visita Única" : (selectedRol ? (turnosAgrupados.length > 0 ? "Elegir Turno..." : "No hay turnos") : "Elige Rol primero")}</option>
                      {selectedRol === "INDIVIDUAL" ? (
                         <option value="INDIVIDUAL">Sin Turno (Manual)</option>
                      ) : (
                         turnosAgrupados.map(t => <option key={t.nombre} value={t.nombre}>{t.nombre}</option>)
                      )}
                    </select>
                </div>
            </div>

            {/* 🚩 SELECTOR DE FECHA (Solo si es Individual) */}
            {selectedRol === "INDIVIDUAL" && (
              <div className="space-y-1 animate-in fade-in slide-in-from-left-2">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FiCalendar /> Fecha de la Visita
                </label>
                <input 
                  type="date" 
                  required 
                  className="w-full bg-amber-50/50 rounded-2xl px-5 py-4 text-sm font-bold border-2 border-amber-100 outline-none focus:border-amber-300"
                  value={manualTask.visit_date}
                  onChange={(e) => setManualTask({...manualTask, visit_date: e.target.value})}
                />
              </div>
            )}

            {/* REPONEDOR Y HORARIOS */}
            <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FiUser /> Reponedor Asignado</label>
                <select required className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-2 border-transparent focus:border-gray-200 outline-none" value={manualTask.user_id} onChange={(e) => setManualTask({...manualTask, user_id: e.target.value})} disabled={isRoot && !manualTask.company_id}>
                  <option value="">Seleccionar Reponedor...</option>
                  {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FiClock /> Entrada</label>
                <input type="time" required className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-2 border-transparent focus:border-gray-200 outline-none" value={manualTask.start_time} onChange={(e) => setManualTask({...manualTask, start_time: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FiClock /> Salida</label>
                <input type="time" required className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-2 border-transparent focus:border-gray-200 outline-none" value={manualTask.end_time} onChange={(e) => setManualTask({...manualTask, end_time: e.target.value})} />
              </div>
            </div>

            {/* LOCALES */}
            <div className="bg-gray-50/80 p-4 rounded-[2rem] border border-gray-100 space-y-3 shadow-inner">
              <div className="grid grid-cols-3 gap-2">
                <select className="bg-white rounded-xl p-2 text-[9px] font-black outline-none border border-transparent focus:border-[#87be00]/30" value={filters.region} onChange={(e) => setFilters({...filters, region: e.target.value, comuna: ""})}>
                  <option value="">Región</option>
                  {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className="bg-white rounded-xl p-2 text-[9px] font-black outline-none border border-transparent focus:border-[#87be00]/30" value={filters.comuna} onChange={(e) => setFilters({...filters, comuna: e.target.value})}>
                  <option value="">Comuna</option>
                  {uniqueComunas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="bg-white rounded-xl p-2 text-[9px] font-black outline-none border border-transparent focus:border-[#87be00]/30" value={filters.cadena} onChange={(e) => setFilters({...filters, cadena: e.target.value})}>
                  <option value="">Cadena</option>
                  {uniqueCadenas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select required className="w-full bg-white rounded-xl px-5 py-4 text-sm font-bold border-2 border-[#87be00]/20 outline-none focus:border-[#87be00]" value={manualTask.local_id} onChange={(e) => setManualTask({...manualTask, local_id: e.target.value})} disabled={isRoot && !manualTask.company_id}>
                <option value="">Seleccionar Local...</option>
                {filteredLocales.map(l => <option key={l.id} value={l.id}>{l.cadena} - {l.direccion}</option>)}
              </select>
            </div>

            {/* DÍAS (Solo para Turnos) */}
            {selectedRol !== "INDIVIDUAL" && (
              <div className="flex justify-between gap-1 animate-in slide-in-from-top-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button key={day.id} type="button" onClick={() => toggleDay(day.id)} className={`flex-1 py-3 rounded-xl text-[9px] font-black transition-all ${manualTask.selectedDays.includes(day.id) ? 'bg-[#87be00] text-white shadow-md scale-105' : 'bg-gray-100 text-gray-400'}`}>
                    {day.label}
                  </button>
                ))}
              </div>
            )}

            {/* ACCIONES */}
            <div className="space-y-3 pt-2">
              <button type="submit" disabled={loading || isDeleting} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading && !isDeleting ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                {isEditing ? "Actualizar Planificación" : "Confirmar Agendamiento"}
              </button>
              {isEditing && (
                <button type="button" onClick={handleDelete} disabled={loading || isDeleting} className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isDeleting ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                  {isDeleting ? "Eliminando..." : "Eliminar Ruta Definitivamente"}
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