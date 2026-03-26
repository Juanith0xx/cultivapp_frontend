import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = ({ onScanSuccess, onScanError }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 20, // 🚩 Subimos los FPS para capturar códigos de barra en movimiento
      qrbox: { width: 280, height: 160 }, 
      aspectRatio: 1.0,
      // 🚩 VITAL PARA IPHONE:
      videoConstraints: {
        facingMode: { exact: "environment" }, // Fuerza cámara trasera
        focusMode: "continuous",             // Intenta autoenfoque
      },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0] // 0 significa que prioriza cámaras (Camera scan)
    });

    // Función envoltorio para éxito
    const successWrapper = (decodedText, result) => {
      // Vibración de feedback (opcional)
      if (navigator.vibrate) navigator.vibrate(100);
      onScanSuccess(decodedText, result);
    };

    scanner.render(successWrapper, onScanError);

    return () => {
      // Limpieza segura para evitar que la cámara quede "encendida" en segundo plano
      scanner.clear().catch(error => {
        console.error("Error al limpiar el scanner:", error);
      });
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-3xl border-2 border-[#87be00]/20 shadow-inner bg-black">
      <div id="reader" className="w-full"></div>
      {/* Guía visual opcional */}
      <div className="absolute inset-0 pointer-events-none border-[30px] border-black/40 flex items-center justify-center">
        <div className="w-[280px] h-[160px] border-2 border-[#87be00] rounded-lg shadow-[0_0_15px_rgba(135,190,0,0.5)]"></div>
      </div>
    </div>
  );
};

export default Scanner;