import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCamera, FiLoader, FiMapPin, FiArrowRight, FiMessageSquare, FiSend, FiX, FiCheckCircle, FiWifiOff, FiWifi, FiTrash2 } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import Scanner from "../../components/Scanner"; 

const VisitFlow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isProcessingScan = useRef(false);

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

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  useEffect(() => {
    if (step === 5) {
      const loadQuestions = async () => {
        try {
          const data = await api.get("/questions");
          setQuestions(data);
        } catch (err) { toast.error("Error al cargar preguntas"); }
      };
      loadQuestions();
    }
  }, [step]);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCapturing(true);
    const toastId = toast.loading(isOnline ? "Enviando a la nube..." : "Guardando en memoria...");

    const formData = new FormData();
    formData.append("tipo_evidencia", step === 6 ? "comentario_final" : stepsInfo[step].key);
    formData.append("foto", file);

    try {
      const response = await api.post(`/routes/${id}/photo`, formData);
      if (response?.offline) {
        toast.success("📴 Foto guardada offline", { id: toastId });
        if (step === 6) setCommentPhoto(URL.createObjectURL(file));
        else setStep(prev => prev + 1);
        return;
      }
      toast.success("Foto sincronizada", { id: toastId });
      if (step === 6) setCommentPhoto(response.url);
      else setStep(prev => prev + 1);
    } catch (err) { toast.error("Error al subir", { id: toastId }); }
    finally { setCapturing(false); e.target.value = ""; }
  };

  const handleScanSuccess = async (decodedText) => {
    if (scannedCodes.includes(decodedText)) return; // No duplicar
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;

    try {
      const response = await api.post(`/routes/${id}/scans`, { barcode: decodedText });
      setScannedCodes(prev => [decodedText, ...prev]);
      
      const mode = response?.offline ? "📴 Local" : "☁️ Nube";
      toast.success(`${decodedText} ${mode}`, { duration: 800, id: 'scan' });
      
      setTimeout(() => { isProcessingScan.current = false; }, 500);
    } catch (err) { isProcessingScan.current = false; }
  };

  const removeCode = (code) => {
    setScannedCodes(prev => prev.filter(c => c !== code));
    toast.success("Eliminado de la lista");
  };

  const finalizarTodo = async () => {
    setLoading(true);
    try {
      await api.post(`/routes/${id}/finish`, { responses: answers, comment, comment_photo_url: commentPhoto });
      toast.success(isOnline ? "Visita finalizada" : "Guardado offline exitoso");
      navigate("/usuario/home");
    } catch (err) { toast.error("Error al cerrar"); }
    finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen font-[Outfit] p-4 pb-24 flex flex-col items-center transition-colors duration-500 ${isOnline ? 'bg-gray-50' : 'bg-orange-50/20'}`}>
      
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-orange-500 text-white text-[10px] font-black py-1 text-center z-50 flex items-center justify-center gap-2">
          <FiWifiOff /> MODO OFFLINE ACTIVO
        </div>
      )}

      <div className="w-full max-w-md flex justify-between mb-8 sticky top-6 z-20">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-700 ${step >= i ? (isOnline ? 'bg-[#87be00]' : 'bg-orange-500') : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-md bg-white p-6 rounded-[2.5rem] shadow-xl text-center space-y-6 border border-gray-100 relative">
        <div className="absolute top-6 right-6 flex items-center gap-1.5">
           <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#87be00]' : 'bg-orange-500'} animate-pulse`} />
           <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div className="space-y-1 pt-2">
            <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter leading-none">{stepsInfo[step].title}</h2>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-[#87be00]' : 'text-orange-500'}`}>{stepsInfo[step].sub}</p>
        </div>

        {step === 3 && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <div className={`rounded-[2.5rem] overflow-hidden border-2 shadow-2xl ${isOnline ? 'border-gray-50' : 'border-orange-100'}`}>
              <Scanner onScanSuccess={handleScanSuccess} />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reposición</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white ${isOnline ? 'bg-[#87be00]' : 'bg-orange-500'}`}>{scannedCodes.length} Items</span>
              </div>

              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto px-1 custom-scrollbar">
                {scannedCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100 animate-in slide-in-from-left">
                    <div className="flex items-center gap-3">
                      <FiCheckCircle className={isOnline ? 'text-[#87be00]' : 'text-orange-500'} size={14}/>
                      <span className="text-[10px] font-bold text-gray-700">{code}</span>
                    </div>
                    <button onClick={() => removeCode(code)} className="text-gray-300 hover:text-red-500 transition-colors"><FiTrash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(4)} disabled={scannedCodes.length === 0} className="w-full bg-black text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20 transition-all">
              Siguiente Paso <FiArrowRight size={16} className={isOnline ? 'text-[#87be00]' : 'text-orange-500'}/>
            </button>
          </div>
        )}

        {/* ... Resto de los pasos simplificados para brevedad ... */}
        {(step === 1 || step === 2 || step === 4) && (
          <div onClick={() => !capturing && fileInputRef.current.click()} className="w-full aspect-square bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer relative group transition-all active:scale-95">
             {capturing ? <FiLoader className={`${isOnline ? 'text-[#87be00]' : 'text-orange-500'} animate-spin`} size={40} /> : <FiCamera size={40} className="text-gray-200 group-hover:text-[#87be00] transition-colors" />}
             <span className="mt-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Capturar Evidencia</span>
          </div>
        )}

        {step === 5 && (
           <div className="space-y-4 animate-in slide-in-from-right duration-300">
             <div className="bg-gray-50 p-2 rounded-[2rem] space-y-1">
               {questions.map((q) => (
                 <button key={q.id} onClick={() => setAnswers({...answers, [q.id]: q.question})} className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all ${answers[q.id] ? 'bg-white shadow-sm' : ''}`}>
                   <span className={`text-[10px] font-bold text-left leading-tight pr-2 ${answers[q.id] ? (isOnline ? 'text-[#87be00]' : 'text-orange-500') : 'text-gray-500'}`}>{q.question}</span>
                   <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[q.id] ? (isOnline ? 'border-[#87be00] bg-[#87be00]' : 'border-orange-500 bg-orange-500') : 'border-gray-200'}`}>{answers[q.id] && <div className="w-1.5 h-1.5 bg-white rounded-full" />}</div>
                 </button>
               ))}
             </div>
             <button onClick={() => setStep(6)} className="w-full bg-black text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">Continuar <FiArrowRight size={16}/></button>
           </div>
        )}

        {step === 6 && (
           <div className="space-y-5 animate-in slide-in-from-bottom-4">
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Observaciones finales..." className="w-full h-32 p-5 bg-gray-50 rounded-[1.8rem] border-none text-sm outline-none resize-none" />
              <button onClick={finalizarTodo} disabled={loading} className={`w-full ${isOnline ? 'bg-[#87be00]' : 'bg-orange-600'} text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 transition-colors`}>
                 {loading ? <FiLoader className="animate-spin" /> : <><FiSend/> {isOnline ? 'Finalizar Reporte' : 'Guardar Offline'}</>}
              </button>
           </div>
        )}

        <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-300 text-[8px] font-bold uppercase tracking-widest">
            <FiMapPin className={isOnline ? 'text-[#87be00]' : 'text-orange-500'} /> ID: {id?.slice(0,8).toUpperCase()}
        </div>
      </div>
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleCapture} className="hidden" />
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }`}</style>
    </div>
  );
};

export default VisitFlow;