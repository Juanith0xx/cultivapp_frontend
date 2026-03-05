import { useEffect, useState } from "react"
import { FiX } from "react-icons/fi"
import api from "../api/apiClient"

const EditAdminUserModal = ({
  isOpen,
  onClose,
  onUpdated,
  user,
  stats
}) => {

  const [form, setForm] = useState({
    first_name: "",
    email: "",
    role: ""
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {

    if (user) {

      setForm({
        first_name: user.first_name,
        email: user.email,
        role: user.role
      })

    }

  }, [user])

  if (!isOpen || !user) return null

  /* ===========================
     SAFE NUMBER
  =========================== */
  const safe = (value) => {

    const num = Number(value)

    return isNaN(num) ? 0 : num
  }

  const usedSupervisors = safe(stats?.counts?.SUPERVISOR)
  const usedUsers = safe(stats?.counts?.USUARIO)
  const usedView = safe(stats?.counts?.VIEW)

  const maxSupervisors = safe(stats?.limits?.max_supervisors)
  const maxUsers = safe(stats?.limits?.max_users)
  const maxView = safe(stats?.limits?.max_view)

  const isRoleFull = (role) => {

    if (role === "SUPERVISOR")
      return usedSupervisors >= maxSupervisors && user.role !== "SUPERVISOR"

    if (role === "USUARIO")
      return usedUsers >= maxUsers && user.role !== "USUARIO"

    if (role === "VIEW")
      return usedView >= maxView && user.role !== "VIEW"

    return false
  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    setError("")
    setLoading(true)

    try {

      await api.put(`/api/users/${user.id}`, form)

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
            Editar Usuario
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

          <div>

            <label className="text-xs text-gray-500">
              Nombre
            </label>

            <input
              type="text"
              value={form.first_name}
              onChange={(e) =>
                setForm({ ...form, first_name: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />

          </div>

          <div>

            <label className="text-xs text-gray-500">
              Email
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />

          </div>

          <div>

            <label className="text-xs text-gray-500">
              Perfil
            </label>

            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            >

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

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#87be00] text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >

            {loading ? "Guardando..." : "Guardar Cambios"}

          </button>

        </form>

      </div>

    </div>
  )
}

export default EditAdminUserModal