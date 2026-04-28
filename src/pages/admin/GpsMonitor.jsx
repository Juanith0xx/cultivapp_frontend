import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import api from "../../api/apiClient";
import { FiNavigation, FiAlertCircle, FiActivity } from "react-icons/fi";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

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

/**
 * 📏 Genera un GeoJSON de un círculo perfecto
 */
const createGeoJSONCircle = (center, radiusInKm, points = 64) => {
  const [lng, lat] = center;
  const coords = { latitude: lat, longitude: lng };
  const distanceX = radiusInKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusInKm / 110.574;

  const ret = [];
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ret] },
  };
};

const GpsMonitor = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveGps = async () => {
    try {
      const data = await api.get("/routes/monitoring/live");
      const active = data.filter((r) => !isNaN(parseFloat(r.lat_in)) && !isNaN(parseFloat(r.lng_in)));
      setActiveRoutes(active);
    } catch (error) {
      console.error("Error API GPS Monitoring:", error);
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
      zoom: 12,
      pitch: 45,
    });

    // Desactivamos el compass en móviles para ahorrar espacio
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.current.on("load", () => {
      fetchActiveGps();
    });

    const interval = setInterval(fetchActiveGps, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    activeRoutes.forEach((_, index) => {
      if (map.current.getLayer(`circle-fill-${index}`)) map.current.removeLayer(`circle-fill-${index}`);
      if (map.current.getLayer(`circle-outline-${index}`)) map.current.removeLayer(`circle-outline-${index}`);
      if (map.current.getSource(`circle-source-${index}`)) map.current.removeSource(`circle-source-${index}`);
    });

    if (activeRoutes.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    activeRoutes.forEach((route, index) => {
      const lng = parseFloat(route.lng_in);
      const lat = parseFloat(route.lat_in);
      const userColor = stringToColor(route.user_id || "default");

      const circleGeoJSON = createGeoJSONCircle([lng, lat], 0.3);

      map.current.addSource(`circle-source-${index}`, {
        type: "geojson",
        data: circleGeoJSON,
      });

      map.current.addLayer({
        id: `circle-fill-${index}`,
        type: "fill",
        source: `circle-source-${index}`,
        paint: {
          "fill-color": "#87be00",
          "fill-opacity": 0.25,
        },
      });

      map.current.addLayer({
        id: `circle-outline-${index}`,
        type: "line",
        source: `circle-source-${index}`,
        paint: {
          "line-color": "#87be00",
          "line-width": 2,
          "line-dasharray": [2, 1],
        },
      });

      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = window.innerWidth < 768 ? "36px" : "42px";
      el.style.height = window.innerWidth < 768 ? "36px" : "42px";
      el.style.backgroundColor = userColor;
      el.style.borderRadius = "10px";
      el.style.border = "3px solid white";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 8px 15px rgba(0,0,0,0.1)";
      el.innerHTML = `
        <span style="color: white; font-family: 'Outfit'; font-size: ${window.innerWidth < 768 ? '12px' : '14px'}; font-weight: 900;">
          ${route.first_name?.[0]}${route.last_name?.[0]}
        </span>
      `;

      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current);
      markers.current.push(marker);
      bounds.extend([lng, lat]);
    });

    if (activeRoutes.length > 0) {
      // 🚩 AJUSTE DINÁMICO DE PADDING: Evita errores de renderizado en pantallas pequeñas
      const paddingValue = window.innerWidth < 768 ? 40 : 100;
      map.current.fitBounds(bounds, { padding: paddingValue, maxZoom: 15, duration: 1500 });
    }
  }, [activeRoutes]);

  return (
    // 🚩 h-full para adaptarse al Dashboard contenedor y px reducidos
    <div className="h-full flex flex-col font-[Outfit] p-2 md:p-6 min-h-[500px]">
      
      {/* HEADER RESPONSIVO (Pasa de fila a columna en móviles pequeños) */}
      <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 md:gap-5 w-full sm:w-auto">
          <div className="bg-black p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl shrink-0">
            <FiNavigation className="text-[#87be00]" size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none truncate">Monitoreo Live</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 md:mt-1.5 flex items-center gap-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-[#87be00]"></span>
                <span className="truncate">Radio 300m</span>
            </p>
          </div>
        </div>
        
        {/* Badge de actividad escalado */}
        <div className="px-4 md:px-6 py-2 md:py-3 bg-green-50 rounded-xl md:rounded-2xl border border-green-100 flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-center">
            <FiActivity className="text-[#87be00] shrink-0" />
            <span className="text-[10px] md:text-xs font-black uppercase text-[#87be00]">
              {activeRoutes.length} <span className="xs:inline">En Sala</span>
            </span>
        </div>
      </div>

      {/* MAP CONTAINER RESPONSIVO */}
      <div className="flex-1 bg-white rounded-[1.5rem] md:rounded-[3.5rem] p-1 md:p-2 shadow-2xl border border-gray-50 relative overflow-hidden">
        {loading && (
           <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-md">
             <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-gray-100 border-t-[#87be00] rounded-full animate-spin"></div>
           </div>
        )}
        <div ref={mapContainer} className="w-full h-full rounded-[1.2rem] md:rounded-[3rem]" />
      </div>
    </div>
  );
};

export default GpsMonitor;