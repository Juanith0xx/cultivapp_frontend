import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
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

    const startScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Configuración de Video con Alta Resolución
        // Pedimos 1080p si es posible para tener más detalle en las barras
        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 }, 
            height: { ideal: 1080 },
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // 2. APLICAR ZOOM DIGITAL (Si el hardware lo permite)
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities?.();
          
          // Si el dispositivo permite zoom, aplicamos un 2x o 3x inicial
          if (capabilities && capabilities.zoom) {
            try {
              await track.applyConstraints({
                advanced: [
                  { zoom: capabilities.zoom.min + 1.5 }, // Aumentamos el zoom base
                  { focusMode: "continuous" }
                ]
              });
              console.log("✅ Zoom aplicado exitosamente");
            } catch (e) {
              console.warn("No se pudo aplicar zoom por hardware", e);
            }
          }
        }

        // 3. Iniciar decodificación
        await codeReader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) {
            onScanSuccess(result.getText());
            if (navigator.vibrate) navigator.vibrate(80);
          }
        });

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(startScanner, 600);

    return () => {
      clearTimeout(timeoutId);
      if (codeReaderRef.current) codeReaderRef.current.reset();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="relative w-full aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden">
      
      {/* 🚩 TRUCO CSS: Si el hardware no soporta zoom, usamos zoom por CSS (Scale)
          Esto agranda el centro de la imagen para que el usuario no tenga que acercarse tanto. */}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover scale-[1.25]" 
        playsInline 
        muted 
        autoPlay
      />

      {/* Overlay Visual */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8">
        <div className="relative w-64 h-44 border-2 border-white/20 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#87be00] rounded-tl-xl"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#87be00] rounded-tr-xl"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#87be00] rounded-bl-xl"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#87be00] rounded-br-xl"></div>
          <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-[#87be00] shadow-[0_0_15px_#87be00] animate-pulse"></div>
        </div>
        <div className="mt-10 bg-[#87be00] px-6 py-2 rounded-full shadow-lg">
          <p className="text-black text-[10px] font-black uppercase tracking-[0.2em]">Escáner Cultivapp</p>
        </div>
      </div>

      {loading && !error && (
        <div className="absolute inset-0 bg-neutral-900 z-20 flex flex-col items-center justify-center gap-4">
          <FiLoader className="text-[#87be00] animate-spin" size={40} />
          <span className="text-[10px] text-white font-black uppercase tracking-widest">Ajustando Foco...</span>
        </div>
      )}
    </div>
  );
};

export default Scanner;