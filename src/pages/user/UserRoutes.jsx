import { useEffect, useState, useRef } from "react";
import { FiPlay, FiMapPin, FiClock, FiCamera, FiX, FiCheck } from "react-icons/fi";
import Webcam from "react-webcam";
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import ProductReplenishment from "./ProductReplenishment";

const UserRoutes = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // CONTROL DE FLUJO (Estados excluyentes)
  const [view, setView] = useState("AGENDA"); // AGENDA, CAMERA, DIAGNOSTIC, WORK
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [kpis, setKpis] = useState(null);
  const webcamRef = useRef(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/routes/my-tasks");
      setTasks(Array.isArray(res.data) ? res.data : res || []);
    } catch (error) { toast.error("Error de conexión"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  // --- ACCIONES ---
  
  const startCameraProcess = (taskId) => {
    setActiveRouteId(taskId);
    setView("CAMERA"); // Forzamos el cambio de vista a la cámara
  };

  const handleCaptureAndCheckIn = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return toast.error("Cámara no detectada");

    const toastId = toast.loading("Procesando Check-in...");
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const blob = await fetch(imageSrc).then(res => res.blob());
        const formData = new FormData();
        formData.append("lat", latitude);
        formData.append("lng", longitude);
        formData.append("selfie", blob, "checkin.jpg");

        await api.post(`/api/routes/${activeRouteId}/check-in`, formData);
        
        // Cargar KPIs
        const kpiRes = await api.get(`/api/routes/${activeRouteId}/diagnostic`);
        setKpis(kpiRes.data);
        
        toast.dismiss(toastId);
        setView("DIAGNOSTIC"); // Pasamos al diagnóstico
        fetchTasks();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error("Error: Fuera de rango o error de red");
        setView("AGENDA");
      }
    }, () => {
      toast.dismiss(toastId);
      toast.error("GPS obligatorio");
    });
  };

  if (loading) return <div className="p-20 text-center font-black text-gray-200 animate-pulse">CARGANDO CULTIVA...</div>;

  // --- RENDERIZADO POR VISTAS (MODO EXCLUSIVO) ---

  // 📸 VISTA 1: CÁMARA FULLSCREEN (Imposible de saltar)
  if (view === "CAMERA") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[999]">
        <h2 className="text-white text-xs font-black uppercase mb-4 tracking-widest">Validación Selfie</h2>
        <div className="w-full max-w-sm aspect-square overflow-hidden rounded-[3rem] border-4 border-[#87be00] shadow-2xl shadow-[#87be00]/20">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="mt-8 flex gap-4 w-full max-w-xs">
          <button onClick={() => setView("AGENDA")} className="flex-1 bg-white/10 text-white py-5 rounded-2xl font-bold uppercase text-[10px]">Cancelar</button>
          <button onClick={handleCaptureAndCheckIn} className="flex-[2] bg-[#87be00] text-white py-5 rounded-2xl font-black uppercase text-[10px]">Capturar e Iniciar</button>
        </div>
      </div>
    );
  }

  // 📊 VISTA 2: DIAGNÓSTICO
  if (view === "DIAGNOSTIC") {
    return (
      <div className="p-6 max-w-md mx-auto space-y-6 animate-in zoom-in duration-300">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-center">
          <div className="w-20 h-20 bg-[#87be00]/10 text-[#87be00] rounded-full flex items-center justify-center mx-auto mb-4">
             <FiCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic leading-none">Visita Activa</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Diagnóstico del Local</p>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
             <div className="bg-gray-50 p-4 rounded-3xl">
                <p className="text-[9px] font-black text-gray-400 uppercase">Stock Total</p>
                <p className="text-xl font-black text-gray-800">{kpis?.total_stock || 0}</p>
             </div>
             <div className="bg-gray-50 p-4 rounded-3xl">
                <p className="text-[9px] font-black text-gray-400 uppercase">Alertas</p>
                <p className="text-xl font-black text-red-500">{kpis?.alerts_count || 0}</p>
             </div>
          </div>

          <button onClick={() => setView("WORK")} className="w-full mt-10 bg-gray-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl">Comenzar Reposición</button>
        </div>
      </div>
    );
  }

  // 📦 VISTA 3: TRABAJO (ESCÁNER)
  if (view === "WORK") {
    return (
      <div className="p-4">
        <button onClick={() => { setView("AGENDA"); fetchTasks(); }} className="mb-4 text-[10px] font-black uppercase text-gray-400">← Salir al Menú</button>
        <ProductReplenishment routeId={activeRouteId} />
      </div>
    );
  }

  // 📅 VISTA POR DEFECTO: AGENDA
  return (
    <div className="max-w-5xl mx-auto p-6 font-[Outfit]">
      <div className="relative">
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-100 border-l border-dashed border-gray-200"></div>
        <div className="space-y-12">
          {tasks.map((task) => (
            <div key={task.id} className="relative pl-12">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] bg-white flex items-center justify-center z-10">
                 <div className={`w-3 h-3 ${task.status === 'COMPLETED' ? 'bg-[#87be00]' : 'bg-orange-500'} rounded-full border-4 border-white shadow-sm`}></div>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center gap-1 text-[10px] font-black text-[#87be00] uppercase italic"><FiClock /> {task.start_time?.slice(0, 5)}</span>
                    <span className="text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-orange-50 text-orange-600">{task.status}</span>
                  </div>
                  <h2 className="text-xl font-black text-gray-800 uppercase leading-none">{task.cadena}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{task.direccion}</p>
                </div>
                {task.status === 'PENDING' ? (
                  <button onClick={() => startCameraProcess(task.id)} className="bg-[#87be00] text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-[#87be00]/20 active:scale-95 transition-all">
                    <FiCamera size={18} />
                    <span className="text-[10px] font-black uppercase italic">Iniciar</span>
                  </button>
                ) : (
                  <button onClick={() => { setActiveRouteId(task.id); setView("WORK"); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2">
                    <FiPlay size={16} /> <span className="text-[10px] font-black uppercase">Continuar</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserRoutes;