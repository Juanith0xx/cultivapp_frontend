import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { 
      fps: 20, 
      qrbox: { width: 280, height: 160 },
      aspectRatio: 1.0 
    };

    const startScanner = async () => {
      try {
        // 🚩 Intentamos primero la trasera (para iPhone)
        // Si falla, el catch intentará abrir la que esté disponible (PC)
        await html5QrCode.start(
          { facingMode: "environment" }, 
          config,
          onScanSuccess,
          onScanError
        );
      } catch (err) {
        console.warn("No se detectó cámara trasera, intentando cámara por defecto...");
        try {
          // 🚩 Segundo intento: Cualquier cámara (esto activará la frontal en tu PC)
          await html5QrCode.start(
            { facingMode: "user" }, // Cambiado a 'user' para probar frontal en PC
            config,
            onScanSuccess,
            onScanError
          );
        } catch (lastErr) {
          console.error("Error definitivo al iniciar cámara:", lastErr);
        }
      }
    };

    const timeoutId = setTimeout(startScanner, 500);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.error(e));
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="relative w-full bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-[#87be00]/30">
      <div id="reader" className="w-full min-h-[300px] md:min-h-[400px]"></div>
      
      {/* Guía visual */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        <div className="w-[280px] h-[160px] border-2 border-[#87be00] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.9)]"></div>
        <div className="mt-4 px-4 py-1 bg-[#87be00] text-black text-[9px] font-black uppercase rounded-full animate-pulse">
          Escáner Activo
        </div>
      </div>
    </div>
  );
};

export default Scanner;