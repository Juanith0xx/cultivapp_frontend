import { useState, useEffect, useMemo } from "react";
import api from "../../api/apiClient";
import { FiPlus, FiTrash2, FiClock, FiCalendar, FiLoader, FiLayers, FiAlertCircle } from "react-icons/fi";
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

  const diasCortos = ["D", "L", "M", "M", "J", "V", "S"];

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/turnos-config");
      setTurnos(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error fetching turnos:", err);
      toast.error("Error al cargar turnos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTurnos(); }, []);

  // 🚩 LÓGICA DE AGRUPAMIENTO: Transformamos la lista plana en grupos por nombre
  const turnosAgrupados = useMemo(() => {
    const grupos = turnos.reduce((acc, current) => {
      const key = current.nombre_turno.toUpperCase();
      if (!acc[key]) {
        acc[key] = {
          ...current,
          dias: [current.day_of_week],
          ids: [current.id] // Guardamos todos los IDs para el borrado masivo
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

  // 🚩 BORRADO SEGURO: Borramos todos los registros asociados a ese nombre de turno
  const deleteGrupo = async (ids) => {
    if (!confirm(`¿Eliminar este turno y sus ${ids.length} días configurados?`)) return;
    try {
      // Ejecutamos las eliminaciones en paralelo
      await Promise.all(ids.map(id => api.delete(`/turnos-config/${id}`)));
      toast.success("Turno eliminado completo");
      fetchTurnos();
    } catch (err) {
      toast.error("Error al eliminar algunos bloques");
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "00:00";
    return timeStr.length > 5 ? timeStr.slice(0, 5) : timeStr;
  };

  return (
    <div className="p-6 space-y-6 font-[Outfit]">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic leading-none tracking-tighter">Configuración de Turnos</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Gestión de horarios por empresa</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:scale-105 transition-all shadow-lg hover:bg-[#87be00]"
        >
          {showForm ? "CANCELAR" : <><FiPlus /> NUEVO BLOQUE</>}
        </button>
      </div>

      {/* FORMULARIO */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-[#87be00] animate-in fade-in zoom-in-95">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 italic">Rol Base</label>
                <select 
                  className="p-4 bg-gray-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00]"
                  value={newTurno.categoria_rol}
                  onChange={e => setNewTurno({...newTurno, categoria_rol: e.target.value})}
                >
                  <option value="Mercaderista Full">Mercaderista Full</option>
                  <option value="Mercaderista PT">Mercaderista PT</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 italic">Nombre (Ej: Turno A1)</label>
                <input required className="p-4 bg-gray-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00] uppercase" value={newTurno.nombre_turno} onChange={e => setNewTurno({...newTurno, nombre_turno: e.target.value.toUpperCase()})} />
              </div>
            </div>

            <div className="md:col-span-5 space-y-4">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-2 italic">Días de Aplicación</label>
              <div className="flex justify-between gap-1">
                {diasCortos.map((label, index) => (
                  <button key={index} type="button" onClick={() => toggleDay(index)} className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all border-2 ${newTurno.days.includes(index) ? "bg-[#87be00] border-[#87be00] text-white shadow-md shadow-[#87be00]/20" : "bg-gray-50 border-transparent text-gray-400 hover:border-gray-200"}`}>{label}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="time" className="p-4 bg-gray-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00]" value={newTurno.entrada} onChange={e => setNewTurno({...newTurno, entrada: e.target.value})} />
                <input type="time" className="p-4 bg-gray-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-[#87be00]" value={newTurno.salida} onChange={e => setNewTurno({...newTurno, salida: e.target.value})} />
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col justify-end">
              <button disabled={submitting} type="submit" className="bg-[#87be00] text-white rounded-2xl font-black uppercase text-[11px] h-[52px] shadow-lg shadow-[#87be00]/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                {submitting ? <FiLoader className="animate-spin" /> : "GUARDAR CONFIGURACIÓN"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* LISTADO AGRUPADO */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4"><FiLoader size={40} className="animate-spin text-[#87be00]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {turnosAgrupados.length > 0 ? turnosAgrupados.map((t) => (
            <div key={t.nombre_turno} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <button 
                onClick={() => deleteGrupo(t.ids)} 
                className="absolute top-5 right-5 text-gray-200 hover:text-red-500 transition-colors z-10"
              >
                <FiTrash2 size={18}/>
              </button>
              
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 rounded-full bg-[#87be00]"></div>
                 <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t.categoria_rol}</span>
              </div>

              <h3 className="text-xl font-black text-gray-800 uppercase italic mb-5 leading-none tracking-tighter">{t.nombre_turno}</h3>

              <div className="space-y-4 bg-gray-50 p-6 rounded-[2rem] border border-gray-50 group-hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {diasCortos.map((label, idx) => (
                      <div key={idx} className={`w-7 h-7 flex items-center justify-center rounded-lg text-[9px] font-black transition-all ${t.dias.includes(idx) ? "bg-[#87be00] text-white shadow-sm shadow-[#87be00]/30" : "bg-white text-gray-300"}`}>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm font-black text-gray-900 border-t border-gray-200/50 pt-4">
                  <FiClock className="text-[#87be00]" size={16} /> 
                  <span className="tracking-tighter">{formatTime(t.entrada)} — {formatTime(t.salida)}</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <FiLayers size={100} />
              </div>
            </div>
          )) : (
            <div className="col-span-full flex flex-col items-center justify-center p-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <FiAlertCircle size={40} className="text-gray-300 mb-4" />
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest italic text-center">No hay turnos configurados aún.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TurnosManager;