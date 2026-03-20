import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import api from "../../api/apiClient";
import { FiNavigation, FiAlertCircle, FiUser, FiClock } from "react-icons/fi";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

const GpsMonitor = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveGps = async () => {
    try {
      const data = await api.get("/routes");
      
      // 🚩 SUPER DEBUG: Abre la consola (F12) y busca estos mensajes
      console.log("--- DEBUG RENDER DB ---");
      console.log("Total registros recibidos:", data.length);
      
      if (data.length > 0) {
        console.log("Primer registro completo:", data[0]);
        console.log("lat_in:", data[0].lat_in, "| lng_in:", data[0].lng_in);
        console.log("Status:", data[0].status);
      } else {
        console.warn("La API regresó un array vacío.");
      }

      // Filtro ultra-permisivo para ver si aparece algo
      const active = data.filter(r => {
        const lat = parseFloat(r.lat_in);
        const lng = parseFloat(r.lng_in);
        // Dejamos pasar cualquier cosa que tenga coordenadas válidas
        return !isNaN(lat) && !isNaN(lng) && lat !== 0;
      });

      console.log("Registros que pasaron el filtro:", active.length);
      setActiveRoutes(active);
    } catch (error) {
      console.error("Error API GPS:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-70.6483, -33.4569], 
      zoom: 11,
      trackResize: true
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.on('load', () => map.current.resize());

    fetchActiveGps();
    const interval = setInterval(fetchActiveGps, 20000); // Cada 20s para Render
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map.current) return;

    markers.current.forEach(m => m.remove());
    markers.current = [];

    if (activeRoutes.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    activeRoutes.forEach(route => {
      const lng = parseFloat(route.lng_in);
      const lat = parseFloat(route.lat_in);

      const el = document.createElement("div");
      el.style.width = "35px";
      el.style.height = "35px";
      el.style.backgroundColor = route.is_valid_gps ? "#87be00" : "#ef4444";
      el.style.borderRadius = "12px";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";
      el.style.zIndex = "100"; // Forzamos visibilidad
      
      el.innerHTML = `<span style="color:white; font-family:'Outfit'; font-size:11px; font-weight:900;">${route.first_name?.[0]}${route.last_name?.[0]}</span>`;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="font-family:'Outfit'; padding:5px;">
          <strong style="font-size:12px;">${route.first_name} ${route.last_name}</strong><br/>
          <span style="font-size:10px; color:#6b7280;">📍 ${route.cadena}</span>
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
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    }
  }, [activeRoutes]);

  return (
    <div className="p-6 h-[calc(100vh-100px)] flex flex-col font-[Outfit]">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <FiNavigation className="text-[#87be00]" /> Monitoreo GPS
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Render DB Live Status</p>
        </div>
        
        <div className="flex gap-4">
            {activeRoutes.length === 0 && !loading && (
                <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-amber-100">
                    <FiAlertCircle /> No hay coordenadas en la DB
                </div>
            )}
            <div className="bg-green-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-green-100">
                <div className={`w-2.5 h-2.5 rounded-full bg-[#87be00] ${activeRoutes.length > 0 ? 'animate-ping' : ''}`} />
                <span className="text-[10px] font-black text-[#87be00] uppercase tracking-wider">
                  {activeRoutes.length} Activos
                </span>
            </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] p-2 shadow-xl border border-gray-100 relative min-h-[450px]">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-[2rem]">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#87be00] rounded-full animate-spin"></div>
          </div>
        )}
        <div ref={mapContainer} className="w-full h-full rounded-[2rem] overflow-hidden" />
      </div>
    </div>
  );
};

export default GpsMonitor;