import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import api from "../api/apiClient"

const CreateAdminUserModal = ({
  isOpen,
  onClose,
  onCreated
}) => {

  const user = JSON.parse(localStorage.getItem("user"))

  const [form, setForm] = useState({
    first_name: "",
    email: "",
    password: "",
    role: ""
  })

  const [companyStats, setCompanyStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchCompanyStats()
      setForm({
        first_name: "",
        email: "",
        password: "",
        role: ""
      })
      setError("")
    }
  }, [isOpen])

  /* =========================================
     FETCH STATS EMPRESA ACTUAL
  ========================================= */
  const fetchCompanyStats = async () => {

    try {

      const data = await api.get(
        `/api/users/company/${user.company_id}/stats`
      )

      setCompanyStats(data)

    } catch (error) {
      console.error("FETCH STATS ERROR:", error)
    }

  }

  /* =========================================
     VALIDAR CUPO
  ========================================= */
  const isRoleFull = (role) => {

    if (!companyStats) return false

    const { counts, limits } = companyStats

    if (role === "SUPERVISOR")
      return counts.SUPERVISOR >= limits.max_supervisors

    if (role === "USUARIO")
      return counts.USUARIO >= limits.max_users

    if (role === "VIEW")
      return counts.VIEW >= limits.max_view

    return false
  }

  /* =========================================
     SUBMIT
  ========================================= */
  const handleSubmit = async (e) => {

    e.preventDefault()
    setLoading(true)
    setError("")

    if (isRoleFull(form.role)) {
      setError("No hay cupos disponibles para este perfil")
      setLoading(false)
      return
    }

    try {

      await api.post("/api/users", {
        ...form,
        company_id: user.company_id
      })

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-6">

        <div className="flex justify-between items-center">

          <h3 className="text-xl font-semibold">
            Crear Usuario
          </h3>

          <button onClick={onClose}>
            <FiX size={20} />
          </button>

        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Nombre completo"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
            onChange={(e) =>
              setForm({ ...form, first_name: e.target.value })
            }
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Contraseña"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <select
            required
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >

            <option value="">
              Seleccionar Perfil
            </option>

            <option
              value="SUPERVISOR"
              disabled={isRoleFull("SUPERVISOR")}
            >
              Supervisor
            </option>

            <option
              value="USUARIO"
              disabled={isRoleFull("USUARIO")}
            >
              Usuario
            </option>

            <option
              value="VIEW"
              disabled={isRoleFull("VIEW")}
            >
              Solo Vista
            </option>

          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#87be00] text-white py-2 rounded-lg hover:opacity-90 transition"
          >
            {loading ? "Creando..." : "Crear Usuario"}
          </button>

        </form>

      </div>

    </div>
  )
}

export default CreateAdminUserModal