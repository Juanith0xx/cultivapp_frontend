import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';

const Scanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Configurar el lector de ZXing
    const hints = new Map();
    // Especificamos que solo busque códigos de barras (EAN_13, EAN_8, UPC, etc.)
    // Esto hace el escaneo mucho más rápido que buscar QR + Barcodes.
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128
    ]);
    
    // 🚩 CLAVE PARA IPHONE: Habilitar el intento de "tryHarder" para enfoque difícil
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    // 2. Definir las restricciones de video para iPhone 12
    const constraints = {
      video: {
        facingMode: "environment", // Cámara trasera
        width: { ideal: 1280 }, // Resolución HD es suficiente y rápida
        height: { ideal: 720 },
        // 🚩 CLAVE PARA IPHONE: Forzar autoenfoque continuo en WebKit
        focusMode: "continuous", 
        pointsOfInterest: { ideal: { x: 0.5, y: 0.5 } } // Enfocar al centro
      },
      audio: false
    };

    const startScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        // Pedir permisos y obtener el stream
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Asignar el stream al elemento video
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          //PlaysInline es obligatorio en iOS
          videoRef.current.setAttribute("playsinline", true); 
          
          // Intentar forzar el enfoque continuo de hardware si está disponible
          const videoTrack = stream.getVideoTracks()[0];
          const capabilities = videoTrack.getCapabilities?.();
          
          if (capabilities?.focusMode?.includes('continuous')) {
            await videoTrack.applyConstraints({
              advanced: [{ focusMode: 'continuous' }]
            });
            console.log("✅ Autoenfoque continuo activado por hardware");
          }
        }

        // Iniciar la decodificación continua
        reader.decodeFromVideoElement(videoRef.current, (result, err) => {
          if (result) {
            // ¡ÉXITO! Código decodificado
            onScanSuccess(result.getText());
            
            // Feedback visual/auditivo rápido (opcional)
            if (navigator.vibrate) navigator.vibrate(100);
          }
          // Ignoramos los errores de 'NotFoundException' (son normales entre frames)
        });

        setLoading(false);
      } catch (err) {
        console.error("Error iniciando escáner:", err);
        setError("No se pudo acceder a la cámara trasera. Verifica los permisos.");
        setLoading(false);
      }
    };

    // Esperamos un segundo para que iOS inicialice el DOM
    const timeoutId = setTimeout(startScanner, 1000);

    // 3. Limpieza al desmontar el componente
    return () => {
      clearTimeout(timeoutId);
      if (readerRef.current) {
        readerRef.current.reset(); // Detiene la decodificación
      }
      // Detener el stream de video manualmente
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="relative w-full bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-[#87be00]/30 aspect-[4/3] flex items-center justify-center">
      
      {/* Elemento Video Nativo */}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover" 
        playsInline 
        muted 
        autoPlay
      />

      {/* ESTADOS: Cargando o Error */}
      {(loading || error) && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 z-10">
          {loading && (
            <>
              <FiLoader className="text-[#87be00] animate-spin" size={40} />
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Iniciando Cámara...</p>
            </>
          )}
          {error && (
            <>
              <FiAlertTriangle className="text-red-500" size={40} />
              <p className="text-xs font-bold text-white text-center">{error}</p>
              <p className="text-[9px] text-gray-400 uppercase font-medium">Asegúrate de usar HTTPS en local</p>
            </>
          )}
        </div>
      )}

      {/* CAPA DE GUÍA VISUAL "CULTIVAPP STYLE" ( pointer-events-none para no bloquear el toque ) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20">
        
        {/* RECUADRO DE ENFOQUE (Más pequeño para forzar distancia focal) */}
        <div className="w-[240px] h-[140px] border-2 border-[#87be00]/60 rounded-2xl relative overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          {/* Línea de escaneo animada */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-[#87be00] shadow-[0_0_15px_#87be00] animate-scan"></div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="px-5 py-2 bg-[#87be00] text-black text-[10px] font-black uppercase rounded-full shadow-lg">
            Escáner Cultivapp
          </div>
          <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest">
            Centra el código y aleja un poco el móvil
          </p>
        </div>
      </div>

      {/* Estilos para la animación de escaneo */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Scanner;