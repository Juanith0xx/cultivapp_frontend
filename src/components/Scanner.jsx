import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { FiLoader, FiAlertTriangle, FiCamera } from "react-icons/fi";
import toast from "react-hot-toast";

const Scanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const codeReaderRef = useRef(null);
  const isMounted = useRef(true); // Evita errores de memoria al desmontar

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    isMounted.current = true;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.UPC_A
    ]);
    // 🚩 CLAVE 1: TRY_HARDER analiza más a fondo los píxeles (vital para móviles)
    hints.set(DecodeHintType.TRY_HARDER, true);

    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;

    const startScanner = async () => {
      try {
        if (!isMounted.current) return;
        setLoading(true);
        setError(null);

        // 🚩 CLAVE 2: Configuración de hardware móvil
        const constraints = {
          video: {
            facingMode: { ideal: "environment" }, // Forzar cámara trasera
            width: { ideal: 1280 },
            height: { ideal: 720 },
            // Intentar activar enfoque continuo en Android
            focusMode: "continuous"
          },
          audio: false
        };

        // Iniciamos el stream manualmente para controlar los tracks
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current && isMounted.current) {
          videoRef.current.srcObject = stream;
          
          // 🚩 CLAVE 3: playsInline y muted son obligatorios en iOS
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("muted", "true");

          // Decodificación desde el elemento de video
          codeReader.decodeFromVideoElement(videoRef.current, (result, err) => {
            if (!isMounted.current) return;
            if (result) {
              onScanSuccess(result.getText());
              if (navigator.vibrate) navigator.vibrate(80);
            }
          }).catch(e => {
            // Silenciamos errores de "Stream ended" durante reloads de Vite
            if (isMounted.current) console.log("Lector pausado de forma segura");
          });
        }

        if (isMounted.current) setLoading(false);
      } catch (err) {
        if (isMounted.current) {
          console.error("Error cámara:", err);
          setError("No se pudo iniciar la cámara. Verifica los permisos HTTPS.");
          setLoading(false);
        }
      }
    };

    // Delay de medio segundo para que iOS inicialice el driver de video
    const timeoutId = setTimeout(startScanner, 500);

    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScanSuccess]);

  const captureManual = async () => {
    if (!videoRef.current || !codeReaderRef.current) return;
    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg", 0.9);

      try {
        const result = await codeReaderRef.current.decodeFromImageUrl(imageData);
        if (result) {
          onScanSuccess(result.getText());
          toast.success("Detectado por captura");
        }
      } catch (scanErr) {
        toast.error("Asegúrate de que el código esté bien iluminado", { id: 'scan-err' });
      }
    } catch (fatalErr) {
      console.error("Error disparo manual:", fatalErr);
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl">
      {/* 🚩 ZOOM CSS: Ayuda al usuario a no tener que "pegar" el teléfono al producto */}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover scale-[1.15]" 
        playsInline 
        muted 
        autoPlay 
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Visor UI */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8">
        <div className="relative w-64 h-44 border-2 border-[#87be00]/30 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#87be00] rounded-tl-xl"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#87be00] rounded-tr-xl"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#87be00] rounded-bl-xl"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#87be00] rounded-br-xl"></div>
          <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-[#87be00] opacity-40 shadow-[0_0_15px_#87be00] animate-pulse"></div>
        </div>
      </div>

      {!loading && !error && (
        <button
          onClick={captureManual}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-white/10 backdrop-blur-xl border border-white/30 p-4 rounded-full active:scale-90 transition-transform shadow-2xl"
        >
          <FiCamera className="text-[#87be00]" size={28} />
        </button>
      )}

      {loading && (
        <div className="absolute inset-0 bg-neutral-900 z-40 flex flex-col items-center justify-center gap-4">
          <FiLoader className="text-[#87be00] animate-spin" size={40} />
          <span className="text-[10px] text-white font-black uppercase tracking-widest leading-none">Iniciando Lente...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-neutral-950 z-40 flex flex-col items-center justify-center p-6 text-center">
          <FiAlertTriangle className="text-red-500 mb-4" size={40} />
          <p className="text-white text-[10px] font-black uppercase leading-relaxed">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Scanner;