import React, { useState } from 'react';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';
import { FiCamera, FiBox, FiCheck, FiArrowRight, FiX, FiLoader } from 'react-icons/fi';

const VisitFlow = ({ visitId, onBack }) => {
  // Pasos: 'FACHADA' -> 'BEFORE' -> 'SCANNER' -> 'AFTER'
  const [step, setStep] = useState('FACHADA');
  const [barcode, setBarcode] = useState('');
  const [scanned, setScanned] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     📸 MANEJO DE FOTOGRAFÍAS REALES (Con FormData)
  ========================================================= */
  const handleUploadPhoto = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const toastId = toast.loading(`Subiendo foto de ${type}...`);

    // Preparamos el FormData para enviar el archivo real
    const formData = new FormData();
    formData.append('visit_id', visitId);
    formData.append('photo', file); // 'photo' coincide con upload.single("photo") en el backend
    formData.append('photo_type', type); // Opcional: por si quieres guardar el tipo

    try {
      // Enviamos a la ruta que creamos en el backend
      await api.post(`/api/routes/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`${type} guardada con éxito`, { id: toastId });

      // Lógica de navegación entre pasos
      if (type === 'FACHADA') setStep('BEFORE');
      else if (type === 'BEFORE') setStep('SCANNER');
      else if (type === 'AFTER') {
        // En el paso final, procedemos al cierre automático o manual
        handleFinish();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al subir la imagen real", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     📦 ESCANEO DE PRODUCTOS (Lógica actual mantenida)
  ========================================================= */
  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!barcode) return;

    try {
      // Nota: Asegúrate de que este endpoint exista o cámbialo a /api/routes/scan
      const res = await api.post(`/api/routes/visit/${visitId}/scan`, { barcode });
      setScanned(prev => [res.data.product.name, ...prev]);
      setBarcode("");
      toast.success("Producto registrado");
    } catch {
      toast.error("Producto no encontrado");
    }
  };

  /* =========================================================
     ✅ FINALIZAR: CHECK-OUT (Cierre de visita)
  ========================================================= */
  const handleFinish = async () => {
    try {
      // Este endpoint debe cambiar el status de IN_PROGRESS a COMPLETED
      await api.post(`/api/routes/${visitId}/finish`); 
      toast.success("Visita finalizada con éxito");
      onBack();
    } catch (error) {
      toast.error("Error al cerrar visita");
    }
  };

  return (
    <div className="min-h-screen bg-white font-[Outfit] p-6 animate-in slide-in-from-right duration-500 overflow-y-auto pb-20">
      
      {/* HEADER: PROGRESO */}
      <div className="flex justify-between items-center mb-10">
        <button onClick={onBack} className="text-gray-400 text-[10px] font-black uppercase flex items-center gap-1">
          <FiX /> Salir
        </button>
        <div className="flex gap-1">
          {['FACHADA', 'BEFORE', 'SCANNER', 'AFTER'].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'bg-[#87be00] w-12' : 'bg-gray-100 w-6'}`} />
          ))}
        </div>
      </div>

      {/* --- RENDERIZADO DE PASOS --- */}
      <div className="max-w-md mx-auto">
        
        {loading && (
           <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <FiLoader className="animate-spin text-[#87be00] mb-4" size={40} />
              <p className="font-black uppercase text-[10px] tracking-[0.2em]">Procesando Evidencia...</p>
           </div>
        )}

        {/* PASO 1: FACHADA */}
        {step === 'FACHADA' && (
          <div className="space-y-8 animate-in zoom-in">
            <div className="text-left">
              <p className="text-[#87be00] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Paso 01</p>
              <h2 className="text-5xl font-black italic uppercase leading-[0.85] tracking-tighter">Foto del<br/>Local</h2>
            </div>
            <label className="block aspect-[4/5] bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3.5rem] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all shadow-inner">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleUploadPhoto(e, 'FACHADA')} disabled={loading} />
              <div className="bg-white p-10 rounded-full shadow-2xl text-[#87be00] mb-6 animate-bounce"><FiCamera size={48} /></div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Capturar Fachada</span>
            </label>
          </div>
        )}

        {/* PASO 2: GÓNDOLA ANTES */}
        {step === 'BEFORE' && (
          <div className="space-y-8 animate-in zoom-in">
            <div className="text-left">
              <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Paso 02</p>
              <h2 className="text-5xl font-black italic uppercase leading-[0.85] tracking-tighter">Góndola<br/>Inicial</h2>
            </div>
            <label className="block aspect-[4/5] bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3.5rem] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all shadow-inner">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleUploadPhoto(e, 'BEFORE')} disabled={loading} />
              <div className="bg-white p-10 rounded-full shadow-2xl text-orange-500 mb-6"><FiCamera size={48} /></div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Foto antes de trabajar</span>
            </label>
          </div>
        )}

        {/* PASO 3: ESCANEO (REPOSICIÓN) */}
        {step === 'SCANNER' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="text-left">
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Paso 03</p>
              <h2 className="text-4xl font-black italic uppercase leading-[0.85] tracking-tighter">Reponiedo<br/>Productos</h2>
            </div>
            <form onSubmit={handleScan} className="relative mt-4">
              <input 
                value={barcode} onChange={(e) => setBarcode(e.target.value)}
                placeholder="Escanear Código" autoFocus
                className="w-full bg-gray-100 p-7 rounded-[2.5rem] font-black uppercase text-[13px] shadow-inner outline-none border-2 border-transparent focus:border-[#87be00] transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-5 rounded-[2rem] shadow-xl active:scale-90 transition-all"><FiBox size={20}/></button>
            </form>
            <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
              {scanned.length === 0 && <p className="text-center py-10 text-[10px] text-gray-300 font-bold uppercase tracking-widest">Esperando escaneo...</p>}
              {scanned.map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-gray-50 p-5 rounded-[2rem] animate-in slide-in-from-left">
                  <div className="bg-[#87be00] text-white p-2.5 rounded-xl shadow-lg shadow-[#87be00]/30"><FiCheck size={16}/></div>
                  <span className="text-[12px] font-black uppercase truncate text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep('AFTER')} className="w-full bg-black text-white py-7 rounded-[2.5rem] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
              Siguiente: Foto Final <FiArrowRight />
            </button>
          </div>
        )}

        {/* PASO 4: FOTO DESPUÉS */}
        {step === 'AFTER' && (
          <div className="space-y-8 animate-in zoom-in">
            <div className="text-left">
              <p className="text-[#87be00] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Paso Final</p>
              <h2 className="text-5xl font-black italic uppercase leading-[0.85] tracking-tighter text-[#87be00]">Góndola<br/>Repuesta</h2>
            </div>
            <label className="block aspect-[4/5] bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3.5rem] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all shadow-inner">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleUploadPhoto(e, 'AFTER')} disabled={loading} />
              <div className="bg-white p-10 rounded-full shadow-2xl text-[#87be00] mb-6"><FiCamera size={48} /></div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Capturar Foto Final</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitFlow;