import { useEffect, useState } from "react";
import { FiPlay, FiMapPin, FiClock, FiSend } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";

const UserRoutes = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Traemos las tareas de hoy
      const data = await api.get("/routes/my-tasks");
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse font-black text-gray-300">CARGANDO...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 font-[Outfit]">
      
      {/* Contenedor Principal del Timeline */}
      <div className="relative">
        
        {/* Línea vertical gris de fondo (Timeline) */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-100 border-l border-dashed border-gray-200"></div>

        <div className="space-y-12">
          {tasks.length === 0 ? (
            <div className="ml-12 text-gray-400 font-bold py-10 uppercase text-[10px] tracking-widest">
              No tienes visitas programadas para hoy
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="relative pl-12">
                
                {/* Punto Naranja en el Timeline */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] bg-white flex items-center justify-center z-10">
                   <div className="w-3 h-3 bg-orange-500 rounded-full border-4 border-white shadow-sm"></div>
                </div>

                {/* Card de la Tarea */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between gap-4 hover:shadow-md transition-all">
                  
                  {/* Info del Local */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1 text-[10px] font-black text-[#87be00] uppercase">
                        <FiClock /> {task.start_time?.slice(0, 5)}
                      </span>
                      <span className="bg-orange-50 text-orange-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {task.status}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none mb-1">
                      {task.cadena}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiMapPin size={12} className="text-gray-300" />
                      <p className="text-[10px] font-bold uppercase tracking-tighter">
                        {task.direccion}
                      </p>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toast.success("Iniciando visita...")}
                      className="bg-[#87be00] text-white px-10 py-4 rounded-2xl flex items-center gap-3 hover:bg-black transition-all shadow-lg shadow-[#87be00]/20"
                    >
                      <FiPlay size={18} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Iniciar Visita</span>
                    </button>

                    <button className="bg-[#0f172a] text-white p-4 rounded-2xl hover:bg-black transition-all">
                      <FiSend size={18} />
                    </button>
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

export default UserRoutes;