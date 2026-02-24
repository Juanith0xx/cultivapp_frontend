import { useState } from "react"
import { FiX } from "react-icons/fi"

const CreateCompanyModal = ({ isOpen, onClose, onCreated }) => {

  const [form, setForm] = useState({
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
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
      const token = localStorage.getItem("token")

      const res = await fetch(
        "http://localhost:5000/api/companies/with-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(form)
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }

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
            Crear Empresa + Administrador
          </h3>
          <button onClick={onClose}>
            <FiX />
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">

          <h4 className="font-medium text-gray-700">
            Datos Empresa
          </h4>

          <input name="rut" placeholder="Rut Empresa" onChange={handleChange} required className="input" />
          <input name="name" placeholder="Nombre Empresa" onChange={handleChange} required className="input" />
          <input name="address" placeholder="Dirección" onChange={handleChange} required className="input" />

          <h4 className="font-medium text-gray-700 mt-4">
            Límites del Plan
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <input type="number" name="max_supervisors" placeholder="Supervisores" onChange={handleChange} className="input" />
            <input type="number" name="max_users" placeholder="Usuarios" onChange={handleChange} className="input" />
            <input type="number" name="max_view" placeholder="View" onChange={handleChange} className="input" />
          </div>

          <h4 className="font-medium text-gray-700 mt-4">
            Administrador Cliente
          </h4>

          <input name="admin_name" placeholder="Nombre Usuario" onChange={handleChange} required className="input" />
          <input name="admin_position" placeholder="Cargo" onChange={handleChange} className="input" />
          <input name="admin_email" placeholder="Correo" onChange={handleChange} required className="input" />
          <input name="admin_phone" placeholder="Teléfono" onChange={handleChange} className="input" />
          <input type="password" name="admin_password" placeholder="Contraseña inicial" onChange={handleChange} required className="input" />

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