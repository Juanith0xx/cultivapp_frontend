import { useState } from "react"
import { FiX } from "react-icons/fi"
import api from "../api/apiClient"

const CreateCompanyModal = ({ isOpen, onClose, onCreated }) => {

  const initialState = {
    rut: "",
    name: "",
    address: "",
    max_supervisors: 2,
    max_users: 10,
    max_view: 1,
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    admin_position: "",
    admin_password: ""
  }

  const [form, setForm] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  /* ======================================
     LIMPIAR RUT
  ====================================== */
  const cleanRut = (rut) =>
    rut.replace(/\./g, "").replace("-", "").toUpperCase()

  /* ======================================
     FORMATEAR RUT
  ====================================== */
  const formatRut = (rut) => {

    const clean = cleanRut(rut)

    if (clean.length <= 1) return clean

    const body = clean.slice(0, -1)
    const dv = clean.slice(-1)

    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    return `${formattedBody}-${dv}`
  }

  /* ======================================
     VALIDAR RUT
  ====================================== */
  const validateRut = (rut) => {

    const clean = cleanRut(rut)

    if (clean.length < 8) return false

    const body = clean.slice(0, -1)
    const dv = clean.slice(-1)

    let sum = 0
    let multiplier = 2

    for (let i = body.length - 1; i >= 0; i--) {

      sum += multiplier * parseInt(body[i])

      multiplier = multiplier === 7 ? 2 : multiplier + 1
    }

    const expected = 11 - (sum % 11)

    const dvCalc =
      expected === 11 ? "0"
      : expected === 10 ? "K"
      : expected.toString()

    return dvCalc === dv
  }

  /* ======================================
     HANDLE CHANGE
  ====================================== */
  const handleChange = (e) => {

    const { name, value } = e.target

    if (name === "rut") {

      setForm(prev => ({
        ...prev,
        rut: formatRut(value)
      }))

    } else {

      setForm(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  /* ======================================
     SUBMIT
  ====================================== */
  const handleSubmit = async (e) => {

    e.preventDefault()

    setLoading(true)
    setError("")

    if (!validateRut(form.rut)) {

      setError("El RUT ingresado no es válido")
      setLoading(false)

      return
    }

    try {

      const payload = {
        ...form,
        rut: cleanRut(form.rut),
        max_supervisors: parseInt(form.max_supervisors) || 0,
        max_users: parseInt(form.max_users) || 0,
        max_view: parseInt(form.max_view) || 0
      }

      await api.post("/api/companies/with-admin", payload)

      setForm(initialState)

      onCreated()
      onClose()

    } catch (err) {

      setError(err.message)

    } finally {

      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">

      <div className="bg-white w-full max-w-xl rounded-2xl p-6 space-y-6">

        <div className="flex justify-between items-center">

          <h3 className="text-xl font-semibold">
            Crear Empresa - Administrador
          </h3>

          <button onClick={onClose}>
            <FiX />
          </button>

        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <h4 className="font-medium text-gray-700">
            Datos Empresa
          </h4>

          <input
            name="rut"
            value={form.rut}
            onChange={handleChange}
            placeholder="Ej: 76.123.456-7"
            required
            className="input"
          />

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="input"
            placeholder="Nombre Empresa"
          />

          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="input"
            placeholder="Dirección"
          />

          <h4 className="font-medium text-gray-700 mt-4">
            Límites del Plan
          </h4>

          <div className="grid grid-cols-3 gap-3">

            <input
              type="number"
              name="max_supervisors"
              value={form.max_supervisors}
              onChange={handleChange}
              className="input"
              placeholder="Supervisor"
            />

            <input
              type="number"
              name="max_users"
              value={form.max_users}
              onChange={handleChange}
              className="input"
              placeholder="Usuario"
            />

            <input
              type="number"
              name="max_view"
              value={form.max_view}
              onChange={handleChange}
              className="input"
              placeholder="View"
            />

          </div>

          <h4 className="font-medium text-gray-700 mt-4">
            Administrador Cliente
          </h4>

          <input
            name="admin_name"
            value={form.admin_name}
            onChange={handleChange}
            required
            className="input"
            placeholder="Nombre Usuario"
          />

          <input
            name="admin_position"
            value={form.admin_position}
            onChange={handleChange}
            className="input"
            placeholder="Cargo"
          />

          <input
            name="admin_email"
            value={form.admin_email}
            onChange={handleChange}
            required
            className="input"
            placeholder="Correo"
          />

          <input
            name="admin_phone"
            value={form.admin_phone}
            onChange={handleChange}
            className="input"
            placeholder="Teléfono"
          />

          <input
            type="password"
            name="admin_password"
            value={form.admin_password}
            onChange={handleChange}
            required
            className="input"
            placeholder="Contraseña inicial"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg"
          >
            {loading ? "Creando..." : "Crear Empresa"}
          </button>

        </form>

      </div>

    </div>
  )
}

export default CreateCompanyModal