import { useEffect, useState } from "react";
import { FiPlay, FiMapPin, FiClock, FiSend, FiPackage, FiCheckCircle } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import ProductReplenishment from "./ProductReplenishment"; // 👈 Importamos el nuevo componente

const UserRoutes = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRouteId, setActiveRouteId] = useState(null); // Para mostrar el escáner

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/routes/my-tasks");
      setTasks(Array.isArray(res.data) ? res.data : res || []);
    } catch (error) {
      toast.error("Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  // 🚩 FUNCIÓN DE CHECK-IN (Inicio de Visita Real)
  const handleStartVisit = async (taskId) => {
    if (!navigator.geolocation) return toast.error("El GPS no está disponible");

    toast.loading("Validando ubicación...");
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        await api.post(`/api/routes/${taskId}/check-in`, {
          lat: latitude,
          lng: longitude
        });
        
        toast.dismiss();
        toast.success("Visita Iniciada");
        setActiveRouteId(taskId); // Abrimos el modo "Trabajo"
        fetchTasks(); // Refrescamos estados
      } catch (error) {
        toast.dismiss();
        toast.error("Error al iniciar visita");
      }
    }, () => {
      toast.dismiss();
      toast.error("Debes activar el GPS para iniciar");
    });
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-black text-gray-300">SINCRONIZANDO AGENDA...</div>;

  // 🚩 SI HAY UNA RUTA ACTIVA, MOSTRAR EL ESCÁNER DE REPOSICIÓN
  if (activeRouteId) {
    return (
      <div className="p-4">
        <button 
          onClick={() => setActiveRouteId(null)}
          className="mb-4 text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"
        >
          ← Volver a la Agenda
        </button>
        <ProductReplenishment routeId={activeRouteId} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 font-[Outfit]">
      <div className="relative">
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-100 border-l border-dashed border-gray-200"></div>

        <div className="space-y-12">
          {tasks.length === 0 ? (
            <div className="ml-12 text-gray-400 font-bold py-10 uppercase text-[10px] tracking-widest">
              No tienes visitas programadas para hoy
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="relative pl-12">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] bg-white flex items-center justify-center z-10">
                   <div className={`w-3 h-3 ${task.status === 'COMPLETED' ? 'bg-[#87be00]' : 'bg-orange-500'} rounded-full border-4 border-white shadow-sm`}></div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1 text-[10px] font-black text-[#87be00] uppercase">
                        <FiClock /> {task.start_time?.slice(0, 5)} HRS
                      </span>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 
                        task.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                      }`}>
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

                  <div className="flex items-center gap-2">
                    {/* BOTÓN DINÁMICO SEGÚN ESTADO */}
                    {task.status === 'PENDING' ? (
                      <button 
                        onClick={() => handleStartVisit(task.id)}
                        className="bg-[#87be00] text-white px-10 py-4 rounded-2xl flex items-center gap-3 hover:bg-black transition-all shadow-lg shadow-[#87be00]/20"
                      >
                        <FiPlay size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Iniciar</span>
                      </button>
                    ) : task.status === 'IN_PROGRESS' ? (
                      <button 
                        onClick={() => setActiveRouteId(task.id)}
                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl flex items-center gap-3 hover:bg-black transition-all shadow-lg shadow-blue-600/20"
                      >
                        <FiPackage size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Reponer</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-[#87be00] px-6">
                        <FiCheckCircle size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Finalizado</span>
                      </div>
                    )}

                    <button className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-black transition-all">
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