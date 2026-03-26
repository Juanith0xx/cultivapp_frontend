import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    // 🚩 CONFIGURACIÓN DE ALTO RENDIMIENTO PARA CULTIVAPP
    const config = { 
      fps: 15, 
      // Reducimos un poco el cuadro para que el usuario aleje el móvil
      // Esto ayuda al lente del iPhone a encontrar el foco (Macro natural)
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.7777778, // Ratio 16:9 nativo de iPhone
      disableFlip: false,
    };

    const startScanner = async () => {
      try {
        // 🚩 INTENTO 1: Trasera con Focus Mode Continuo
        await html5QrCode.start(
          { facingMode: "environment" }, 
          {
            ...config,
            // Constraints avanzadas para hardware moderno
            videoConstraints: {
              facingMode: "environment",
              focusMode: "continuous",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          },
          onScanSuccess,
          onScanError
        );
      } catch (err) {
        console.warn("Fallo enfoque avanzado, intentando modo estándar...");
        try {
          // 🚩 INTENTO 2: Fallback (Cualquier cámara disponible)
          await html5QrCode.start(
            { facingMode: "user" }, 
            config,
            onScanSuccess,
            onScanError
          );
        } catch (lastErr) {
          console.error("Error definitivo al iniciar cámara:", lastErr);
        }
      }
    };

    // iOS requiere un tiempo extra para inicializar el driver de video
    const timeoutId = setTimeout(startScanner, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop()
            .then(() => {
              scannerRef.current.clear();
            })
            .catch(e => console.error("Error al limpiar cámara:", e));
        }
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="relative w-full bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-[#87be00]/30">
      <div id="reader" className="w-full min-h-[300px] md:min-h-[400px]"></div>
      
      {/* CAPA DE GUÍA VISUAL "CULTIVAPP STYLE" */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        
        {/* RECUADRO DE ENFOQUE */}
        <div className="w-[250px] h-[150px] border-2 border-[#87be00]/60 rounded-2xl relative overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
          {/* Línea de escaneo animada */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-[#87be00] shadow-[0_0_15px_#87be00] animate-scan"></div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="px-5 py-2 bg-[#87be00] text-black text-[10px] font-black uppercase rounded-full shadow-lg">
            Escáner de Productos
          </div>
          <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
            Centra el código y mantén la distancia
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
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Scanner;