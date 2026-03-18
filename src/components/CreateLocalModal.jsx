import { useState, useEffect } from "react"
import { FiX, FiMapPin } from "react-icons/fi"
import api from "../api/apiClient"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const CreateLocalModal = ({
  isOpen,
  onClose,
  onCreated,
  companies = [],
  autoCompany = null
}) => {

  const [regions, setRegions] = useState([])
  const [comunas, setComunas] = useState([])

  const [form, setForm] = useState({
    company_id: autoCompany || "",
    cadena: "",
    region_id: "",
    comuna_id: "",
    direccion: "",
    gerente: "",
    telefono: "",
    lat: "",
    lng: ""
  })

  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [error, setError] = useState("")

  /* =========================
     CARGAR REGIONES
  ========================= */

  useEffect(() => {

    const loadRegions = async () => {

      try {

        const data = await api.get("/regions")
        setRegions(data)

      } catch (err) {

        console.error("Error cargando regiones")

      }

    }

    loadRegions()

  }, [])

  /* =========================
     CARGAR COMUNAS
  ========================= */

  useEffect(() => {

    if (!form.region_id) return

    const loadComunas = async () => {

      try {

        const data = await api.get(`/comunas?region_id=${form.region_id}`)
        setComunas(data)

      } catch (err) {

        console.error("Error cargando comunas")

      }

    }

    loadComunas()

  }, [form.region_id])

  useEffect(() => {

    if (autoCompany) {

      setForm(prev => ({
        ...prev,
        company_id: autoCompany
      }))

    }

  }, [autoCompany])

  if (!isOpen) return null

  const handleChange = (e) => {

    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))

  }

  /* =========================
     GEOCODING MAPBOX
  ========================= */

  const geocodeAddress = async () => {

    if (!form.direccion || !form.comuna_id || !form.region_id) {

      setError("Completa dirección, región y comuna")
      return

    }

    try {

      setGeoLoading(true)

      const comuna = comunas.find(c => c.id === form.comuna_id)?.name
      const region = regions.find(r => r.id === form.region_id)?.name

      const address = `${form.direccion}, ${comuna}, ${region}, Chile`

      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
        `?access_token=${MAPBOX_TOKEN}&limit=1&country=CL`

      const res = await fetch(url)
      const data = await res.json()

      if (!data.features || data.features.length === 0) {

        setError("No se pudo encontrar la ubicación")
        return

      }

      const [lng, lat] = data.features[0].center

      setForm(prev => ({
        ...prev,
        lat,
        lng
      }))

    } catch (err) {

      console.error(err)
      setError("Error obteniendo coordenadas")

    } finally {

      setGeoLoading(false)

    }

  }

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e) => {

    e.preventDefault()

    setLoading(true)
    setError("")

    try {

      const payload = {
        ...form,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null
      }

      await api.post("/locales", payload)

      onCreated()
      onClose()

    } catch (err) {

      setError(err.message)

    } finally {

      setLoading(false)

    }

  }

  return (

    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-6">

        <div className="flex justify-between items-center">

          <h3 className="text-xl font-semibold">
            Crear Local
          </h3>

          <button onClick={onClose}>
            <FiX size={20}/>
          </button>

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          {!autoCompany && (

            <select
              name="company_id"
              value={form.company_id}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >

              <option value="">Seleccionar Empresa</option>

              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}

            </select>

          )}

          <input
            type="text"
            name="cadena"
            placeholder="Cadena"
            value={form.cadena}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          {/* REGION */}

          <select
            name="region_id"
            value={form.region_id}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >

            <option value="">Seleccionar Región</option>

            {regions.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}

          </select>

          {/* COMUNA */}

          <select
            name="comuna_id"
            value={form.comuna_id}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >

            <option value="">Seleccionar Comuna</option>

            {comunas.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}

          </select>

          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          {/* BOTON GEOCODING */}

          <button
            type="button"
            onClick={geocodeAddress}
            disabled={geoLoading}
            className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
          >

            <FiMapPin size={16}/>

            {geoLoading
              ? "Buscando ubicación..."
              : "Obtener coordenadas automáticamente"}

          </button>

          <input
            type="text"
            name="gerente"
            placeholder="Gerente"
            value={form.gerente}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">

            <input
              type="number"
              step="any"
              name="lat"
              placeholder="Latitud"
              value={form.lat}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm"
            />

            <input
              type="number"
              step="any"
              name="lng"
              placeholder="Longitud"
              value={form.lng}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 text-sm"
            />

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg"
          >

            {loading ? "Creando..." : "Crear Local"}

          </button>

        </form>

      </div>

    </div>

  )

}

export default CreateLocalModal