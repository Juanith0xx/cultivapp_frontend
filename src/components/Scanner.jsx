import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = ({ onScanSuccess, onScanError }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 150 }, // Optimizado para códigos de barras largos
      aspectRatio: 1.0
    });

    scanner.render(onScanSuccess, onScanError);

    return () => scanner.clear(); // Limpia la cámara al cerrar
  }, []);

  return <div id="reader" className="w-full overflow-hidden rounded-2xl"></div>;
};

export default Scanner;