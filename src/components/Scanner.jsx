import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    // 🚩 AJUSTE PARA IOS: Configuración optimizada
    const config = { 
      fps: 10, // Bajamos un poco los FPS para no saturar el procesador de iOS
      qrbox: { width: 280, height: 160 },
      aspectRatio: 1.7777778, // 🚩 Cambiado a 16:9, que es el nativo de la cámara de iPhone
      disableFlip: false, // 🚩 Importante para que no falle el renderizado en WebKit
    };

    const startScanner = async () => {
      try {
        // 🚩 Intento 1: Cámara trasera con restricciones de video específicas para iOS
        await html5QrCode.start(
          { facingMode: "environment" }, 
          config,
          (decodedText, result) => {
            // Detenemos el escáner visualmente un segundo para dar feedback en iOS
            onScanSuccess(decodedText, result);
          },
          onScanError
        );
      } catch (err) {
        console.warn("Fallo cámara trasera, intentando fallback...", err);
        try {
          // 🚩 Intento 2: Fallback genérico
          await html5QrCode.start(
            { facingMode: "user" }, 
            config,
            onScanSuccess,
            onScanError
          );
        } catch (lastErr) {
          console.error("Error definitivo en iOS/Android:", lastErr);
        }
      }
    };

    // 🚩 AJUSTE PARA IOS: Esperamos 1 segundo. iOS necesita que el DOM 
    // esté 100% listo antes de pedir permiso de cámara.
    const timeoutId = setTimeout(startScanner, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        // 🚩 MEJORA: Limpieza segura para evitar el error "Scanner is already running"
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop()
            .then(() => {
              scannerRef.current.clear();
            })
            .catch(e => console.error("Error al detener:", e));
        }
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="relative w-full bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-[#87be00]/30">
      {/* 🚩 IMPORTANTE: El ID reader debe estar limpio */}
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