import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

// 🎨 Diccionario de colores corporativos según tu definición
const BRAND_COLORS = {
  'UNIMARC': '#FF0000',      // Rojo vibrante
  'UNI': '#FF0000',          // Alias
  'ALVI': '#0047AB',         // Azul Rey
  'LIDER': '#000080',        // Azul Marino
  'LIDER EXPRESS': '#000080',
  'TOTTUS': '#CCFF00',       // Verde Limón
  'JUMBO': '#00563F',        // Verde Bosque
  'DEFAULT': '#87be00'       // Verde Cultiva
};

const LocalesMap = ({ locales = [], selectedLocal }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])

  /* =============================
      INICIALIZAR MAPA
  ============================= */
  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-70.6693, -33.4489],
      zoom: 6,
      trackResize: true,
      collectResourceTiming: false
    })

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    map.current.on("load", () => {
      setTimeout(() => {
        map.current?.resize()
      }, 150)
    })

    return () => {
      markers.current.forEach(marker => marker.remove())
      markers.current = []

      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  /* =============================
      CREAR MARCADORES
  ============================= */
  useEffect(() => {
    if (!map.current) return

    const updateMarkers = () => {
      markers.current.forEach(marker => marker.remove())
      markers.current = []

      if (!locales.length) return

      const bounds = new mapboxgl.LngLatBounds()

      locales.forEach(local => {
        const lat = Number(local.lat)
        const lng = Number(local.lng)

        if (isNaN(lat) || isNaN(lng)) return

        // 1. Lógica de Color por Cadena
        const cadenaName = local.cadena?.toUpperCase().trim() || "";
        const brandColor = BRAND_COLORS[cadenaName] || BRAND_COLORS.DEFAULT;
        const isSelected = selectedLocal?.id === local.id;

        const el = document.createElement("div")
        el.className = "marker"

        // Estilo dinámico según selección y cadena
        el.style.width = isSelected ? "20px" : "12px"
        el.style.height = isSelected ? "20px" : "12px"
        el.style.borderRadius = "50%"
        
        // Si está seleccionado: fondo blanco, si no: color de la marca
        el.style.background = isSelected ? "#FFFFFF" : brandColor
        el.style.border = isSelected ? `4px solid ${brandColor}` : "2px solid white"
        
        el.style.boxShadow = isSelected 
            ? `0 0 12px ${brandColor}` 
            : "0 0 6px rgba(0,0,0,0.3)"
        el.style.cursor = "pointer"
        el.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family: 'Outfit', sans-serif; padding: 4px;">
            <strong style="font-size:13px; color: ${brandColor}">${local.cadena}</strong><br/>
            <span style="font-size:11px; font-weight:800; display:block; margin-top:2px; color: #1f2937;">${local.direccion}</span>
            <span style="font-size:10px; color:#6b7280; text-transform: uppercase;">${local.comuna || ''}</span>
          </div>
        `)

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current)

        markers.current.push(marker)
        bounds.extend([lng, lat])
      })

      if (markers.current.length && !selectedLocal) {
        map.current.fitBounds(bounds, {
          padding: 80,
          maxZoom: 14,
          duration: 1200
        })
      }
    }

    if (map.current.isStyleLoaded()) {
      updateMarkers()
    } else {
      map.current.once("style.load", updateMarkers)
    }
  }, [locales, selectedLocal])

  /* =============================
      CENTRAR EN LOCAL
  ============================= */
  useEffect(() => {
    if (!map.current || !selectedLocal) return

    const lat = Number(selectedLocal.lat)
    const lng = Number(selectedLocal.lng)

    if (isNaN(lat) || isNaN(lng)) return

    map.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      speed: 1.5,
      essential: true
    })

    // Buscamos el marcador para abrir su popup
    const marker = markers.current.find(m => {
      const pos = m.getLngLat()
      // Pequeño margen de error para comparaciones de float
      return Math.abs(pos.lat - lat) < 0.0001 && Math.abs(pos.lng - lng) < 0.0001;
    })

    if (marker) {
      if (!marker.getPopup().isOpen()) marker.togglePopup()
    }
  }, [selectedLocal])

  return (
    <div className="relative w-full h-[450px] rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden group">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* 🎨 LEYENDA FLOTANTE 
      <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl transition-opacity duration-300 pointer-events-none group-hover:opacity-100">
        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 italic">Leyenda Cadenas</h4>
        <div className="space-y-2">
            {Object.entries(BRAND_COLORS).map(([name, color]) => (
                name !== 'DEFAULT' && name !== 'LIDER EXPRESS' && name !== 'UNI' && (
                    <div key={name} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: color }}></div>
                        <span className="text-[9px] font-black text-white/90 uppercase italic">{name}</span>
                    </div>
                )
            ))}
            <div className="flex items-center gap-3 pt-1 border-t border-white/5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS.DEFAULT }}></div>
                <span className="text-[9px] font-black text-white/40 uppercase italic">Otros</span>
            </div>
        </div>
      </div>*/}
    </div>
  )
}

export default LocalesMap