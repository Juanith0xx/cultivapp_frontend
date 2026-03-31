import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { FiLoader, FiAlertTriangle, FiCamera } from "react-icons/fi";
import toast from "react-hot-toast";

const Scanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const isMounted = useRef(true);
  const isLocked = useRef(false); // 🚩 Evita múltiples escaneos del mismo objeto

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    isMounted.current = true;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128, BarcodeFormat.UPC_A
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;

    const startScanner = async () => {
      try {
        setLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (videoRef.current && isMounted.current) {
          videoRef.current.srcObject = stream;
          
          // 🚩 Usamos decodeFromVideoElement para mantener el control del flujo
          codeReader.decodeFromVideoElement(videoRef.current, (result, err) => {
            if (!isMounted.current || isLocked.current) return;

            if (result) {
              isLocked.current = true; // Bloqueamos nuevas lecturas un momento
              
              onScanSuccess(result.getText());
              if (navigator.vibrate) navigator.vibrate(80);

              // ⏱️ Liberamos el lock después de 2 segundos para permitir el siguiente producto
              setTimeout(() => {
                isLocked.current = false;
              }, 2000);
            }
          });
        }
        setLoading(false);
      } catch (err) {
        if (isMounted.current) {
          setError("Error al acceder a la cámara. Revisa los permisos.");
          setLoading(false);
        }
      }
    };

    setTimeout(startScanner, 500);

    return () => {
      isMounted.current = false;
      if (codeReaderRef.current) codeReaderRef.current.reset();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Función para disparo manual (sin romper el flujo)
  const captureManual = async () => {
    if (isLocked.current) return;
    isLocked.current = true;

    try {
      const result = await codeReaderRef.current.decodeFromVideoElement(videoRef.current);
      if (result) {
        onScanSuccess(result.getText());
        toast.success("Capturado");
      }
    } catch (e) {
      toast.error("No se detectó código");
    } finally {
      setTimeout(() => { isLocked.current = false; }, 2000);
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden">
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover scale-[1.1]" 
        playsInline 
        muted 
        autoPlay 
      />

      {/* Visor UI */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
        <div className="relative w-64 h-44 border-2 border-[#87be00]/30 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#87be00] rounded-tl-xl"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#87be00] rounded-tr-xl"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#87be00] rounded-bl-xl"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#87be00] rounded-br-xl"></div>
          <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-[#87be00] shadow-[0_0_15px_#87be00] animate-pulse"></div>
        </div>
      </div>

      {!loading && (
        <button
          onClick={captureManual}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-full active:scale-90 transition-all"
        >
          <FiCamera className="text-[#87be00]" size={28} />
        </button>
      )}

      {loading && (
        <div className="absolute inset-0 bg-neutral-900 z-40 flex items-center justify-center">
          <FiLoader className="text-[#87be00] animate-spin" size={40} />
        </div>
      )}
    </div>
  );
};

export default Scanner;