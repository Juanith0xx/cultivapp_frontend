import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

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

        const el = document.createElement("div")
        el.className = "marker"

        // Estilo dinámico según selección
        el.style.width = selectedLocal?.id === local.id ? "18px" : "12px"
        el.style.height = selectedLocal?.id === local.id ? "18px" : "12px"
        el.style.borderRadius = "50%"
        el.style.background = selectedLocal?.id === local.id ? "#ef4444" : "#87be00"
        el.style.border = "2px solid white"
        el.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)"
        el.style.cursor = "pointer"

        const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(`
          <div style="font-family: sans-serif; color:#111827;">
            <strong style="font-size:14px">${local.cadena}</strong><br/>
            <span style="font-size:12px;color:#6b7280">${local.direccion}</span><br/>
            <span style="font-size:12px;color:#6b7280">${local.comuna}</span>
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

    const marker = markers.current.find(m => {
      const pos = m.getLngLat()
      return pos.lat === lat && pos.lng === lng
    })

    if (marker) {
      marker.togglePopup()
    }
  }, [selectedLocal])

  return (
    <div
      ref={mapContainer}
      className="w-full h-[450px] rounded-xl shadow-inner border border-gray-100 overflow-hidden"
    />
  )
}

export default LocalesMap