import { useEffect, useState, useCallback } from "react";
import { FiMapPin, FiPlay, FiClock, FiCalendar, FiSend, FiChevronLeft, FiChevronRight, FiLoader } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const UserHome = () => {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState([]); 
  const [displayTasks, setDisplayTasks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); 
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    try {
      setLoading(true);
      const dateStr = selectedDate.toLocaleDateString('en-CA');
      const data = await api.get(`/routes/my-tasks?date=${dateStr}`);
      setAllTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al sincronizar agenda:", error);
      if (error.status !== 401) toast.error("No se pudo cargar la agenda");
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const dateStr = selectedDate.toLocaleDateString('en-CA'); 
    const filtered = allTasks.filter(t => {
        const taskDate = t.visit_date ? new Date(t.visit_date).toLocaleDateString('en-CA') : null;
        return taskDate === dateStr || (t.is_recurring && t.day_of_week === (selectedDate.getDay() || 7));
    });
    setDisplayTasks(filtered);
  }, [selectedDate, allTasks]);

  // 🟢 FUNCIÓN ACTUALIZADA: Ahora envía el ID en la URL y usa lat_in/lng_in
  const handleStartVisit = async (taskId) => {
    if (!navigator.geolocation) {
      return toast.error("Tu dispositivo no permite geolocalización");
    }

    setActionLoading(taskId); 
    const toastId = toast.loading("Validando posición GPS...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // 🚩 CAMBIO CLAVE: La URL ahora incluye el ID y el body usa lat_in/lng_in
          await api.post(`/routes/${taskId}/check-in`, {
            lat_in: latitude,
            lng_in: longitude
          });

          toast.success("Visita iniciada con éxito", { id: toastId });
          fetchData(); // Refrescamos la lista para ver el cambio de estado
        } catch (error) {
          const msg = error.response?.data?.message || "Error al validar posición";
          toast.error(msg, { id: toastId });
        } finally {
          setActionLoading(null);
        }
      },
      (error) => {
        toast.error("Debes activar el GPS para iniciar la visita", { id: toastId });
        setActionLoading(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getWeekDays = () => {
    const days = [];
    const baseDate = new Date(selectedDate);
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(baseDate.setDate(diff));
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  if (!user || (loading && allTasks.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-pulse">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#87be00] rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Sincronizando Hoja de Ruta...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-[Outfit] p-2 animate-in fade-in duration-700">
      
      {/* CALENDARIO SEMANAL */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6 px-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
            {selectedDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))} className="p-2 bg-gray-50 rounded-xl hover:text-[#87be00] transition-colors"><FiChevronLeft size={18}/></button>
            <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))} className="p-2 bg-gray-50 rounded-xl hover:text-[#87be00] transition-colors"><FiChevronRight size={18}/></button>
          </div>
        </div>

        <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {getWeekDays().map((date, idx) => {
            const isSelected = date.toLocaleDateString() === selectedDate.toLocaleDateString();
            const isToday = date.toLocaleDateString() === new Date().toLocaleDateString();
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center min-w-[60px] p-4 rounded-[2rem] transition-all duration-300 ${
                  isSelected ? 'bg-gray-900 text-white shadow-xl scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <span className="text-[9px] font-black uppercase mb-1">{date.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.','')}</span>
                <span className="text-sm font-black">{date.getDate()}</span>
                {isToday && !isSelected && <div className="w-1 h-1 bg-[#87be00] rounded-full mt-1"></div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* TIMELINE DE VISITAS */}
      <div className="relative pl-10">
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-100"></div>

        <div className="space-y-8">
          {displayTasks.length === 0 ? (
            <div className="bg-gray-50/50 p-16 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100">
              <FiCalendar className="mx-auto text-gray-200 mb-4" size={32} />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No hay visitas para este día</p>
            </div>
          ) : (
            displayTasks.map((task, idx) => (
              <div key={task.id} className="relative animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="absolute -left-[30px] top-1/2 -translate-y-1/2 w-6 h-6 bg-white flex items-center justify-center z-10">
                  <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${task.status === 'PENDING' ? 'bg-orange-500' : 'bg-[#87be00]'}`}></div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#87be00]/30 transition-all group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-[#87be00] uppercase">
                        <FiClock /> {task.start_time?.slice(0, 5)}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        task.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-[#87be00]'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-1 group-hover:text-[#87be00] transition-colors">{task.cadena}</h2>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiMapPin size={12} className="text-[#87be00]" />
                      <p className="text-[10px] font-bold uppercase tracking-tighter">{task.direccion}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {task.status === 'PENDING' ? (
                      <button 
                        onClick={() => handleStartVisit(task.id)}
                        disabled={actionLoading === task.id}
                        className="flex-1 md:flex-none bg-[#87be00] text-white px-10 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-[#87be00]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === task.id ? <FiLoader className="animate-spin" /> : <FiPlay size={18} />}
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          {actionLoading === task.id ? 'Validando...' : 'Iniciar Visita'}
                        </span>
                      </button>
                    ) : (
                      <div className="bg-green-50 text-[#87be00] px-6 py-4 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-green-100 font-black">
                        En Proceso
                      </div>
                    )}
                    <button className="bg-[#0f172a] text-white p-4 rounded-2xl hover:bg-black transition-all shadow-lg"><FiSend size={18}/></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHome;