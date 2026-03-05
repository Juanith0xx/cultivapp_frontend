import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import api from "../api/apiClient"

const CreateLocalModal = ({
  isOpen,
  onClose,
  onCreated,
  companies = [],
  autoCompany = null
}) => {

  const [form, setForm] = useState({
    company_id: autoCompany || "",
    cadena: "",
    region: "",
    comuna: "",
    direccion: "",
    gerente: "",
    telefono: ""
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  /* =========================================
     SI autoCompany CAMBIA → ACTUALIZA FORM
  ========================================= */
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

      await api.post("/api/locales", form)

      onCreated()
      onClose()

      // Reset form
      setForm({
        company_id: autoCompany || "",
        cadena: "",
        region: "",
        comuna: "",
        direccion: "",
        gerente: "",
        telefono: ""
      })

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
            <FiX size={20} />
          </button>

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* SOLO ROOT VE EL SELECT */}
          {!autoCompany && (
            <select
              name="company_id"
              value={form.company_id}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >

              <option value="">
                Seleccionar Empresa
              </option>

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
            className="w-full bg-black text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear Local"}
          </button>

        </form>

      </div>

    </div>
  )
}

export default CreateLocalModal