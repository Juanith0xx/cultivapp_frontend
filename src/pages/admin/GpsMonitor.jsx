import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import api from "../../api/apiClient";
import { FiNavigation, FiActivity } from "react-icons/fi";

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

    const isMobile = window.innerWidth < 768;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-70.6483, -33.4569],
      zoom: 12,
      pitch: isMobile ? 0 : 45, // Inclinación solo en desktop para mejor look
    });

    // Control de navegación dinámico
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: !isMobile }), 
      "top-right"
    );

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
    const isMobile = window.innerWidth < 768;

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
        paint: { "fill-color": "#87be00", "fill-opacity": 0.25 },
      });

      map.current.addLayer({
        id: `circle-outline-${index}`,
        type: "line",
        source: `circle-source-${index}`,
        paint: { "line-color": "#87be00", "line-width": 2, "line-dasharray": [2, 1] },
      });

      const el = document.createElement("div");
      el.className = "custom-marker";
      // Tamaño dinámico de marcador
      const markerSize = isMobile ? "36px" : "42px";
      el.style.width = markerSize;
      el.style.height = markerSize;
      el.style.backgroundColor = userColor;
      el.style.borderRadius = isMobile ? "10px" : "12px";
      el.style.border = "3px solid white";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 8px 15px rgba(0,0,0,0.15)";
      el.innerHTML = `
        <span style="color: white; font-family: 'Outfit'; font-size: ${isMobile ? '12px' : '14px'}; font-weight: 900;">
          ${route.first_name?.[0]}${route.last_name?.[0]}
        </span>
      `;

      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current);
      markers.current.push(marker);
      bounds.extend([lng, lat]);
    });

    if (activeRoutes.length > 0) {
      // FitBounds dinámico para no asfixiar el mapa en móviles
      map.current.fitBounds(bounds, { 
        padding: isMobile ? 40 : 100, 
        maxZoom: 15, 
        duration: 1500 
      });
    }
  }, [activeRoutes]);

  return (
    <div className="p-2 md:p-6 h-[calc(100vh-70px)] md:h-[calc(100vh-80px)] flex flex-col font-[Outfit] w-full">
      
      {/* HEADER ADAPTABLE */}
      <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="bg-black p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl shrink-0">
            <FiNavigation className="text-[#87be00] text-lg md:text-2xl" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none">Monitoreo Live</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 md:mt-1.5 flex items-center gap-2">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-[#87be00]"></span>
                Seguimiento Georeferencial (300m)
            </p>
          </div>
        </div>
        
        <div className="px-4 md:px-6 py-2 md:py-3 bg-green-50 rounded-xl md:rounded-2xl border border-green-100 flex items-center gap-2 md:gap-3 self-end sm:self-auto">
            <FiActivity className="text-[#87be00]" />
            <span className="text-[10px] md:text-xs font-black uppercase text-[#87be00]">{activeRoutes.length} En Sala</span>
        </div>
      </div>

      {/* MAPA */}
      <div className="flex-1 bg-white rounded-[2rem] md:rounded-[3.5rem] p-1 md:p-2 shadow-2xl border border-gray-50 relative overflow-hidden">
        {loading && (
           <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-md">
             <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-gray-100 border-t-[#87be00] rounded-full animate-spin"></div>
           </div>
        )}
        <div ref={mapContainer} className="w-full h-full rounded-[1.8rem] md:rounded-[3rem]" />
      </div>
    </div>
  );
};

export default GpsMonitor;