import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCamera, FiPackage, FiCheckCircle, FiLoader, FiMapPin, FiX } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import Scanner from "../../components/Scanner"; // 🚩 IMPORTAMOS TU COMPONENTE DE ESCANEO

const VisitFlow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [scannedCodes, setScannedCodes] = useState([]); // Para guardar lo que escanea

  const stepsInfo = {
    1: { key: "fachada", title: "Toma foto de local", sub: "Evidencia de llegada" },
    2: { key: "gondola_inicio", title: "Foto góndola inicial", sub: "Estado antes de reponer" },
    3: { key: "escaneo", title: "Escanear productos", sub: "Registra los EAN reponiendo" },
    4: { key: "gondola_final", title: "Foto término", sub: "Evidencia trabajo terminado" },
    5: { key: "finalizar", title: "Finalizar Visita", sub: "Confirmar y cerrar jornada" }
  };

  // 📸 MANEJO DE FOTOS
  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCapturing(true);
    const toastId = toast.loading("Subiendo evidencia...");

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
      toast.error("Error al subir foto", { id: toastId });
    } finally {
      setCapturing(false);
    }
  };

  // 🔍 MANEJO DE ESCANEO REAL
  const handleScanSuccess = async (decodedText) => {
    // Evitar escaneos duplicados seguidos
    if (scannedCodes.includes(decodedText)) return;

    const toastId = toast.loading(`Registrando: ${decodedText}`);
    try {
      // 🚩 Endpoint sugerido para guardar el producto escaneado
      await api.post(`/routes/${id}/scans`, { barcode: decodedText });
      
      setScannedCodes(prev => [...prev, decodedText]);
      toast.success("Producto registrado", { id: toastId });
      
      // Si quieres que avance al siguiente paso tras el primer escaneo:
      // setStep(4); 
      // Pero usualmente querrán escanear varios, así que añadimos un botón "Continuar" abajo.
    } catch (err) {
      toast.error("Error al registrar código");
    }
  };

  const finalizarTodo = async () => {
    setLoading(true);
    try {
      await api.post(`/routes/${id}/finish`); 
      toast.success("¡Visita finalizada!");
      navigate("/usuario/home");
    } catch (err) {
      toast.error("Error al cerrar visita");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Outfit] p-4 pb-20 flex flex-col items-center">
      
      {/* 🟢 PROGRESS BAR */}
      <div className="w-full max-w-md flex justify-between mb-6 sticky top-4 z-20">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-[#87be00]' : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-md bg-white p-6 rounded-[2.5rem] shadow-xl text-center space-y-6 border border-gray-100">
        <div className="space-y-1">
            <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter">
              {stepsInfo[step].title}
            </h2>
            <p className="text-[9px] font-black uppercase text-[#87be00] tracking-widest">
              {stepsInfo[step].sub}
            </p>
        </div>

        {/* 📷 CAPTURA DE FOTOS (PASOS 1, 2, 4) */}
        {(step === 1 || step === 2 || step === 4) && (
          <div 
            onClick={() => !capturing && fileInputRef.current.click()}
            className="w-full aspect-square bg-gray-50 border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer overflow-hidden relative"
          >
            {capturing ? (
                <FiLoader className="text-[#87be00] animate-spin" size={40} />
            ) : (
                <>
                    <FiCamera size={50} className="text-[#87be00] mb-2" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tocar para Foto</span>
                </>
            )}
          </div>
        )}

        {/* 🛒 PASO 3: ESCANEO DE PRODUCTOS REAL */}
        {step === 3 && (
          <div className="space-y-4">
            <Scanner 
              onScanSuccess={handleScanSuccess} 
              onScanError={(err) => console.log(err)} 
            />
            
            {/* Lista de productos escaneados (Miniature) */}
            {scannedCodes.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Escaneados ({scannedCodes.length})</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {scannedCodes.slice(-3).map((c, i) => (
                    <span key={i} className="bg-white text-[9px] font-bold px-2 py-1 rounded-lg border border-gray-200">
                      {c.slice(-6)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button 
                onClick={() => setStep(4)} 
                className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2"
            >
              Continuar a Foto Final <FiCheckCircle />
            </button>
          </div>
        )}

        {/* ✅ PASO 5: FINALIZAR */}
        {step === 5 && (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-[#87be00]/10 rounded-full flex items-center justify-center mx-auto">
                <FiCheckCircle size={40} className="text-[#87be00]" />
            </div>
            <p className="text-xs font-medium text-gray-500">¿Estás seguro de finalizar la visita?</p>
            <button 
                onClick={finalizarTodo} 
                disabled={loading} 
                className="w-full bg-[#87be00] text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <FiLoader className="animate-spin" /> : "Cerrar Reporte"}
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-400 text-[8px] font-bold uppercase">
            <FiMapPin /> GPS ACTIVO • ID: {id?.slice(0,6)}
        </div>
      </div>
      
      {/* Input oculto para cámara */}
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