import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCamera, FiLoader, FiMapPin, FiArrowRight, FiMessageSquare, FiSend, FiX, FiCheckCircle, FiWifiOff, FiWifi } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import Scanner from "../../components/Scanner"; 

const VisitFlow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isProcessingScan = useRef(false);

  // --- ESTADO DE RED ---
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [scannedCodes, setScannedCodes] = useState([]); 
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState("");
  const [commentPhoto, setCommentPhoto] = useState(null);

  const stepsInfo = {
    1: { key: "fachada", title: "Foto de Local", sub: "Evidencia de llegada" },
    2: { key: "gondola_inicio", title: "Góndola Inicial", sub: "Estado previo a reposición" },
    3: { key: "escaneo", title: "Escanear Productos", sub: "Registra los EAN de reposición" },
    4: { key: "gondola_final", title: "Góndola Final", sub: "Evidencia trabajo terminado" },
    5: { key: "preguntas", title: "Gestión Realizada", sub: "Responde el formulario de visita" },
    6: { key: "comentarios", title: "Cierre de Visita", sub: "Evidencia final y observaciones" }
  };

  // Escuchar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexión restablecida", { icon: <FiWifi className="text-green-500"/> });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Modo Offline activado", { icon: <FiWifiOff className="text-orange-500"/> });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (step === 5) {
      const loadQuestions = async () => {
        try {
          const data = await api.get("/questions");
          setQuestions(data);
        } catch (err) {
          toast.error("Error al cargar preguntas");
        }
      };
      loadQuestions();
    }
  }, [step]);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCapturing(true);
    // Notificación de proceso según el estado
    const toastId = toast.loading(isOnline ? "Subiendo foto a la nube..." : "Guardando foto localmente...");

    const formData = new FormData();
    const tipoEvidencia = step === 6 ? "comentario_final" : stepsInfo[step].key;
    formData.append("tipo_evidencia", tipoEvidencia);
    formData.append("foto", file);

    try {
      const response = await api.post(`/routes/${id}/photo`, formData);
      
      // ✅ CASO OFFLINE (Lógica del interceptor de axios)
      if (response?.offline) {
        toast.success("📴 Guardado offline. Se enviará al detectar red.", { id: toastId, duration: 4000 });
        const localUrl = URL.createObjectURL(file);
        if (step === 6) setCommentPhoto(localUrl);
        else setStep(prev => prev + 1);
        return;
      }

      // ✅ CASO ONLINE
      toast.success(`${stepsInfo[step].title} sincronizada`, { id: toastId });
      if (step === 6) {
        if (response.url) setCommentPhoto(response.url);
      } else {
        setStep(prev => prev + 1);
      }
    } catch (err) {
      toast.error("Error en la captura. Intenta de nuevo.", { id: toastId });
    } finally {
      setCapturing(false);
      e.target.value = "";
    }
  };

  const handleScanSuccess = async (decodedText) => {
    if (isProcessingScan.current || scannedCodes.includes(decodedText)) return;
    isProcessingScan.current = true;

    try {
      const response = await api.post(`/routes/${id}/scans`, { barcode: decodedText });
      setScannedCodes(prev => [decodedText, ...prev]);
      
      if (response?.offline) {
        toast.success(`EAN ${decodedText.slice(-4)} registrado (Offline)`, { duration: 1500 });
      } else {
        toast.success(`EAN ${decodedText.slice(-4)} registrado en servidor`, { duration: 1000 });
      }

      setTimeout(() => { isProcessingScan.current = false; }, 1500);
    } catch (err) {
      toast.error("Error al registrar código");
      isProcessingScan.current = false; 
    }
  };

  const finalizarTodo = async () => {
    setLoading(true);
    const toastId = toast.loading(isOnline ? "Cerrando visita en el servidor..." : "Preparando cierre offline...");
    
    try {
      const response = await api.post(`/routes/${id}/finish`, {
        responses: answers,
        comment: comment,
        comment_photo_url: commentPhoto
      });

      if (response?.offline) {
        toast.success("📴 Visita guardada localmente. ¡Buen trabajo!", { id: toastId, duration: 5000 });
      } else {
        toast.success("¡Visita cerrada y sincronizada exitosamente!", { id: toastId });
      }
      
      navigate("/usuario/home");
    } catch (err) {
      toast.error("Error al finalizar reporte", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen font-[Outfit] p-4 pb-24 flex flex-col items-center transition-colors duration-500 ${isOnline ? 'bg-gray-50' : 'bg-orange-50/30'}`}>
      
      {/* BANNER OFFLINE VISUAL */}
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-orange-500 text-white text-[10px] font-black uppercase py-1 text-center z-[60] flex items-center justify-center gap-2">
          <FiWifiOff /> Trabajando en Modo Offline
        </div>
      )}

      {/* INDICADOR DE PASOS */}
      <div className="w-full max-w-md flex justify-between mb-8 sticky top-6 z-20 py-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-700 ${step >= i ? (isOnline ? 'bg-[#87be00]' : 'bg-orange-500') : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-md bg-white p-6 rounded-[2.5rem] shadow-xl text-center space-y-6 border border-gray-100 relative">
        
        {/* Marcador visual de conexión en la tarjeta */}
        <div className="absolute top-6 right-6">
          {isOnline ? (
            <div className="flex items-center gap-1 text-[8px] font-black text-[#87be00] uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-[#87be00] rounded-full animate-pulse"></span> Online
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[8px] font-black text-orange-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span> Offline
            </div>
          )}
        </div>

        <div className="space-y-1">
            <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter leading-none">{stepsInfo[step].title}</h2>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-[#87be00]' : 'text-orange-400'}`}>{stepsInfo[step].sub}</p>
        </div>

        {/* ... Resto del JSX (Scanner, Captura, Preguntas) se mantiene igual ... */}
        {/* Asegúrate de pasar el color dinámico a los botones según isOnline */}
        
        {step === 3 && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <div className={`rounded-[2.5rem] overflow-hidden border-2 shadow-2xl transition-colors ${isOnline ? 'border-gray-100' : 'border-orange-200'}`}>
              <Scanner onScanSuccess={handleScanSuccess} />
            </div>
            
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto px-1">
              {scannedCodes.length > 0 ? scannedCodes.slice(0,3).map((code, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-gray-500">EAN: {code}</span>
                  <FiCheckCircle className={isOnline ? 'text-[#87be00]' : 'text-orange-500'} size={14}/>
                </div>
              )) : (
                <p className="text-[10px] text-gray-300 font-bold uppercase py-4">Esperando escaneo...</p>
              )}
            </div>

            <button onClick={() => setStep(4)} className="w-full bg-black text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform">
              Siguiente Paso <FiArrowRight size={16} className={isOnline ? 'text-[#87be00]' : 'text-orange-500'}/>
            </button>
          </div>
        )}

        {/* MODIFICACIÓN EN LOS BOTONES DE FOTO */}
        {(step === 1 || step === 2 || step === 4) && (
          <div onClick={() => !capturing && fileInputRef.current.click()} className="w-full aspect-square bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer overflow-hidden relative group">
            {capturing ? (
                <div className="flex flex-col items-center gap-2">
                  <FiLoader className={`${isOnline ? 'text-[#87be00]' : 'text-orange-500'} animate-spin`} size={40} />
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    {isOnline ? 'Sincronizando...' : 'Cifrando en Local...'}
                  </p>
                </div>
            ) : (
                <>
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <FiCamera size={40} className={isOnline ? 'text-[#87be00]' : 'text-orange-500'} />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">Toca para capturar</span>
                </>
            )}
          </div>
        )}

        {/* PASO FINAL: COLOR DEL BOTÓN FINALIZAR */}
        {step === 6 && (
            <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
               {/* ... (Imagen y comentarios igual) ... */}
               <button 
                onClick={finalizarTodo} 
                disabled={loading} 
                className={`w-full ${isOnline ? 'bg-[#87be00]' : 'bg-orange-600'} text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:bg-black disabled:opacity-50 transition-colors`}
                >
                    {loading ? <FiLoader className="animate-spin" /> : <><FiSend/> {isOnline ? 'Finalizar y Enviar' : 'Finalizar Offline'}</>}
                </button>
            </div>
        )}

        <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-400 text-[8px] font-bold uppercase tracking-widest">
            <FiMapPin className={isOnline ? 'text-[#87be00]' : 'text-orange-500'} /> LOCAL ID: {id?.slice(0,8).toUpperCase()}
        </div>
      </div>
      
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleCapture} className="hidden" />
    </div>
  );
};

export default VisitFlow;