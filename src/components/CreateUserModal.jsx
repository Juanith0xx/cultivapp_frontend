import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import api from "../api/apiClient"

const CreateUserModal = ({
  isOpen,
  onClose,
  onCreated,
  defaultRole = ""
}) => {

  const [form, setForm] = useState({
    first_name: "",
    email: "",
    password: "",
    company_id: "",
    role: defaultRole
  })

  const [companies, setCompanies] = useState([])
  const [companyStats, setCompanyStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {

    if (isOpen) {

      fetchCompanies()

      setForm({
        first_name: "",
        email: "",
        password: "",
        company_id: "",
        role: defaultRole
      })

      setCompanyStats(null)
      setError("")

    }

  }, [isOpen, defaultRole])

  /* =========================================
     FETCH EMPRESAS
  ========================================= */
  const fetchCompanies = async () => {

    try {

      const data = await api.get("/api/companies")
      setCompanies(data)

    } catch (err) {

      console.error(err)

    }

  }

  /* =========================================
     FETCH STATS POR EMPRESA
  ========================================= */
  const fetchCompanyStats = async (companyId) => {

    try {

      const data = await api.get(
        `/api/users/company/${companyId}/stats`
      )

      setCompanyStats(data)

    } catch (error) {

      console.error(error)

    }

  }

  /* =========================================
     HANDLE CHANGE
  ========================================= */
  const handleChange = (e) => {

    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === "company_id" && value) {
      fetchCompanyStats(value)
    }

  }

  /* =========================================
     LABEL ROL
  ========================================= */
  const getRoleLabel = (role) => {

    switch (role) {

      case "SUPERVISOR":
        return "Supervisor"

      case "USUARIO":
        return "Usuario"

      case "VIEW":
        return "Solo Vista"

      default:
        return ""
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

      await api.post("/api/users", form)

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

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <input
            type="text"
            name="first_name"
            placeholder="Nombre completo"
            value={form.first_name}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <select
            name="company_id"
            value={form.company_id}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
          >

            <option value="">
              Seleccionar Empresa
            </option>

            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}

          </select>

          {/* CUPOS */}
          {companyStats && (

            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">

              <p className="font-medium text-gray-600 mb-2">
                Cupos disponibles
              </p>

              <p className={isRoleFull("SUPERVISOR") ? "text-red-500" : ""}>
                Supervisores: {companyStats.counts.SUPERVISOR} / {companyStats.limits.max_supervisors}
              </p>

              <p className={isRoleFull("USUARIO") ? "text-red-500" : ""}>
                Usuarios: {companyStats.counts.USUARIO} / {companyStats.limits.max_users}
              </p>

              <p className={isRoleFull("VIEW") ? "text-red-500" : ""}>
                Solo Vista: {companyStats.counts.VIEW} / {companyStats.limits.max_view}
              </p>

            </div>

          )}

          {/* ROL */}
          {defaultRole ? (

            <div className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100">
              {getRoleLabel(defaultRole)}
            </div>

          ) : (

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
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

          )}

          <button
            type="submit"
            disabled={loading || isRoleFull(form.role)}
            className="w-full bg-black text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >

            {loading
              ? "Creando..."
              : `Crear ${getRoleLabel(form.role) || "Usuario"}`}

          </button>

        </form>

      </div>

    </div>
  )
}

export default CreateUserModal