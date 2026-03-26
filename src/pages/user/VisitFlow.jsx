import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// 🚩 NUEVO ICONO: FiX para borrar la foto
import { FiCamera, FiPackage, FiCheckCircle, FiLoader, FiMapPin, FiArrowRight, FiMessageSquare, FiSend, FiX } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import Scanner from "../../components/Scanner"; 

const VisitFlow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const isProcessingScan = useRef(false);

  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [scannedCodes, setScannedCodes] = useState([]); 

  // --- ESTADOS PARA CULTIVAPP QUESTIONS ---
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { id: texto_pregunta }
  const [comment, setComment] = useState("");
  
  // 🚩 NUEVO ESTADO: Guarda la URL de la foto de comentarios (si existe)
  const [commentPhoto, setCommentPhoto] = useState(null);

  const stepsInfo = {
    1: { key: "fachada", title: "Foto de Local", sub: "Evidencia de llegada" },
    2: { key: "gondola_inicio", title: "Góndola Inicial", sub: "Estado previo a reposición" },
    3: { key: "escaneo", title: "Escanear Productos", sub: "Registra los EAN de reposición" },
    4: { key: "gondola_final", title: "Góndola Final", sub: "Evidencia trabajo terminado" },
    5: { key: "preguntas", title: "Gestión Realizada", sub: "Responde el formulario de visita" },
    // 🚩 ACTUALIZADO: Título y Sub para reflejar ambas acciones
    6: { key: "comentarios", title: "Cierre de Visita", sub: "Evidencia final y observaciones" }
  };

  // Cargar preguntas cuando llegamos al paso 5
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

  // 🔍 MANEJO DE CAPTURA DE FOTOS OPTIMIZADO
  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCapturing(true);
    const toastId = toast.loading("Subiendo foto...");
    const formData = new FormData();
    
    // Si estamos en el paso 6, usamos un tipo específico
    const tipoEvidencia = step === 6 ? "comentario_final" : stepsInfo[step].key;
    formData.append("tipo_evidencia", tipoEvidencia); 
    formData.append("foto", file);

    try {
      // 🚩 MEJORA: Obtenemos la URL de la foto subida
      const response = await api.post(`/routes/${id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success(`${stepsInfo[step].title} guardada`, { id: toastId });

      // LÓGICA POR PASO
      if (step === 6) {
        // 🚩 En el paso 6, guardamos la URL y NO avanzamos el paso
        // Asumiendo que tu backend devuelve la URL como { url: '...' }
        if (response.url) setCommentPhoto(response.url); 
      } else {
        // Pasos 1, 2 y 4 avanzan
        setStep(prev => prev + 1);
      }

    } catch (err) {
      toast.error("Error al subir imagen. Reintenta.", { id: toastId });
    } finally {
      setCapturing(false);
      // Limpiamos el input file para permitir capturar la misma foto si se borra
      e.target.value = ""; 
    }
  };

  const handleScanSuccess = async (decodedText) => {
    if (isProcessingScan.current) return;
    if (scannedCodes.includes(decodedText)) {
      toast.error("Este producto ya fue registrado", { id: "duplicate-toast" });
      return;
    }
    isProcessingScan.current = true;
    const toastId = toast.loading(`Registrando EAN: ${decodedText}`);
    try {
      await api.post(`/routes/${id}/scans`, { barcode: decodedText });
      setScannedCodes(prev => [decodedText, ...prev]);
      toast.success("Producto registrado", { id: toastId });
      setTimeout(() => { isProcessingScan.current = false; }, 5000);
    } catch (err) {
      toast.error("Error al registrar código", { id: toastId });
      isProcessingScan.current = false; 
    }
  };

  const finalizarTodo = async () => {
    setLoading(true);
    try {
      await api.post(`/routes/${id}/finish`, {
        responses: answers,
        comment: comment,
        comment_photo_url: commentPhoto // Enviamos la URL de la foto capturada en este paso
      }); 
      toast.success("¡Visita Cultivapp cerrada!");
      navigate("/usuario/home");
    } catch (err) {
      toast.error("Error al finalizar el reporte");
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para forzar la apertura de la cámara en el paso 6
  const triggerCommentPhoto = () => {
    if (!capturing) fileInputRef.current.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Outfit] p-4 pb-24 flex flex-col items-center">
      
      {/* STEPS INDICATOR */}
      <div className="w-full max-w-md flex justify-between mb-8 sticky top-4 z-20 bg-gray-50/80 backdrop-blur-sm py-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-700 ${step >= i ? 'bg-[#87be00]' : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-md bg-white p-6 rounded-[2.5rem] shadow-xl text-center space-y-6 border border-gray-100 relative">
        
        <div className="space-y-1">
            <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter leading-none">
              {stepsInfo[step].title}
            </h2>
            <p className="text-[9px] font-black uppercase text-[#87be00] tracking-[0.2em]">
              {stepsInfo[step].sub}
            </p>
        </div>

        {/* PASOS DE FOTO AUTOMÁTICOS (1, 2, 4) */}
        {(step === 1 || step === 2 || step === 4) && (
          <div 
            onClick={() => !capturing && fileInputRef.current.click()}
            className="w-full aspect-square bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer overflow-hidden relative group"
          >
            {capturing ? (
                <div className="flex flex-col items-center gap-2">
                  <FiLoader className="text-[#87be00] animate-spin" size={40} />
                  <p className="text-[8px] font-black text-gray-400 uppercase">Procesando...</p>
                </div>
            ) : (
                <>
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <FiCamera size={40} className="text-[#87be00]" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-6">
                      Toca para capturar evidencia
                    </span>
                </>
            )}
          </div>
        )}

        {/* PASO 3: ESCANEO */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="rounded-[2rem] overflow-hidden border-2 border-[#87be00] shadow-inner">
              <Scanner onScanSuccess={handleScanSuccess} />
            </div>
            <button onClick={() => setStep(4)} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:bg-[#87be00]">
              Continuar a Foto Final <FiArrowRight size={16}/>
            </button>
          </div>
        )}

        {/* PASO 5: PREGUNTAS (ESTILO CULTIVAPP) */}
        {step === 5 && (
          <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <div className="bg-gray-50 p-2 rounded-[2rem] space-y-1">
              {questions.map((q) => {
                const isSelected = answers[q.id] === q.question;
                return (
                  <button
                    key={q.id}
                    onClick={() => setAnswers({...answers, [q.id]: q.question})}
                    className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all ${isSelected ? 'bg-white shadow-sm' : ''}`}
                  >
                    <span className={`text-[10px] font-bold text-left leading-tight pr-2 ${isSelected ? 'text-[#87be00]' : 'text-gray-500'}`}>
                      {q.question}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-[#87be00] bg-[#87be00]' : 'border-gray-200'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep(6)} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:bg-[#87be00]">
              Continuar a Cierre <FiArrowRight size={16}/>
            </button>
          </div>
        )}

        {/* 🚩 PASO 6: COMENTARIOS Y FOTO FINAL (ACTUALIZADO) */}
        {step === 6 && (
          <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* LÓGICA DE FOTO EN COMENTARIOS */}
            {commentPhoto ? (
                // Vista Previa de la Foto Capturada
                <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-lg group">
                    <img 
                        src={`http://localhost:5000${commentPhoto}`} // 🚩 Ojo con la URL local
                        alt="Evidencia Final"
                        className="w-full h-full object-cover"
                    />
                    <button 
                        onClick={() => setCommentPhoto(null)} 
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform"
                        title="Borrar foto y reintentar"
                    >
                        <FiX size={16}/>
                    </button>
                </div>
            ) : (
                // Botón para Capturar la Foto (Estilo Cultivapp)
                <button 
                    onClick={triggerCommentPhoto}
                    className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 rounded-3xl transition-colors active:scale-[0.98]"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-[#87be00]">
                            <FiCamera size={20}/>
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-gray-800">Capturar Evidencia Final</p>
                            <p className="text-[9px] text-gray-400 font-medium">Opcional: Captura de fachada o gestión</p>
                        </div>
                    </div>
                    {capturing ? (
                        <FiLoader className="text-[#87be00] animate-spin" size={20}/>
                    ) : (
                        <FiArrowRight size={18} className="text-gray-300"/>
                    )}
                </button>
            )}

             {/* TEXTAREA DE COMENTARIOS */}
             <div className="text-left space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2">
                  <FiMessageSquare className="text-[#87be00]"/> Comentarios adicionales
                </label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ingrese observaciones finales de la visita..."
                  className="w-full h-32 p-5 bg-gray-50 rounded-[1.8rem] border-none text-sm focus:ring-2 ring-[#87be00]/20 outline-none resize-none placeholder:text-gray-300 font-medium"
                />
             </div>

            {/* BOTÓN FINALIZAR */}
            <button 
                onClick={finalizarTodo} 
                disabled={loading} 
                className="w-full bg-[#87be00] text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? <FiLoader className="animate-spin" /> : <><FiSend/> Finalizar Reporte Cultivapp</>}
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-400 text-[8px] font-bold uppercase tracking-widest">
            <FiMapPin className="text-[#87be00]" /> LOCAL ID: {id?.slice(0,8).toUpperCase()}
        </div>
      </div>
      
      {/* Input file oculto (utilizado por todos los pasos) */}
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleCapture} className="hidden" />
    </div>
  );
};

export default VisitFlow;