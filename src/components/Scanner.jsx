import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { FiLoader, FiAlertTriangle, FiMaximize, FiZap } from 'react-icons/fi';

const Scanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.CODE_128
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    const startScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        // Configuración refinada para máxima compatibilidad
        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
            // En PC usamos 1280x720, en móvil Safari prefiere 1080p si está disponible
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // 🚩 ESENCIAL PARA IPHONE
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("muted", "true");
          
          // Intentar autoenfoque avanzado
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities?.();
          if (capabilities?.focusMode?.includes('continuous')) {
            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
          }
        }

        // Iniciar escaneo
        reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) {
            onScanSuccess(result.getText());
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          }
        });

        setLoading(false);
      } catch (err) {
        console.error("Error cámara:", err);
        setError("Permiso denegado o cámara no encontrada.");
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(startScanner, 800);

    return () => {
      clearTimeout(timeoutId);
      if (readerRef.current) readerRef.current.reset();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] md:aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-[#87be00]/20 group">
      
      {/* Video - Con object-cover para que siempre llene el contenedor sin deformar */}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover transition-opacity duration-700" 
        playsInline 
        muted 
        autoPlay
        style={{ opacity: loading ? 0 : 1 }}
      />

      {/* Pantallas de Estado */}
      {(loading || error) && (
        <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-8 z-50">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <FiLoader className="text-[#87be00] animate-spin" size={48} />
                <div className="absolute inset-0 blur-lg bg-[#87be00]/20 animate-pulse"></div>
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Calibrando Óptica...</p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <FiAlertTriangle className="text-orange-500 mx-auto" size={40} />
              <p className="text-xs font-bold text-white uppercase tracking-tight">{error}</p>
              <button onClick={() => window.location.reload()} className="text-[10px] text-[#87be00] font-black underline uppercase">Reintentar</button>
            </div>
          )}
        </div>
      )}

      {/* OVERLAY CULTIVAPP UI */}
      {!loading && !error && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8 z-20">
          
          {/* Esquinas decorativas */}
          <div className="absolute top-10 left-10 w-8 h-8 border-t-4 border-l-4 border-[#87be00] rounded-tl-xl opacity-50"></div>
          <div className="absolute top-10 right-10 w-8 h-8 border-t-4 border-r-4 border-[#87be00] rounded-tr-xl opacity-50"></div>
          <div className="absolute bottom-10 left-10 w-8 h-8 border-b-4 border-l-4 border-[#87be00] rounded-bl-xl opacity-50"></div>
          <div className="absolute bottom-10 right-10 w-8 h-8 border-b-4 border-r-4 border-[#87be00] rounded-br-xl opacity-50"></div>

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Scanner Live</span>
          </div>

          {/* Area de Enfoque Dinámica */}
          <div className="relative w-64 h-40 border border-white/20 rounded-3xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#87be00]/5 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#87be00] shadow-[0_0_20px_#87be00] animate-scanning"></div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="text-white text-[10px] font-bold uppercase tracking-wider text-center max-w-[200px] leading-relaxed drop-shadow-md">
              Alinea el código de barras dentro del recuadro
            </p>
            <div className="flex gap-4">
               <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/50"><FiZap size={18}/></div>
               <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/50"><FiMaximize size={18}/></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanning {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(160px); opacity: 0; }
        }
        .animate-scanning {
          animation: scanning 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default Scanner;