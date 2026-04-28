import { useState, useEffect, useMemo } from "react";
import api from "../../api/apiClient";
import { FiPlus, FiTrash2, FiClock, FiLayers, FiLoader, FiCheck, FiEdit3, FiShield, FiBriefcase, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const TurnosManager = () => {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [companies, setCompanies] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(null); 

  const initialFormState = {
    nombre_turno: "",
    categoria_rol: "Mercaderista Full",
    days: [], 
    entrada: "07:30",
    salida: "15:30",
    company_id: "" 
  };

  const [newTurno, setNewTurno] = useState(initialFormState);

  const diasCompletos = [
    { label: "D", id: 0 }, { label: "L", id: 1 }, { label: "M", id: 2 },
    { label: "M", id: 3 }, { label: "J", id: 4 }, { label: "V", id: 5 }, { label: "S", id: 6 },
  ];

  const fetchCompanies = async () => {
    if (user?.role !== "ROOT") return;
    try {
      const res = await api.get("/companies");
      setCompanies(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error al cargar empresas:", err);
    }
  };

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/turnos-config");
      setTurnos(Array.isArray(res) ? res : []);
    } catch (err) {
      toast.error("Error al cargar turnos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTurnos(); 
    fetchCompanies(); 
  }, [user]);

  const turnosAgrupados = useMemo(() => {
    const grupos = turnos.reduce((acc, current) => {
      const key = `${current.nombre_turno.toUpperCase()}-${current.company_id}`;
      if (!acc[key]) {
        acc[key] = {
          ...current,
          dias: [current.day_of_week],
          ids: [current.id]
        };
      } else {
        acc[key].dias.push(current.day_of_week);
        acc[key].ids.push(current.id);
      }
      return acc;
    }, {});
    return Object.values(grupos);
  }, [turnos]);

  const handleEdit = (turnoGrupo) => {
    setNewTurno({
      nombre_turno: turnoGrupo.nombre_turno,
      categoria_rol: turnoGrupo.categoria_rol,
      days: turnoGrupo.dias,
      entrada: turnoGrupo.entrada.slice(0, 5),
      salida: turnoGrupo.salida.slice(0, 5),
      company_id: turnoGrupo.company_id 
    });
    setIsEditing(turnoGrupo.nombre_turno);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDay = (dayIndex) => {
    setNewTurno(prev => ({
      ...prev,
      days: prev.days.includes(dayIndex)
        ? prev.days.filter(d => d !== dayIndex)
        : [...prev.days, dayIndex]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newTurno.days.length === 0) return toast.error("Selecciona al menos un día");
    if (user?.role === "ROOT" && !newTurno.company_id) return toast.error("Debes seleccionar una empresa");

    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/turnos-config/bulk/${isEditing}`, newTurno);
        toast.success("Turno actualizado");
      } else {
        await api.post("/turnos-config/bulk", newTurno);
        toast.success("Configuración guardada");
      }
      setNewTurno(initialFormState);
      setShowForm(false);
      setIsEditing(null);
      fetchTurnos();
    } catch (err) {
      toast.error("Error al procesar solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGrupo = async (ids) => {
    if (!confirm(`¿Eliminar este turno completo?`)) return;
    try {
      await Promise.all(ids.map(id => api.delete(`/turnos-config/${id}`)));
      toast.success("Turno eliminado");
      fetchTurnos();
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  return (
    // 🚩 Ajustamos el padding horizontal en móviles (px-3 sm:px-6)
    <div className="p-3 sm:p-6 space-y-6 md:space-y-8 font-[Outfit] max-w-7xl mx-auto pb-20">
      
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center text-white ${user?.role === 'ROOT' ? 'bg-blue-600' : 'bg-[#87be00]'} shadow-lg`}>
                {user?.role === 'ROOT' ? <FiShield className="text-xl md:text-2xl" /> : <FiLayers className="text-xl md:text-2xl" />}
            </div>
            <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tighter truncate">
                    {user?.role === 'ROOT' ? "Configuración Global" : isEditing ? "Editando Turno" : "Gestión Turnos"}
                </h1>
                <p className="text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] truncate">
                    {user?.role === 'ROOT' ? "Multi-empresa" : "Horarios Cultivapp"}
                </p>
            </div>
        </div>
        <button 
          onClick={() => {
              setShowForm(!showForm);
              if (showForm) { setIsEditing(null); setNewTurno(initialFormState); }
          }}
          className={`w-full md:w-auto px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${
            showForm ? "bg-red-50 text-red-500 border border-red-100" : "bg-black text-white active:scale-95"
          }`}
        >
          {showForm ? <><FiX /> CANCELAR</> : <><FiPlus size={18}/> CREAR TURNO</>}
        </button>
      </div>

      {/* FORMULARIO RESPONSIVO */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            
            {/* COLUMNA IZQUIERDA (CONFIG) */}
            <div className="lg:col-span-4 space-y-4 md:space-y-6">
              {user?.role === "ROOT" && (
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-2">
                    <FiBriefcase /> Empresa Cliente
                  </label>
                  <select 
                    required
                    disabled={!!isEditing}
                    className={`w-full p-3 md:p-4 rounded-xl md:rounded-2xl text-xs font-black border-2 outline-none transition-all ${isEditing ? 'bg-gray-100 text-gray-400 border-transparent' : 'bg-blue-50 border-blue-100 focus:border-blue-400 text-blue-900'}`}
                    value={newTurno.company_id}
                    onChange={e => setNewTurno({...newTurno, company_id: e.target.value})}
                  >
                    <option value="">SELECCIONAR EMPRESA...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Rol Operativo</label>
                <select 
                  className="w-full p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-xs font-black border-2 border-transparent focus:border-[#87be00] outline-none transition-all"
                  value={newTurno.categoria_rol}
                  onChange={e => setNewTurno({...newTurno, categoria_rol: e.target.value})}
                >
                  <option value="Mercaderista Full">Mercaderista Full</option>
                  <option value="Mercaderista PT">Mercaderista PT</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Nombre del Turno</label>
                <input 
                    required 
                    readOnly={!!isEditing} 
                    placeholder="EJ: TURNO A" 
                    className={`w-full p-3 md:p-4 rounded-xl md:rounded-2xl text-xs font-black border-2 border-transparent outline-none uppercase ${isEditing ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 focus:border-[#87be00]'}`} 
                    value={newTurno.nombre_turno} 
                    onChange={e => setNewTurno({...newTurno, nombre_turno: e.target.value.toUpperCase()})} 
                />
              </div>
            </div>

            {/* COLUMNA DERECHA (DIAS Y HORAS) */}
            <div className="lg:col-span-8 space-y-6">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-500 tracking-widest text-center block">Selección de Días</label>
              
              {/* Grilla adaptable: 4 columnas en móvil, 7 en escritorio */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {diasCompletos.map((dia) => (
                  <button 
                    key={dia.id} type="button" onClick={() => toggleDay(dia.id)} 
                    className={`h-12 md:h-14 rounded-xl md:rounded-2xl text-[10px] font-black transition-all border-2 flex flex-col items-center justify-center ${
                        newTurno.days.includes(dia.id) 
                        ? "bg-[#87be00] border-[#87be00] text-white shadow-lg scale-105" 
                        : "bg-gray-50 border-gray-100 text-gray-400 hover:border-[#87be00]/30"
                    }`}
                  >
                    {dia.label}
                    {newTurno.days.includes(dia.id) && <FiCheck size={10} className="mt-0.5" />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase ml-2">Entrada</p>
                  <input type="time" className="w-full p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00]" value={newTurno.entrada} onChange={e => setNewTurno({...newTurno, entrada: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase ml-2">Salida</p>
                  <input type="time" className="w-full p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00]" value={newTurno.salida} onChange={e => setNewTurno({...newTurno, salida: e.target.value})} />
                </div>
              </div>

              <button disabled={submitting} type="submit" className={`w-full text-white rounded-xl md:rounded-2xl font-black uppercase text-xs h-14 md:h-16 shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${user?.role === 'ROOT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-[#87be00]'}`}>
                {submitting ? <FiLoader className="animate-spin" /> : isEditing ? "ACTUALIZAR TURNO" : "CREAR CONFIGURACIÓN"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* LISTADO CARDS RESPONSIVO */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiLoader size={32} className="animate-spin text-[#87be00] mb-4" />
          <p className="text-[10px] font-black uppercase text-gray-300 italic tracking-widest">Sincronizando Turnos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {turnosAgrupados.map((t) => (
            <div key={`${t.nombre_turno}-${t.company_id}`} className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
              
              {user?.role === 'ROOT' && (
                <div className="absolute top-0 left-0 w-full bg-blue-600 text-white text-[8px] font-black text-center py-1 uppercase tracking-tighter">
                    Cliente: {t.company_name || 'Desconocido'}
                </div>
              )}

              {/* Botones de acción flotantes para móvil */}
              <div className="absolute top-6 right-6 md:top-8 md:right-8 flex gap-2">
                <button onClick={() => handleEdit(t)} className="p-2 md:p-2.5 bg-gray-50 text-gray-400 hover:bg-[#87be00] hover:text-white rounded-xl transition-all shadow-sm"><FiEdit3 size={16}/></button>
                <button onClick={() => deleteGrupo(t.ids)} className="p-2 md:p-2.5 bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><FiTrash2 size={16}/></button>
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full mb-4 md:mb-6 text-[8px] md:text-[9px] font-black uppercase text-gray-500 italic mt-2 md:mt-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#87be00]"></div> {t.categoria_rol}
              </div>

              <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase italic mb-6 md:mb-8 tracking-tighter leading-none truncate max-w-[70%]">{t.nombre_turno}</h3>

              <div className="space-y-4 md:space-y-6">
                <div className="bg-gray-50/50 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-gray-50">
                    <div className="flex justify-between gap-1">
                        {diasCompletos.map((dia) => (
                        <div 
                            key={dia.id} 
                            className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all ${
                                t.dias.includes(dia.id) 
                                ? "bg-[#87be00] text-white shadow-md"
                                : "bg-white text-gray-200 border border-gray-100"
                            }`}
                        >
                            {dia.label}
                        </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4 px-1 md:px-2">
                    <div className="p-2.5 md:p-3 bg-[#87be00]/10 rounded-xl md:rounded-2xl text-[#87be00] shrink-0"><FiClock size={18} className="md:w-5 md:h-5" /></div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Horario Jornada</span>
                        <span className="text-base md:text-lg font-black text-gray-900 tracking-tighter italic">
                            {t.entrada.slice(0, 5)} — {t.salida.slice(0, 5)}
                        </span>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TurnosManager;