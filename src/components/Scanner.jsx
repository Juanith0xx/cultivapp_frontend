import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { FiLoader, FiAlertTriangle, FiCamera } from "react-icons/fi";
import toast from "react-hot-toast";

const Scanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const codeReaderRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    let active = true;

    const startScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 }, // Bajamos a 720p para mayor estabilidad en WebKit
            height: { ideal: 720 }
          }
        };

        // 🚩 Usamos decodeFromConstraints para que ZXing gestione el ciclo de vida
        await codeReader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, err) => {
            if (!active) return;
            if (result) {
              onScanSuccess(result.getText());
              if (navigator.vibrate) navigator.vibrate(100);
            }
            // Importante: No lanzamos errores aquí para que el loop no muera
          }
        );

        setLoading(false);
      } catch (err) {
        console.error("Error inicializando cámara:", err);
        setError("Error al abrir cámara. Revisa permisos.");
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      active = false;
      if (codeReaderRef.current) codeReaderRef.current.reset();
    };
  }, [onScanSuccess]);

  // 📸 CAPTURA MANUAL CON ESCUDO DE ERRORES (Previene el pantallazo negro)
  const captureManual = async () => {
    if (!videoRef.current || !codeReaderRef.current) return;

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      // 🚩 EL TRY/CATCH AQUÍ EVITA QUE LA APP SE VAYA A NEGRO
      try {
        const result = await codeReaderRef.current.decodeFromImageUrl(imageData);
        if (result) {
          onScanSuccess(result.getText());
          toast.success("¡Detectado!");
        }
      } catch (scanErr) {
        // ZXing lanza error si NO encuentra código en la foto, lo atrapamos:
        toast.error("Código no detectado. Enfoca mejor.", { id: 'scan-error' });
      }
    } catch (fatalErr) {
      console.error("Error fatal en captura:", fatalErr);
      toast.error("Error de hardware. Reiniciando...");
      window.location.reload(); // Último recurso si la cámara muere
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8">
        <div className="relative w-64 h-44 border-2 border-[#87be00]/40 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#87be00] rounded-tl-xl"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#87be00] rounded-tr-xl"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#87be00] rounded-bl-xl"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#87be00] rounded-br-xl"></div>
          <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-[#87be00] opacity-40 shadow-[0_0_15px_#87be00] animate-pulse"></div>
        </div>
      </div>

      {/* Botón de Disparo */}
      {!loading && !error && (
        <button
          onClick={captureManual}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-white/20 backdrop-blur-xl border border-white/30 p-4 rounded-full active:scale-90 transition-transform"
        >
          <FiCamera className="text-[#87be00]" size={28} />
        </button>
      )}

      {loading && (
        <div className="absolute inset-0 bg-neutral-900 z-40 flex flex-col items-center justify-center gap-4">
          <FiLoader className="text-[#87be00] animate-spin" size={40} />
          <span className="text-[10px] text-white font-black uppercase tracking-widest">Iniciando Scanner...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-neutral-950 z-40 flex flex-col items-center justify-center p-6 text-center">
          <FiAlertTriangle className="text-red-500 mb-4" size={40} />
          <p className="text-white text-xs font-bold uppercase">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Scanner;