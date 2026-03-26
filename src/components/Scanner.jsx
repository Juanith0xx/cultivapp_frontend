import { useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

const Scanner = ({ onScanSuccess, onScanError }) => {
  useEffect(() => {
    // 🚩 Configuración avanzada para asegurar compatibilidad total
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 25, // Mayor fluidez para códigos de barra EAN-13
      qrbox: { width: 280, height: 160 }, 
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true, // 💡 Permite activar flash en góndolas oscuras
      showZoomSliderIfSupported: true,  // 🔍 Permite hacer zoom si el producto está lejos
      
      // 🚩 RESTRECCIONES DE VIDEO PARA IPHONE
      videoConstraints: {
        facingMode: { exact: "environment" }, // Obliga a usar la cámara trasera principal
        focusMode: "continuous",
        advanced: [{ zoom: 1.0 }] // Intenta inicializar con zoom estándar
      },
      
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], // Solo cámara para evitar confusiones
    }, /* verbose= */ false);

    const successWrapper = (decodedText, result) => {
      // Feedback táctil al detectar
      if (navigator.vibrate) navigator.vibrate(80);
      onScanSuccess(decodedText, result);
    };

    // 🚩 Renderizado con manejo de errores de inicialización
    scanner.render(successWrapper, (err) => {
      // Error silencioso durante la búsqueda, solo notificamos errores críticos si los hay
      if (onScanError && typeof err === 'string' && err.includes('NotFound')) {
        onScanError(err);
      }
    });

    return () => {
      // Limpieza robusta
      scanner.clear().catch(error => {
        console.error("Error al limpiar el scanner:", error);
      });
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[2.5rem] border-2 border-[#87be00]/30 shadow-2xl bg-black">
      {/* 🚩 ESTILO CRÍTICO: minHeight evita que Safari colapse el visor a 0px */}
      <div 
        id="reader" 
        className="w-full bg-black min-h-[320px] md:min-h-[380px]"
        style={{ 
          // Forzamos que los elementos internos de la librería se vean bien
          "--qr-canvas-max-width": "100% !important",
        }}
      ></div>

      {/* 🟢 Guía visual (Overlay) */}
      <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20 flex items-center justify-center">
        <div className="w-[280px] h-[160px] border-2 border-[#87be00] rounded-2xl shadow-[0_0_20px_rgba(135,190,0,0.4)] relative">
            {/* Animación de línea de escaneo */}
            <div className="absolute left-0 right-0 h-0.5 bg-[#87be00] shadow-[0_0_10px_#87be00] animate-pulse top-1/2 -translate-y-1/2 opacity-50"></div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="bg-black/60 backdrop-blur-md text-[#87be00] text-[8px] font-black uppercase px-4 py-2 rounded-full tracking-[0.2em]">
          Buscando código de barras...
        </span>
      </div>
    </div>
  );
};

export default Scanner;