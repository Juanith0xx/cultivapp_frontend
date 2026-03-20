import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const TaskValidationMap = ({ routeData }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  useEffect(() => {
    if (map.current || !routeData) return;

    const localCoords = [Number(routeData.local_lng), Number(routeData.local_lat)];
    const userCoords = [Number(routeData.lng_in), Number(routeData.lat_in)];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: userCoords[0] ? userCoords : localCoords, // Centrar en el usuario si existe
      zoom: 15,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      // 1. Dibujar línea entre el local y el reponedor si ambos existen
      if (userCoords[0] && localCoords[0]) {
        map.current.addSource("route-line", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [localCoords, userCoords],
            },
          },
        });

        map.current.addLayer({
          id: "route-line-layer",
          type: "line",
          source: "route-line",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": routeData.is_valid_gps ? "#87be00" : "#ef4444",
            "line-width": 4,
            "line-dasharray": [2, 1], // Línea punteada
          },
        });

        // Ajustar vista para que se vean ambos puntos
        const bounds = new mapboxgl.LngLatBounds().extend(localCoords).extend(userCoords);
        map.current.fitBounds(bounds, { padding: 50 });
      }
    });

    // 2. Crear Marcadores Personalizados
    const addMarker = (coords, color, label) => {
      if (!coords[0]) return;
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.background = color;
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
      
      new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${label}</strong>`))
        .addTo(map.current);
    };

    addMarker(localCoords, "#3b82f6", "Punto del Local"); // Azul
    if (userCoords[0]) addMarker(userCoords, "#87be00", "Check-in Reponedor"); // Verde

    return () => map.current?.remove();
  }, [routeData]);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Overlay de información rápida */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-gray-100 shadow-sm text-[10px] font-black uppercase">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${routeData?.is_valid_gps ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Distancia: {routeData?.distance_meters}m</span>
        </div>
        <div className="text-gray-400 mt-1">
          {routeData?.is_valid_gps ? "Dentro del rango ✅" : "Fuera de rango ❌"}
        </div>
      </div>
    </div>
  );
};

export default TaskValidationMap;