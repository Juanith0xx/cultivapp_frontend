import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';

const Scanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Configuración de Lectura
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.UPC_A
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;

    const constraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: "continuous"
      }
    };

    const startScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!navigator.mediaDevices) {
          throw new Error("No se detectó acceso a dispositivos multimedia (Revisa HTTPS).");
        }

        // 2. Iniciar escaneo directamente desde el lector (Más estable)
        await codeReader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, err) => {
            if (result) {
              onScanSuccess(result.getText());
              if (navigator.vibrate) navigator.vibrate(100);
            }
            // NotFoundException ocurre en cada frame donde no hay código, lo ignoramos.
          }
        );

        setLoading(false);
      } catch (err) {
        console.error("Scanner Error:", err);
        setError(err.name === 'NotAllowedError' ? "Permiso denegado." : err.message);
        setLoading(false);
      }
    };

    // Delay para iPhone Safari
    const timeoutId = setTimeout(startScanner, 500);

    return () => {
      clearTimeout(timeoutId);
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-[#87be00]/20">
      
      {/* 🚩 VIDEO: playsInline y muted son vitales en iPhone */}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover" 
        playsInline 
        muted 
      />

      {/* OVERLAY VISUAL (Todo con pointer-events-none) */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8">
        
        {/* Recuadro de Enfoque */}
        <div className="relative w-64 h-48 border-2 border-white/30 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
          
          {/* Esquinas Brillantes */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#87be00] rounded-tl-xl"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#87be00] rounded-tr-xl"></div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#87be00] rounded-bl-xl"></div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#87be00] rounded-br-xl"></div>

          {/* Línea de Escaneo Sutil (No obstruye el centro) */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#87be00] opacity-50 shadow-[0_0_8px_#87be00] animate-pulse"></div>
        </div>

        <p className="mt-8 text-white text-[10px] font-black uppercase tracking-widest text-center bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
          Escaneando Código EAN
        </p>
      </div>

      {/* Pantallas de Carga/Error */}
      {loading && !error && (
        <div className="absolute inset-0 bg-neutral-900 z-20 flex flex-col items-center justify-center gap-4">
          <FiLoader className="text-[#87be00] animate-spin" size={40} />
          <span className="text-[10px] text-white font-black uppercase tracking-widest">Iniciando Lente...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-neutral-950 z-30 flex flex-col items-center justify-center p-6 text-center gap-4">
          <FiAlertTriangle className="text-orange-500" size={40} />
          <p className="text-white text-xs font-bold leading-relaxed">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#87be00] text-black text-[10px] font-black rounded-full uppercase">
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
};

export default Scanner;