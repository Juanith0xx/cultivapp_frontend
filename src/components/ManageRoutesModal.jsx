import React, { useState, useMemo, useEffect } from "react";
import { 
  FiClock, FiX, FiUser, FiBriefcase, 
  FiTrash2, FiLoader, FiCheckCircle, FiLayers, FiTag 
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
  const [turnosRaw, setTurnosRaw] = useState([]); // Data pura de la DB
  const [selectedRol, setSelectedRol] = useState("");
  
  const userString = localStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : null;
  const isRoot = currentUser?.role?.toUpperCase() === "ROOT";

  const [filters, setFilters] = useState({ region: "", comuna: "", cadena: "" });
  const [manualTask, setManualTask] = useState({
    user_id: "", local_id: "", company_id: currentUser?.company_id || "",
    selectedDays: [], start_time: "08:00", end_time: "16:00", turno_id: ""
  });

  /* =========================================================
     🔄 CARGA Y AGRUPACIÓN DE TURNOS
  ========================================================= */
  const fetchTurnos = async () => {
    try {
      const targetId = isRoot ? manualTask.company_id : currentUser?.company_id;
      if (!targetId) return;
      const res = await api.get(`/turnos-config?company_id=${targetId}`);
      setTurnosRaw(Array.isArray(res) ? res : []);
    } catch (error) { console.error("Error al cargar turnos"); }
  };

  useEffect(() => { if (isOpen) fetchTurnos(); }, [isOpen, manualTask.company_id]);

  // 🚩 Agrupamos los turnos por nombre para que el Select sea limpio
  const turnosAgrupados = useMemo(() => {
    if (!selectedRol) return [];
    
    const filtradosPorRol = turnosRaw.filter(t => 
      t.categoria_rol?.toString().toUpperCase() === selectedRol.toUpperCase()
    );

    const agrupados = filtradosPorRol.reduce((acc, curr) => {
      if (!acc[curr.nombre_turno]) {
        acc[curr.nombre_turno] = {
          nombre: curr.nombre_turno,
          entrada: curr.entrada,
          salida: curr.salida,
          dias: []
        };
      }
      acc[curr.nombre_turno].dias.push(curr.day_of_week);
      return acc;
    }, {});

    return Object.values(agrupados);
  }, [turnosRaw, selectedRol]);

  /* =========================================================
     🚀 ACCIÓN AUTOMÁTICA AL SELECCIONAR
  ========================================================= */
  const handleTurnoChange = (e) => {
    const nombreTurno = e.target.value;
    if (!nombreTurno) {
      setManualTask(prev => ({ ...prev, turno_id: "", selectedDays: [] }));
      return;
    }

    const t = turnosAgrupados.find(item => item.nombre === nombreTurno);
    if (t) {
      setManualTask(prev => ({
        ...prev,
        turno_id: nombreTurno, // Usamos el nombre como ID de referencia
        start_time: t.entrada ? t.entrada.slice(0, 5) : "08:00",
        end_time: t.salida ? t.salida.slice(0, 5) : "16:00",
        selectedDays: t.dias.map(Number) // 🚩 ESTO ILUMINA LOS DÍAS EN VERDE
      }));
      toast.success(`Turno ${t.nombre} configurado`);
    }
  };

  /* =========================================================
     🔍 FILTRADO GEOGRÁFICO Y USUARIOS
  ========================================================= */
  const filteredUsers = useMemo(() => {
    let pool = users.filter(u => u.role?.toUpperCase() === 'USUARIO');
    if (isRoot && manualTask.company_id) pool = pool.filter(u => u.company_id === manualTask.company_id);
    return pool;
  }, [users, manualTask.company_id, isRoot]);

  const filteredLocales = useMemo(() => locales.filter(l => (
    (!filters.region || l.region === filters.region) &&
    (!filters.comuna || l.comuna === filters.comuna) &&
    (!filters.cadena || l.cadena === filters.cadena)
  )), [locales, filters]);

  const uniqueRegions = useMemo(() => [...new Set(locales.map(l => l.region))].filter(Boolean).sort(), [locales]);
  const uniqueComunas = useMemo(() => [...new Set(locales.filter(l => !filters.region || l.region === filters.region).map(l => l.comuna))].filter(Boolean).sort(), [locales, filters.region]);
  const uniqueCadenas = useMemo(() => [...new Set(locales.map(l => l.cadena))].filter(Boolean).sort(), [locales]);

  const toggleDay = (dayId) => {
    setManualTask(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId) ? prev.selectedDays.filter(d => d !== dayId) : [...prev.selectedDays, dayId]
    }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualTask.selectedDays.length === 0) return toast.error("Selecciona los días");
    setLoading(true);
    try {
      const data = { ...manualTask, categoria_rol: selectedRol, is_recurring: true };
      if (isEditing) await api.put(`/routes/${initialData.id}`, data);
      else await api.post("/routes", data);
      onCreated();
      onClose();
      toast.success("Planificación exitosa");
    } catch (error) { toast.error("Error al guardar"); } 
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 font-[Outfit]">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
        <div className="p-10 relative">
          <button onClick={onClose} className="absolute top-6 right-8 text-gray-400 hover:text-gray-900 transition-colors"><FiX size={24} /></button>
          <h2 className="text-xl font-black uppercase tracking-tighter text-gray-800 mb-8 italic leading-none">Nueva Planificación</h2>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            
            {/* 1. SELECCIÓN DE ROL Y TURNO (LIMPIO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/40 p-6 rounded-[2.5rem] border border-blue-100/50">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2"><FiTag /> Tipo de Rol</label>
                    <select required className="w-full bg-white rounded-xl px-4 py-4 text-sm font-bold border border-blue-100 outline-none focus:ring-2 focus:ring-blue-200" value={selectedRol} onChange={(e) => { setSelectedRol(e.target.value); setManualTask(prev => ({...prev, turno_id: ""})) }}>
                      <option value="">Seleccionar Rol...</option>
                      {ROLES_TURNOS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2"><FiLayers /> Turno</label>
                    <select className="w-full bg-white rounded-xl px-4 py-4 text-sm font-bold border border-blue-100 outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50" value={manualTask.turno_id} onChange={handleTurnoChange} disabled={!selectedRol}>
                      <option value="">{selectedRol ? (turnosAgrupados.length > 0 ? "Elegir Turno..." : "No hay turnos") : "Elige Rol primero"}</option>
                      {turnosAgrupados.map(t => (
                        <option key={t.nombre} value={t.nombre}>{t.nombre}</option>
                      ))}
                    </select>
                </div>
            </div>

            {/* 2. REPONEDOR */}
            <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FiUser /> Reponedor Asignado</label>
                <select required className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-2 border-transparent focus:border-gray-200 outline-none" value={manualTask.user_id} onChange={(e) => setManualTask({...manualTask, user_id: e.target.value})}>
                  <option value="">Seleccionar Reponedor...</option>
                  {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                </select>
            </div>

            {/* 3. HORARIOS (AUTOMÁTICOS) */}
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

            {/* 4. LOCAL */}
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
              <select required className="w-full bg-white rounded-xl px-5 py-4 text-sm font-bold border-2 border-[#87be00]/20 outline-none focus:border-[#87be00]" value={manualTask.local_id} onChange={(e) => setManualTask({...manualTask, local_id: e.target.value})}>
                <option value="">Seleccionar Local...</option>
                {filteredLocales.map(l => <option key={l.id} value={l.id}>{l.cadena} - {l.direccion} ({l.codigo_local})</option>)}
              </select>
            </div>

            {/* 5. DÍAS (VERDES AUTOMÁTICOS) */}
            <div className="flex justify-between gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <button key={day.id} type="button" onClick={() => toggleDay(day.id)} className={`flex-1 py-3 rounded-xl text-[9px] font-black transition-all ${manualTask.selectedDays.includes(day.id) ? 'bg-[#87be00] text-white shadow-md scale-105' : 'bg-gray-100 text-gray-400'}`}>
                  {day.label}
                </button>
              ))}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
              {loading ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
              {isEditing ? "Actualizar Planificación" : "Confirmar Agendamiento"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageRoutesModal;