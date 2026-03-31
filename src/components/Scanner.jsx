import React, { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat
} from "@zxing/library";
import { FiLoader, FiAlertTriangle } from "react-icons/fi";

const Scanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
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
            facingMode: "environment", // 🔥 cámara trasera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        await codeReader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, err) => {
            if (!active) return;

            if (result) {
              const code = result.getText();
              console.log("✅ Código detectado:", code);

              onScanSuccess(code);

              if (navigator.vibrate) {
                navigator.vibrate(100);
              }
            }

            // Ignorar errores normales de escaneo
            if (err && err.name !== "NotFoundException") {
              console.error("Error escaneo:", err);
            }
          }
        );

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("No se pudo acceder a la cámara");
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      active = false;

      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="relative w-full aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden">
      
      {/* 🎥 VIDEO SIN ZOOM (CLAVE PARA DETECCIÓN) */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* 🎯 OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8">
        <div className="relative w-64 h-44 border-2 border-white/20 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          
          {/* Esquinas */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#87be00] rounded-tl-xl"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#87be00] rounded-tr-xl"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#87be00] rounded-bl-xl"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#87be00] rounded-br-xl"></div>

          {/* Línea de escaneo */}
          <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-[#87be00] shadow-[0_0_15px_#87be00] animate-pulse"></div>
        </div>

        <div className="mt-10 bg-[#87be00] px-6 py-2 rounded-full shadow-lg">
          <p className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
            Escáner Cultivapp
          </p>
        </div>
      </div>

      {/* ⏳ LOADING */}
      {loading && !error && (
        <div className="absolute inset-0 bg-neutral-900 z-20 flex flex-col items-center justify-center gap-4">
          <FiLoader className="text-[#87be00] animate-spin" size={40} />
          <span className="text-[10px] text-white font-black uppercase tracking-widest">
            Activando cámara...
          </span>
        </div>
      )}

      {/* ❌ ERROR */}
      {error && (
        <div className="absolute inset-0 bg-neutral-900 z-20 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <FiAlertTriangle className="text-red-500" size={40} />
          <span className="text-white text-sm font-bold">
            {error}
          </span>
          <span className="text-xs text-gray-400">
            Verifica permisos de cámara y que estés en HTTPS
          </span>
        </div>
      )}
    </div>
  );
};

export default Scanner;