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

  const [form, setForm] = useState({
    company_id: "",
    cadena: "",
    region: "",
    comuna: "",
    direccion: "",
    gerente: "",
    telefono: ""
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {

    if (local) {
      setForm({
        company_id: local.company_id || "",
        cadena: local.cadena || "",
        region: local.region || "",
        comuna: local.comuna || "",
        direccion: local.direccion || "",
        gerente: local.gerente || "",
        telefono: local.telefono || ""
      })
    }

  }, [local])

  if (!isOpen) return null

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

  }

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

          <input
            type="text"
            name="cadena"
            placeholder="Cadena"
            value={form.cadena}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="text"
            name="region"
            placeholder="Región"
            value={form.region}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="text"
            name="comuna"
            placeholder="Comuna"
            value={form.comuna}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

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