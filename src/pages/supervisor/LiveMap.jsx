import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import api from "../../api/apiClient";
import { FiMap, FiActivity, FiFilter } from "react-icons/fi";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

const LiveMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSupervisorGps = async () => {
    try {
      // Endpoint que trae rutas activas con estados de semáforo
      const data = await api.get("/routes/monitoring/live");
      setActiveRoutes(data);
    } catch (error) {
      console.error("Error GPS Supervisor:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11", // Estilo más limpio para gestión
      center: [-70.6483, -33.4569],
      zoom: 12,
      pitch: 45,
    });
    map.current.on("load", fetchSupervisorGps);
    const interval = setInterval(fetchSupervisorGps, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map.current || activeRoutes.length === 0) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    activeRoutes.forEach((route) => {
      if (!route.lat_in || !route.lng_in) return;

      // Color según estado de semáforo (Requerimiento 1)
      let statusColor = "#9ca3af"; // Negro/Gris por defecto
      if (route.status === 'atendido') statusColor = "#87be00"; // Verde
      if (route.status === 'atendiendo') statusColor = "#fbbf24"; // Amarillo
      if (route.status === 'no_atendido') statusColor = "#ef4444"; // Rojo

      const el = document.createElement("div");
      el.className = "supervisor-marker";
      el.style.cssText = `
        width: 40px; height: 40px;
        background-color: ${statusColor};
        border-radius: 12px; border: 3px solid white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 900; font-family: 'Outfit';
      `;
      el.innerHTML = `${route.first_name?.[0]}${route.last_name?.[0]}`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([parseFloat(route.lng_in), parseFloat(route.lat_in)])
        .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="font-family: 'Outfit'; p: 2px;">
                <p style="font-weight: 900; font-size: 10px; margin: 0;">${route.first_name} ${route.last_name}</p>
                <p style="font-size: 9px; color: #666; margin: 0;">Local: ${route.local_name || 'En Ruta'}</p>
            </div>
        `))
        .addTo(map.current);
      markers.current.push(marker);
    });
  }, [activeRoutes]);

  return (
    <div className="h-full flex flex-col font-[Outfit]">
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-gray-900 p-3 rounded-2xl shadow-lg">
            <FiMap className="text-[#87be00]" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase italic leading-none">Mapa en Vivo</h2>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ubicación y Estado del Equipo</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:bg-gray-100 transition-all">
          <FiFilter /> Filtros
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] p-2 shadow-sm border border-gray-50 relative overflow-hidden">
        <div ref={mapContainer} className="w-full h-full rounded-[2rem]" />
      </div>
    </div>
  );
};

export default LiveMap;