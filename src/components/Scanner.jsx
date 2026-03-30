import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { FiLoader, FiAlertTriangle } from "react-icons/fi";

const Scanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Configuración de Formatos (Solo Retail para velocidad extrema)
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

    const startScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!navigator.mediaDevices) {
          throw new Error("Cámara no detectada. Verifica que usas HTTPS.");
        }

        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            focusMode: "continuous"
          }
        };

        // 2. Iniciar decodificación directa
        await codeReader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result) => {
            if (result) {
              onScanSuccess(result.getText());
              // Vibración corta de éxito (háptica)
              if (navigator.vibrate) navigator.vibrate(80);
            }
          }
        );

        setLoading(false);
      } catch (err) {
        console.error("Scanner Error:", err);
        setError(err.name === 'NotAllowedError' ? "Permiso denegado." : err.message);
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(startScanner, 600);

    return () => {
      clearTimeout(timeoutId);
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="relative w-full aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden">
      
      {/* VIDEO NATIVO */}
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

      {/* OVERLAY TÉCNICO (Pointer events none para no bloquear el lente) */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8">
        
        {/* VISOR DE ENFOQUE */}
        <div className="relative w-64 h-44 border-2 border-white/20 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          {/* Esquinas de Marca */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#87be00] rounded-tl-xl"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#87be00] rounded-tr-xl"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#87be00] rounded-bl-xl"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#87be00] rounded-br-xl"></div>

          {/* Línea Láser Parpadeante */}
          <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-[#87be00] shadow-[0_0_15px_#87be00] animate-pulse"></div>
        </div>

        <div className="mt-10 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
          <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Escáner Cultivapp</p>
        </div>
      </div>

      {/* CARGANDO / ERROR */}
      {loading && !error && (
        <div className="absolute inset-0 bg-neutral-900 z-20 flex flex-col items-center justify-center gap-4">
          <FiLoader className="text-[#87be00] animate-spin" size={40} />
          <span className="text-[10px] text-white font-black uppercase tracking-widest">Iniciando Lente...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-neutral-950 z-30 flex flex-col items-center justify-center p-6 text-center gap-4">
          <FiAlertTriangle className="text-orange-500" size={40} />
          <p className="text-white text-[11px] font-bold leading-relaxed uppercase">{error}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[#87be00] text-black text-[10px] font-black rounded-full uppercase">Reintentar</button>
        </div>
      )}
    </div>
  );
};

export default Scanner;