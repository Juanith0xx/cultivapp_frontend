import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCamera, FiPackage, FiCheckCircle, FiLoader, FiMapPin, FiArrowRight } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import Scanner from "../../components/Scanner"; 

const VisitFlow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [scannedCodes, setScannedCodes] = useState([]); 

  const stepsInfo = {
    1: { key: "fachada", title: "Foto de Local", sub: "Evidencia de llegada" },
    2: { key: "gondola_inicio", title: "Góndola Inicial", sub: "Estado previo a reposición" },
    3: { key: "escaneo", title: "Escanear Productos", sub: "Registra los EAN de reposición" },
    4: { key: "gondola_final", title: "Góndola Final", sub: "Evidencia trabajo terminado" },
    5: { key: "finalizar", title: "Finalizar Visita", sub: "Resumen y cierre de jornada" }
  };

  // 📸 MANEJO DE CAPTURA DE IMÁGENES
  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCapturing(true);
    const toastId = toast.loading("Subiendo foto...");

    const formData = new FormData();
    formData.append("tipo_evidencia", stepsInfo[step].key); 
    formData.append("foto", file);

    try {
      await api.post(`/routes/${id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(`${stepsInfo[step].title} guardada`, { id: toastId });
      setStep(prev => prev + 1);
    } catch (err) {
      toast.error("Error al subir imagen. Reintenta.", { id: toastId });
    } finally {
      setCapturing(false);
    }
  };

  // 🔍 MANEJO DE ESCANEO EXITOSO
  const handleScanSuccess = async (decodedText) => {
    // Evitar procesar el mismo código varias veces seguidas si se queda apuntando
    if (scannedCodes.includes(decodedText)) return;

    const toastId = toast.loading(`Registrando EAN: ${decodedText}`);
    try {
      await api.post(`/routes/${id}/scans`, { barcode: decodedText });
      
      setScannedCodes(prev => [decodedText, ...prev]); // El más nuevo arriba
      toast.success("Producto registrado", { id: toastId });
    } catch (err) {
      toast.error("Error al registrar código", { id: toastId });
    }
  };

  const finalizarTodo = async () => {
    setLoading(true);
    try {
      await api.post(`/routes/${id}/finish`); 
      toast.success("¡Visita cerrada correctamente!");
      navigate("/usuario/home");
    } catch (err) {
      toast.error("Error al finalizar el reporte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Outfit] p-4 pb-24 flex flex-col items-center">
      
      {/* 🟢 BARRA DE PROGRESO SUPERIOR */}
      <div className="w-full max-w-md flex justify-between mb-8 sticky top-4 z-20 bg-gray-50/80 backdrop-blur-sm py-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-700 ${step >= i ? 'bg-[#87be00]' : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-md bg-white p-6 rounded-[2.5rem] shadow-xl text-center space-y-6 border border-gray-100">
        
        {/* ENCABEZADO DE PASO */}
        <div className="space-y-1">
            <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter leading-none">
              {stepsInfo[step].title}
            </h2>
            <p className="text-[9px] font-black uppercase text-[#87be00] tracking-[0.2em]">
              {stepsInfo[step].sub}
            </p>
        </div>

        {/* 📷 INTERFAZ DE CÁMARA (Pasos 1, 2, 4) */}
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

        {/* 🛒 INTERFAZ DE ESCÁNER (Paso 3) */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="rounded-[2rem] overflow-hidden border-2 border-[#87be00] shadow-inner">
              <Scanner 
                onScanSuccess={handleScanSuccess} 
                onScanError={(err) => console.log("Buscando...")} 
              />
            </div>
            
            {/* Visualización de productos escaneados */}
            {scannedCodes.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-2 text-left px-1">
                  Últimos escaneos ({scannedCodes.length})
                </p>
                <div className="flex flex-wrap gap-2 justify-start">
                  {scannedCodes.slice(0, 4).map((c, i) => (
                    <span key={i} className="bg-white text-[9px] font-bold px-2 py-1 rounded-lg border border-gray-200 shadow-sm animate-in slide-in-from-top-1">
                      ...{c.slice(-6)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button 
                onClick={() => setStep(4)} 
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:bg-[#87be00] transition-colors"
            >
              Continuar a Foto Final <FiArrowRight size={16}/>
            </button>
          </div>
        )}

        {/* ✅ INTERFAZ DE CIERRE (Paso 5) */}
        {step === 5 && (
          <div className="space-y-6 py-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-[#87be00]/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <FiCheckCircle size={48} className="text-[#87be00]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-800">¡Todo listo!</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight px-4">
                Has completado todas las evidencias y registros de productos.
              </p>
            </div>
            <button 
                onClick={finalizarTodo} 
                disabled={loading} 
                className="w-full bg-[#87be00] text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2 active:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? <FiLoader className="animate-spin" /> : "Enviar Reporte y Finalizar"}
            </button>
          </div>
        )}

        {/* FOOTER - INFO DE RUTA */}
        <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-400 text-[8px] font-bold uppercase tracking-widest">
            <FiMapPin className="text-[#87be00]" /> LOCAL ID: {id?.slice(0,8).toUpperCase()}
        </div>
      </div>
      
      {/* INPUT OCULTO DE CÁMARA NATIVA */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleCapture} 
        className="hidden" 
      />
    </div>
  );
};

export default VisitFlow;