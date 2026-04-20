import { useState, useEffect, useMemo } from "react";
import api from "../../api/apiClient";
import { FiPlus, FiTrash2, FiClock, FiLayers, FiLoader, FiAlertCircle, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";

const TurnosManager = () => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newTurno, setNewTurno] = useState({
    nombre_turno: "",
    categoria_rol: "Mercaderista Full",
    days: [], 
    entrada: "07:30",
    salida: "15:30"
  });

  const diasCompletos = [
    { label: "D", id: 0 }, { label: "L", id: 1 }, { label: "M", id: 2 },
    { label: "M", id: 3 }, { label: "J", id: 4 }, { label: "V", id: 5 }, { label: "S", id: 6 },
  ];

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

  useEffect(() => { fetchTurnos(); }, []);

  const turnosAgrupados = useMemo(() => {
    const grupos = turnos.reduce((acc, current) => {
      const key = current.nombre_turno.toUpperCase();
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
    setSubmitting(true);
    try {
      await api.post("/turnos-config/bulk", newTurno);
      toast.success("Configuración guardada");
      setNewTurno({ nombre_turno: "", categoria_rol: "Mercaderista Full", days: [], entrada: "07:30", salida: "15:30" });
      setShowForm(false);
      fetchTurnos();
    } catch (err) {
      toast.error("Error al guardar");
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
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-[#87be00]/10 rounded-2xl flex items-center justify-center text-[#87be00]">
                <FiLayers size={20} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">Gestión de Turnos</h1>
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Horarios dinámicos Cultivapp</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center gap-3 shadow-xl ${
            showForm ? "bg-red-50 text-red-500 border border-red-100" : "bg-black text-white hover:bg-[#87be00]"
          }`}
        >
          {showForm ? "CANCELAR" : <><FiPlus size={18}/> AGREGAR TURNO</>}
        </button>
      </div>

      {/* FORMULARIO */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Rol Base</label>
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
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Nombre</label>
                <input required placeholder="EJ: TURNO A1" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black border-2 border-transparent focus:border-[#87be00] outline-none uppercase" value={newTurno.nombre_turno} onChange={e => setNewTurno({...newTurno, nombre_turno: e.target.value.toUpperCase()})} />
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Días Operativos</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {diasCompletos.map((dia) => (
                  <button 
                    key={dia.id} type="button" onClick={() => toggleDay(dia.id)} 
                    className={`h-14 rounded-2xl text-[10px] font-black transition-all border-2 flex flex-col items-center justify-center ${
                        newTurno.days.includes(dia.id) 
                        ? "bg-[#87be00] border-[#87be00] text-white shadow-lg shadow-[#87be00]/20 scale-105" 
                        : "bg-gray-50 border-gray-100 text-gray-400 hover:border-[#87be00]/30"
                    }`}
                  >
                    {dia.label}
                    {newTurno.days.includes(dia.id) && <FiCheck size={12} />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="time" className="p-4 bg-gray-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00]" value={newTurno.entrada} onChange={e => setNewTurno({...newTurno, entrada: e.target.value})} />
                <input type="time" className="p-4 bg-gray-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00]" value={newTurno.salida} onChange={e => setNewTurno({...newTurno, salida: e.target.value})} />
              </div>

              <button disabled={submitting} type="submit" className="w-full bg-[#87be00] text-white rounded-[1.5rem] font-black uppercase text-xs h-16 shadow-xl shadow-[#87be00]/20 flex items-center justify-center gap-3">
                {submitting ? <FiLoader className="animate-spin" /> : "GUARDAR CONFIGURACIÓN"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* LISTADO CON DÍAS EN VERDE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20"><FiLoader size={40} className="animate-spin text-[#87be00]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {turnosAgrupados.map((t) => (
            <div key={t.nombre_turno} className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative">
              <button onClick={() => deleteGrupo(t.ids)} className="absolute top-8 right-8 text-gray-200 hover:text-red-500 transition-all scale-125"><FiTrash2 size={20}/></button>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full mb-6 text-[9px] font-black uppercase text-gray-500 italic">
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
                                ? "bg-[#87be00] text-white shadow-lg shadow-[#87be00]/20 scale-110" // 🚩 CAMBIO A VERDE AQUÍ
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