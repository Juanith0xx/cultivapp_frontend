import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import api from "../api/apiClient"

const EditLocalModal = ({
  isOpen,
  onClose,
  onUpdated,
  companies = [],
  local
}) => {

  const [regions, setRegions] = useState([])
  const [comunas, setComunas] = useState([])

  const [form, setForm] = useState({
    company_id: "",
    cadena: "",
    region_id: "",
    comuna_id: "",
    direccion: "",
    gerente: "",
    telefono: ""
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  /* =========================
     CARGAR REGIONES
  ========================= */

  useEffect(() => {

    const loadRegions = async () => {

      try {

        const data = await api.get("/api/regions")
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

        const data = await api.get(`/api/comunas?region_id=${form.region_id}`)
        setComunas(data)

      } catch (err) {

        console.error("Error cargando comunas")

      }

    }

    loadComunas()

  }, [form.region_id])

  /* =========================
     CARGAR LOCAL
  ========================= */

  useEffect(() => {

    if (local) {

      setForm({
        company_id: local.company_id || "",
        cadena: local.cadena || "",
        region_id: local.region_id || "",
        comuna_id: local.comuna_id || "",
        direccion: local.direccion || "",
        gerente: local.gerente || "",
        telefono: local.telefono || ""
      })

    }

  }, [local])

  if (!isOpen) return null

  const handleChange = (e) => {

    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))

  }

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e) => {

    e.preventDefault()

    setLoading(true)
    setError("")

    try {

      await api.put(`/api/locales/${local.id}`, form)

      onUpdated()
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
            Editar Local
          </h3>

          <button onClick={onClose}>
            <FiX size={20} />
          </button>

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* EMPRESA */}

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

          {/* CADENA */}

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

          {/* DIRECCION */}

          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          {/* GERENTE */}

          <input
            type="text"
            name="gerente"
            placeholder="Gerente"
            value={form.gerente}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          {/* TELEFONO */}

          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
          >

            {loading ? "Guardando..." : "Actualizar Local"}

          </button>

        </form>

      </div>

    </div>

  )

}

export default EditLocalModal