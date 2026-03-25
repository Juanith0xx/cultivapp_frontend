import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import api from "../../api/apiClient";
import { FiNavigation, FiAlertCircle, FiActivity, FiClock } from "react-icons/fi";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

/**
 * 🎨 Genera un color único y estable basado en un String (User ID)
 */
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
};

const GpsMonitor = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar datos del monitoreo
  const fetchActiveGps = async () => {
    try {
      // Petición al endpoint que configuramos en el backend
      const data = await api.get("/routes/monitoring/live");
      
      const active = data.filter(r => {
        const lat = parseFloat(r.lat_in);
        const lng = parseFloat(r.lng_in);
        return !isNaN(lat) && !isNaN(lng);
      });

      setActiveRoutes(active);
    } catch (error) {
      console.error("Error API GPS Monitoring:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Inicializar Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-70.6483, -33.4569], 
      zoom: 12,
      pitch: 45
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    
    fetchActiveGps();
    const interval = setInterval(fetchActiveGps, 15000); 
    return () => clearInterval(interval);
  }, []);

  // 3. Dibujar Marcadores CUADRADOS con Colores Únicos
  useEffect(() => {
    if (!map.current) return;

    // Limpiar marcadores existentes
    markers.current.forEach(m => m.remove());
    markers.current = [];

    if (activeRoutes.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    activeRoutes.forEach(route => {
      const lng = parseFloat(route.lng_in);
      const lat = parseFloat(route.lat_in);
      
      // 🌈 Generamos el color específico para este usuario
      const userColor = stringToColor(route.user_id || "default");

      // Crear el elemento HTML cuadrado
      const el = document.createElement("div");
      el.style.width = "42px";
      el.style.height = "42px";
      el.style.backgroundColor = userColor; 
      el.style.borderRadius = "12px";
      el.style.border = "3px solid white";
      el.style.boxShadow = `0 8px 20px ${userColor}66`; // Sombra del mismo color
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";
      el.style.position = "relative";
      
      // Contenido: Pulso animado + Iniciales
      el.innerHTML = `
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 12px; background: ${userColor}; opacity: 0.5; animation: pulse-square 2s infinite;"></div>
        <span style="position: relative; color: white; font-family: 'Outfit'; font-size: 14px; font-weight: 900; letter-spacing: -0.5px;">
          ${route.first_name?.[0]}${route.last_name?.[0]}
        </span>
      `;

      // Inyectar animación CSS de pulso
      if (!document.getElementById('pulse-style-live')) {
        const style = document.createElement('style');
        style.id = 'pulse-style-live';
        style.innerHTML = `
          @keyframes pulse-square {
            0% { transform: scale(1); opacity: 0.5; }
            70% { transform: scale(1.4); opacity: 0; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      // Configuración del Popup
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="font-family:'Outfit'; padding:10px; min-width:160px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <div style="width:10px; height:10px; background:${userColor}; border-radius:3px;"></div>
            <strong style="text-transform:uppercase; font-size:13px; color:#1f2937;">${route.first_name} ${route.last_name}</strong>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <p style="margin:0; font-size:10px; color:#6b7280;">
              <span style="font-weight:900; color:#374151;">📍 SALA:</span> ${route.local_nombre}
            </p>
            <p style="margin:0; font-size:10px; color:#6b7280;">
              <span style="font-weight:900; color:#374151;">🕒 INICIO:</span> ${new Date(route.active_since).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
      bounds.extend([lng, lat]);
    });

    if (activeRoutes.length > 0) {
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 15, duration: 1500 });
    }
  }, [activeRoutes]);

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col font-[Outfit]">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="bg-black p-4 rounded-2xl shadow-xl">
            <FiNavigation className="text-[#87be00]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none">Monitoreo Live</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#87be00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#87be00]"></span>
              </span>
              Seguimiento Georeferencial
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
            <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 border transition-all duration-500 ${activeRoutes.length > 0 ? 'bg-green-50 border-green-100 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                <FiActivity className={activeRoutes.length > 0 ? 'text-[#87be00] animate-pulse' : 'text-gray-300'} />
                <span className={`text-xs font-black uppercase tracking-wider ${activeRoutes.length > 0 ? 'text-[#87be00]' : 'text-gray-400'}`}>
                  {activeRoutes.length} Reponedores en Sala
                </span>
            </div>
        </div>
      </div>

      {/* MAPA */}
      <div className="flex-1 bg-white rounded-[3.5rem] p-2 shadow-2xl border border-gray-50 relative overflow-hidden">
        {activeRoutes.length === 0 && !loading && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-white/95 backdrop-blur-md px-8 py-4 rounded-3xl shadow-2xl border border-amber-100 flex items-center gap-4">
              <FiAlertCircle className="text-amber-500" size={20} />
              <span className="text-xs font-black uppercase text-amber-700 tracking-widest">No hay personal activo en este momento</span>
            </div>
          </div>
        )}
        
        {loading && (
           <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-md">
             <div className="w-10 h-10 border-4 border-gray-100 border-t-[#87be00] rounded-full animate-spin"></div>
           </div>
        )}

        <div ref={mapContainer} className="w-full h-full rounded-[3rem]" />
      </div>
    </div>
  );
};

export default GpsMonitor;