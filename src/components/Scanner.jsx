import React, { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat
} from "@zxing/library";
import { FiLoader, FiAlertTriangle, FiCamera } from "react-icons/fi";
import toast from "react-hot-toast";

const Scanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // Para la captura manual
  const codeReaderRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

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
            width: { ideal: 1920 }, // Subimos resolución para mejor foto
            height: { ideal: 1080 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          
          // Iniciamos la decodificación continua (Automática)
          codeReader.decodeFromVideoElement(videoRef.current, (result, err) => {
            if (!active) return;
            if (result) {
              handleSuccess(result.getText());
            }
          });
        }

        setLoading(false);
        setIsScanning(true);
      } catch (err) {
        console.error(err);
        setError("No se pudo acceder a la cámara");
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      active = false;
      if (codeReaderRef.current) codeReaderRef.current.reset();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleSuccess = (code) => {
    onScanSuccess(code);
    if (navigator.vibrate) navigator.vibrate(100);
  };

  // 📸 FUNCIÓN PARA DISPARO MANUAL (FOTOGRAFÍA)
  const captureManual = async () => {
    if (!videoRef.current || !codeReaderRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Ajustar canvas al tamaño del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Obtener la imagen como URL base64
    const imageDataV = canvas.toDataURL("image/jpeg");

    try {
      // Intentar decodificar la foto estática
      const result = await codeReaderRef.current.decodeFromImageUrl(imageDataV);
      if (result) {
        toast.success("Código detectado por captura");
        handleSuccess(result.getText());
      }
    } catch (err) {
      toast.error("No se detectó código en la foto. Intenta de nuevo.");
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl">
      
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Canvas oculto para procesar la foto */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay Visual */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8">
        <div className="relative w-64 h-44 border-2 border-white/10 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#87be00] rounded-tl-xl"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#87be00] rounded-tr-xl"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#87be00] rounded-bl-xl"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#87be00] rounded-br-xl"></div>
          
          <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-[#87be00] opacity-30 shadow-[0_0_15px_#87be00]"></div>
        </div>
      </div>

      {/* 🔘 BOTÓN DE DISPARO (CULTIVAPP STYLE) */}
      {!loading && !error && (
        <div className="absolute bottom-10 inset-x-0 flex flex-col items-center z-30 px-6 gap-4">
          <button
            onClick={captureManual}
            className="group flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 p-2 pr-6 rounded-full active:scale-95 transition-all"
          >
            <div className="bg-[#87be00] p-4 rounded-full shadow-[0_0_20px_rgba(135,190,0,0.4)] group-active:scale-90 transition-transform">
              <FiCamera className="text-black" size={24} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Capturar Manual</p>
              <p className="text-[8px] font-bold text-[#87be00] uppercase mt-1">Si el auto-scan falla</p>
            </div>
          </button>
        </div>
      )}

      {/* Loading & Error (Igual que antes) */}
      {loading && (
        <div className="absolute inset-0 bg-neutral-950 z-40 flex flex-col items-center justify-center gap-4">
          <FiLoader className="text-[#87be00] animate-spin" size={40} />
          <span className="text-[10px] text-white font-black uppercase tracking-widest leading-none">Iniciando Lente...</span>
        </div>
      )}
    </div>
  );
};

export default Scanner;