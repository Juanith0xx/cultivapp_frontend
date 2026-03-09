import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const LocalesMap = ({ locales = [], selectedLocal }) => {

  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])

  useEffect(() => {

    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-70.6693, -33.4489],
      zoom: 10
    })

  }, [])

  useEffect(() => {

    if (!map.current) return

    markers.current.forEach(marker => marker.remove())
    markers.current = []

    locales.forEach(local => {

      if (!local.lat || !local.lng) return

      const marker = new mapboxgl.Marker()
        .setLngLat([local.lng, local.lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <strong>${local.cadena}</strong><br/>
            ${local.direccion}<br/>
            ${local.comuna}
          `)
        )
        .addTo(map.current)

      markers.current.push(marker)

    })

  }, [locales])

  /* ZOOM AL LOCAL SELECCIONADO */

  useEffect(() => {

    if (!map.current || !selectedLocal) return

    if (!selectedLocal.lat || !selectedLocal.lng) return

    map.current.flyTo({
      center: [selectedLocal.lng, selectedLocal.lat],
      zoom: 17,
      speed: 1.2
    })

  }, [selectedLocal])

  return (
    <div
      ref={mapContainer}
      className="w-full h-[450px] rounded-xl overflow-hidden"
    />
  )
}

export default LocalesMap