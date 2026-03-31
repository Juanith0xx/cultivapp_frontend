import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FiCamera, FiLoader, FiMapPin, FiArrowRight, 
  FiMessageSquare, FiSend, FiX, FiCheckCircle, 
  FiWifiOff, FiWifi, FiTrash2, FiImage 
} from "react-icons/fi";
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
  const [commentPhoto, setCommentPhoto] = useState(null); // URL o Blob de la foto final

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
          localStorage.setItem("cultivapp_questions_cache", JSON.stringify(data));
        } catch (err) {
          const cached = localStorage.getItem("cultivapp_questions_cache");
          if (cached) {
            setQuestions(JSON.parse(cached));
            toast("Cargando formulario desde memoria (Offline)", { icon: '📴' });
          }
        }
      };
      loadQuestions();
    }
  }, [step]);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCapturing(true);
    const toastId = toast.loading(isOnline ? "Sincronizando foto..." : "Guardando en modo offline...");

    const formData = new FormData();
    // Determinamos si es foto de paso o foto de observación final
    const tipoEvidencia = step === 6 ? "comentario_final" : stepsInfo[step].key;
    formData.append("tipo_evidencia", tipoEvidencia);
    formData.append("foto", file);

    try {
      const response = await api.post(`/routes/${id}/photo`, formData);
      
      const photoUrl = response?.offline ? URL.createObjectURL(file) : response.url;

      if (step === 6) {
        // En el paso 6 solo guardamos la foto para previsualizar, no avanzamos paso
        setCommentPhoto(photoUrl);
        toast.success("Foto de observación añadida", { id: toastId });
      } else {
        toast.success("Foto sincronizada", { id: toastId });
        setStep(prev => prev + 1);
      }
    } catch (err) {
      toast.error("Error al procesar imagen", { id: toastId });
    } finally {
      setCapturing(false);
      e.target.value = "";
    }
  };

  const handleScanSuccess = async (decodedText) => {
    if (scannedCodes.includes(decodedText)) return; 
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;
    try {
      await api.post(`/routes/${id}/scans`, { barcode: decodedText });
      setScannedCodes(prev => [decodedText, ...prev]);
      setTimeout(() => { isProcessingScan.current = false; }, 600);
    } catch (err) { isProcessingScan.current = false; }
  };

  const finalizarTodo = async () => {
    setLoading(true);
    try {
      await api.post(`/routes/${id}/finish`, { 
        responses: answers, 
        comment, 
        comment_photo_url: commentPhoto 
      });
      toast.success("¡Visita finalizada exitosamente!");
      navigate("/usuario/home");
    } catch (err) { toast.error("Error al finalizar"); }
    finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen font-[Outfit] p-4 pb-24 flex flex-col items-center transition-colors duration-500 ${isOnline ? 'bg-gray-50' : 'bg-orange-50/40'}`}>
      
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-orange-500 text-white text-[10px] font-black py-1.5 text-center z-[60] flex items-center justify-center gap-2 shadow-lg">
          <FiWifiOff className="animate-pulse" /> MODO SIN CONEXIÓN ACTIVO
        </div>
      )}

      <div className="w-full max-w-md flex justify-between mb-8 sticky top-6 z-20 py-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-700 ${step >= i ? (isOnline ? 'bg-[#87be00]' : 'bg-orange-500') : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-md bg-white p-6 rounded-[2.5rem] shadow-xl text-center space-y-6 border border-gray-100 relative overflow-hidden">
        
        <div className="absolute top-6 right-6 flex items-center gap-1.5">
           <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#87be00]' : 'bg-orange-500'} animate-pulse`} />
           <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div className="space-y-1 pt-2">
            <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter leading-none">{stepsInfo[step].title}</h2>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-[#87be00]' : 'text-orange-500'}`}>{stepsInfo[step].sub}</p>
        </div>

        {/* PASOS 1, 2, 4: CAPTURA SIMPLE */}
        {(step === 1 || step === 2 || step === 4) && (
          <div onClick={() => !capturing && fileInputRef.current.click()} className="w-full aspect-square bg-gray-50 border-4 border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer relative group transition-all active:scale-95">
             {capturing ? <FiLoader className="animate-spin text-[#87be00]" size={44} /> : (
               <>
                 <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <FiCamera size={40} className={isOnline ? 'text-[#87be00]' : 'text-orange-500'} />
                 </div>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">Toca para capturar {stepsInfo[step].title}</span>
               </>
             )}
          </div>
        )}

        {/* PASO 3: SCANNER */}
        {step === 3 && (
          <div className="space-y-4 animate-in zoom-in duration-300">
            <div className="rounded-[2.5rem] overflow-hidden border-2 shadow-2xl">
              <Scanner onScanSuccess={handleScanSuccess} />
            </div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto px-1 custom-scrollbar border-y border-gray-50 py-3">
                {scannedCodes.length > 0 ? scannedCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <FiCheckCircle className="text-[#87be00]" size={14}/>
                      <span className="text-[10px] font-bold text-gray-700">{code}</span>
                    </div>
                    <button onClick={() => setScannedCodes(prev => prev.filter(c => c !== code))} className="text-gray-300"><FiTrash2 size={14}/></button>
                  </div>
                )) : <p className="text-[10px] text-gray-300 font-bold uppercase py-8">Esperando productos...</p>}
            </div>
            <button onClick={() => setStep(4)} className="w-full bg-black text-white py-5 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">Siguiente Paso <FiArrowRight size={16} className="text-[#87be00]"/></button>
          </div>
        )}

        {/* PASO 5: PREGUNTAS */}
        {step === 5 && (
           <div className="space-y-4 animate-in slide-in-from-right duration-300">
             <div className="bg-gray-50 p-2 rounded-[2.5rem] space-y-1">
               {questions.map((q) => (
                 <button key={q.id} onClick={() => setAnswers({...answers, [q.id]: q.question})} className={`w-full flex items-center justify-between p-4 rounded-[1.8rem] transition-all ${answers[q.id] ? 'bg-white shadow-sm' : ''}`}>
                   <span className={`text-[10px] font-bold text-left leading-tight pr-2 ${answers[q.id] ? 'text-[#87be00]' : 'text-gray-500'}`}>{q.question}</span>
                   <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[q.id] ? 'border-[#87be00] bg-[#87be00]' : 'border-gray-200'}`}>{answers[q.id] && <div className="w-1.5 h-1.5 bg-white rounded-full" />}</div>
                 </button>
               ))}
             </div>
             <button onClick={() => setStep(6)} className="w-full bg-black text-white py-5 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">Continuar <FiArrowRight size={16}/></button>
           </div>
        )}

        {/* PASO 6: CIERRE CON FOTO DE OBSERVACIÓN */}
        {step === 6 && (
           <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* LÓGICA DE FOTO DE OBSERVACIÓN */}
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <FiImage className={isOnline ? 'text-[#87be00]' : 'text-orange-500'}/> Foto de observación (Opcional)
                </label>
                
                {commentPhoto ? (
                  <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden border-2 border-gray-100 group">
                    <img src={commentPhoto} alt="Obs" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setCommentPhoto(null)} 
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform"
                    >
                      <FiX size={16}/>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="w-full py-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 active:bg-gray-100 transition-all"
                  >
                    <FiCamera size={24} className="text-gray-300" />
                    <span className="text-[9px] font-black text-gray-400 uppercase">Toca para capturar evidencia final</span>
                  </button>
                )}
              </div>

              {/* TEXTAREA */}
              <div className="text-left space-y-2 px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <FiMessageSquare className={isOnline ? 'text-[#87be00]' : 'text-orange-500'}/> Comentarios Finales
                </label>
                <textarea 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  placeholder="Detalles adicionales de la gestión..." 
                  className="w-full h-28 p-5 bg-gray-50 rounded-[2rem] border-none text-sm outline-none resize-none placeholder:text-gray-300 shadow-inner" 
                />
              </div>

              <button 
                onClick={finalizarTodo} 
                disabled={loading} 
                className={`w-full ${isOnline ? 'bg-[#87be00]' : 'bg-orange-600'} text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all`}
              >
                 {loading ? <FiLoader className="animate-spin" /> : <><FiSend/> {isOnline ? 'Finalizar Visita' : 'Guardar Offline'}</>}
              </button>
           </div>
        )}

        <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-300 text-[8px] font-bold uppercase tracking-[0.3em]">
            <FiMapPin className={isOnline ? 'text-[#87be00]' : 'text-orange-500'} /> LOCAL ID: {id?.slice(0,8).toUpperCase()}
        </div>
      </div>

      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleCapture} className="hidden" />
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }`}</style>
    </div>
  );
};

export default VisitFlow;