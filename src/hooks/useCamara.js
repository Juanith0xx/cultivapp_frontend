import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      // Configuramos para usar la cámara trasera (environment) y resolución HD
      const constraints = { 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error cámara:", err);
      setError("No se pudo acceder a la cámara. Revisa los permisos.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const takePhoto = useCallback((canvasRef) => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Sincronizamos tamaño de canvas con el video real
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Capturamos el frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Retornamos JPEG comprimido al 80% para ahorrar datos en el SaaS
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  return { videoRef, stream, error, startCamera, stopCamera, takePhoto };
};