import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCamera, FiPackage, FiCheckCircle, FiLoader, FiMapPin } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";

const VisitFlow = () => {
  const { id } = useParams(); // Este es el ID 30a74040... de tu DB
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const stepsInfo = {
    1: { title: "Foto Fachada", sub: "Evidencia de llegada al local" },
    2: { title: "Foto Góndola", sub: "Estado inicial de exhibición" },
    3: { title: "Escaneo de Productos", sub: "Registra lo que vas a reponer" },
    4: { title: "Foto Reposición", sub: "Evidencia de trabajo terminado" },
    5: { title: "Finalizar Visita", sub: "Confirmar y cerrar jornada" }
  };

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCapturing(true);
      // Aquí simulamos la subida. En producción usarías FormData
      setTimeout(() => {
        toast.success(`${stepsInfo[step].title} capturada`);
        setStep(prev => prev + 1);
        setCapturing(false);
      }, 1000);
    }
  };

  const finalizarTodo = async () => {
    setLoading(true);
    try {
      // Llamamos al backend para cambiar el estado a COMPLETED
      await api.patch(`/routes/${id}/complete`);
      toast.success("¡Visita finalizada con éxito!");
      navigate("/usuario/home");
    } catch (err) {
      console.error(err);
      toast.error("Error al cerrar la visita en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Outfit] p-6 flex flex-col items-center">
      {/* Indicador de Pasos */}
      <div className="w-full max-w-md flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-[#87be00]' : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-[3rem] shadow-2xl text-center space-y-6 border border-gray-100">
        <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase italic text-gray-900 tracking-tighter">
            {stepsInfo[step].title}
            </h2>
            <p className="text-[10px] font-black uppercase text-[#87be00] tracking-[0.2em]">
            {stepsInfo[step].sub}
            </p>
        </div>

        {/* Cámara para Pasos 1, 2 y 4 */}
        {(step === 1 || step === 2 || step === 4) && (
          <div 
            onClick={() => !capturing && fileInputRef.current.click()}
            className="w-full aspect-square bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center group active:scale-95 transition-all cursor-pointer overflow-hidden relative"
          >
            {capturing ? (
                <FiLoader className="text-[#87be00] animate-spin" size={40} />
            ) : (
                <>
                    <FiCamera size={60} className="text-[#87be00] mb-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Abrir Cámara</span>
                </>
            )}
          </div>
        )}

        {/* Simulación de Escaneo Paso 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="p-12 bg-gray-50 rounded-[2.5rem] border-2 border-[#87be00] border-dashed">
              <FiPackage size={60} className="mx-auto text-[#87be00] animate-bounce" />
            </div>
            <button 
                onClick={() => setStep(4)} 
                className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl"
            >
              Continuar a Reposición
            </button>
          </div>
        )}

        {/* Paso Final 5 */}
        {step === 5 && (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <FiCheckCircle size={40} className="text-[#87be00]" />
            </div>
            <p className="text-gray-500 text-sm font-medium">¿Confirmas que has terminado todas las tareas en este local?</p>
            <button 
                onClick={finalizarTodo} 
                disabled={loading} 
                className="w-full bg-[#87be00] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? <FiLoader className="animate-spin" /> : "Finalizar y Marcar Salida"}
            </button>
          </div>
        )}

        {/* Info del Local (Opcional) */}
        <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-400 text-[9px] font-bold uppercase">
            <FiMapPin /> ID Ruta: {id.slice(0,8)}...
        </div>
      </div>
      
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