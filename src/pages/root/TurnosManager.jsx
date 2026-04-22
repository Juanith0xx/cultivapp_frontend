import { useState, useEffect, useMemo } from "react";
import api from "../../api/apiClient";
import { FiPlus, FiTrash2, FiClock, FiLayers, FiLoader, FiCheck, FiEdit3, FiShield, FiBriefcase } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const TurnosManager = () => {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [companies, setCompanies] = useState([]); // 🚩 Estado para las empresas (solo ROOT)
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

  // 🚩 Cargar empresas si el usuario es ROOT
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
    fetchCompanies(); // Intentar cargar empresas al montar
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
    
    // Validar empresa si es ROOT
    if (user?.role === "ROOT" && !newTurno.company_id) {
      return toast.error("Debes seleccionar una empresa");
    }

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
    <div className="p-6 space-y-8 font-[Outfit] max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${user?.role === 'ROOT' ? 'bg-blue-600' : 'bg-[#87be00]'} shadow-lg`}>
                {user?.role === 'ROOT' ? <FiShield size={24} /> : <FiLayers size={24} />}
            </div>
            <div>
                <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">
                    {user?.role === 'ROOT' ? "Configuración Global" : isEditing ? "Editando Turno" : "Gestión de Turnos"}
                </h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">
                    {user?.role === 'ROOT' ? "Asignación Multi-empresa" : "Horarios dinámicos Cultivapp"}
                </p>
            </div>
        </div>
        <button 
          onClick={() => {
              setShowForm(!showForm);
              if (showForm) { setIsEditing(null); setNewTurno(initialFormState); }
          }}
          className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center gap-3 shadow-xl ${
            showForm ? "bg-red-50 text-red-500 border border-red-100" : "bg-black text-white hover:bg-[#87be00]"
          }`}
        >
          {showForm ? "CANCELAR" : <><FiPlus size={18}/> CREAR TURNO</>}
        </button>
      </div>

      {/* FORMULARIO */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              
              {/* 🚩 SELECT DE EMPRESA (Solo ROOT) */}
              {user?.role === "ROOT" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest ml-1 flex items-center gap-2">
                    <FiBriefcase /> Empresa Cliente
                  </label>
                  <select 
                    required
                    disabled={!!isEditing} // No cambiar empresa al editar
                    className={`w-full p-4 rounded-2xl text-xs font-black border-2 outline-none transition-all ${isEditing ? 'bg-gray-100 text-gray-400 border-transparent' : 'bg-blue-50 border-blue-100 focus:border-blue-400 text-blue-900'}`}
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
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Rol Operativo</label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black border-2 border-transparent focus:border-[#87be00] outline-none"
                  value={newTurno.categoria_rol}
                  onChange={e => setNewTurno({...newTurno, categoria_rol: e.target.value})}
                >
                  <option value="Mercaderista Full">Mercaderista Full</option>
                  <option value="Mercaderista PT">Mercaderista PT</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Nombre del Turno</label>
                <input 
                    required 
                    readOnly={!!isEditing} 
                    placeholder="EJ: TURNO A" 
                    className={`w-full p-4 rounded-2xl text-xs font-black border-2 border-transparent outline-none uppercase ${isEditing ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 focus:border-[#87be00]'}`} 
                    value={newTurno.nombre_turno} 
                    onChange={e => setNewTurno({...newTurno, nombre_turno: e.target.value.toUpperCase()})} 
                />
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 text-center block">Selección de Días</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {diasCompletos.map((dia) => (
                  <button 
                    key={dia.id} type="button" onClick={() => toggleDay(dia.id)} 
                    className={`h-14 rounded-2xl text-[10px] font-black transition-all border-2 flex flex-col items-center justify-center ${
                        newTurno.days.includes(dia.id) 
                        ? "bg-[#87be00] border-[#87be00] text-white shadow-lg" 
                        : "bg-gray-50 border-gray-100 text-gray-400 hover:border-[#87be00]/30"
                    }`}
                  >
                    {dia.label}
                    {newTurno.days.includes(dia.id) && <FiCheck size={12} />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase ml-2">Entrada</p>
                  <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00]" value={newTurno.entrada} onChange={e => setNewTurno({...newTurno, entrada: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase ml-2">Salida</p>
                  <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00]" value={newTurno.salida} onChange={e => setNewTurno({...newTurno, salida: e.target.value})} />
                </div>
              </div>

              <button disabled={submitting} type="submit" className={`w-full text-white rounded-2xl font-black uppercase text-xs h-16 shadow-xl flex items-center justify-center gap-3 transition-all ${user?.role === 'ROOT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-[#87be00]'}`}>
                {submitting ? <FiLoader className="animate-spin" /> : isEditing ? "ACTUALIZAR TURNO" : "CREAR CONFIGURACIÓN"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* LISTADO CARDS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20"><FiLoader size={40} className="animate-spin text-[#87be00]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {turnosAgrupados.map((t) => (
            <div key={`${t.nombre_turno}-${t.company_id}`} className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
              
              {user?.role === 'ROOT' && (
                <div className="absolute top-0 left-0 w-full bg-blue-600 text-white text-[8px] font-black text-center py-1 uppercase tracking-tighter">
                    Cliente: {t.company_name || 'Desconocido'}
                </div>
              )}

              <div className="absolute top-8 right-8 flex gap-2">
                <button onClick={() => handleEdit(t)} className="p-2 bg-gray-50 text-gray-400 hover:bg-[#87be00] hover:text-white rounded-xl transition-all"><FiEdit3 size={18}/></button>
                <button onClick={() => deleteGrupo(t.ids)} className="p-2 bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"><FiTrash2 size={18}/></button>
              </div>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full mb-6 text-[9px] font-black uppercase text-gray-500 italic mt-3">
                 <div className="w-2 h-2 rounded-full bg-[#87be00]"></div> {t.categoria_rol}
              </div>

              <h3 className="text-2xl font-black text-gray-900 uppercase italic mb-8 tracking-tighter leading-none">{t.nombre_turno}</h3>

              <div className="space-y-6">
                <div className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-50">
                    <div className="flex justify-between gap-1">
                        {diasCompletos.map((dia) => (
                        <div 
                            key={dia.id} 
                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${
                                t.dias.includes(dia.id) 
                                ? "bg-[#87be00] text-white shadow-lg"
                                : "bg-white text-gray-200 border border-gray-100"
                            }`}
                        >
                            {dia.label}
                        </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 px-2">
                    <div className="p-3 bg-[#87be00]/10 rounded-2xl text-[#87be00]"><FiClock size={20} /></div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Horario</span>
                        <span className="text-lg font-black text-gray-900 tracking-tighter italic">
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