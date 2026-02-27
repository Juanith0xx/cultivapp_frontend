import { useEffect, useState, useCallback } from "react"
import { FiPlus, FiRefreshCw, FiEdit2 } from "react-icons/fi"
import CreateAdminUserModal from "../../components/CreateAdminUserModal"
import EditAdminUserModal from "../../components/EditAdminUserModal"
import ResetPasswordAdminModal from "../../components/ResetPasswordAdminModal"

const API_URL = "http://localhost:5000/api/users"

const AdminUsers = () => {

  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const userLocal = JSON.parse(localStorage.getItem("user"))
  const token = localStorage.getItem("token")

  /* ===========================
     SAFE NUMBER
  =========================== */
  const safe = (value) => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  /* ===========================
     FETCH DATA (ANTI-CACHE FIX)
  =========================== */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const timestamp = Date.now() // 🔥 evita 304

      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}?ts=${timestamp}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache"
          }
        }),
        fetch(
          `${API_URL}/company/${userLocal.company_id}/stats?ts=${timestamp}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache"
            }
          }
        )
      ])

      if (!usersRes.ok || !statsRes.ok) {
        throw new Error("Error obteniendo datos")
      }

      const usersData = await usersRes.json()
      const statsData = await statsRes.json()

      setUsers(usersData)
      setStats(statsData)

    } catch (error) {
      console.error("FETCH ERROR:", error)
    } finally {
      setLoading(false)
    }
  }, [token, userLocal.company_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ===========================
     TOGGLE
  =========================== */
  const toggleUser = async (id) => {
    try {
      await fetch(`${API_URL}/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      })

      fetchData()
    } catch (error) {
      console.error("TOGGLE ERROR:", error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        Cargando información...
      </div>
    )
  }

  if (!stats) return null

  /* ===========================
     NORMALIZACIÓN
  =========================== */
  const usedSupervisors = safe(stats.counts?.SUPERVISOR)
  const usedUsers = safe(stats.counts?.USUARIO)
  const usedView = safe(stats.counts?.VIEW)

  const maxSupervisors = safe(stats.limits?.max_supervisors)
  const maxUsers = safe(stats.limits?.max_users)
  const maxView = safe(stats.limits?.max_view)

  const totalUsed = usedSupervisors + usedUsers + usedView
  const totalMax = maxSupervisors + maxUsers + maxView
  const isCompanyFull = totalMax > 0 && totalUsed >= totalMax

  /* ===========================
     CARD COMPONENT
  =========================== */
  const Card = ({ title, used, max, color }) => {

    const percentage = max > 0 ? (used / max) * 100 : 0

    const getBarColor = () => {
      if (used >= max && max > 0) return "bg-red-500"
      if (percentage > 75) return "bg-yellow-500"
      return color
    }

    return (
      <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
        <p className="text-sm text-gray-500 mb-2">{title}</p>

        <p className="text-3xl font-bold text-gray-800">
          {used} / {max}
        </p>

        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className={`${getBarColor()} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {used >= max && max > 0 && (
          <p className="text-xs text-red-500 mt-3">
            Límite alcanzado
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* ===== RESUMEN ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Supervisores" used={usedSupervisors} max={maxSupervisors} color="bg-green-500" />
        <Card title="Usuarios" used={usedUsers} max={maxUsers} color="bg-blue-500" />
        <Card title="Solo Vista" used={usedView} max={maxView} color="bg-purple-500" />
      </div>

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          Usuarios de la Empresa
        </h1>

        <button
          onClick={() => setOpenModal(true)}
          disabled={isCompanyFull}
          className="flex items-center gap-2 bg-[#87be00] text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-40"
        >
          <FiPlus />
          Crear Usuario
        </button>
      </div>

      {/* ===== TABLA ===== */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-4">{user.first_name}</td>
                <td className="p-4">{user.email}</td>

                <td className="p-4">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {user.role}
                  </span>
                </td>

                <td className="p-4">
                  <button
                    onClick={() => toggleUser(user.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      user.is_active ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                        user.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>

                <td className="p-4 flex gap-4 items-center">

                  {/* EDIT */}
                  <button
                    onClick={() => setEditUser(user)}
                    className="text-blue-600 hover:opacity-70"
                  >
                    <FiEdit2 />
                  </button>

                  {/* RESET PASSWORD */}
                  <button
                    onClick={() => setResetUser(user)}
                    className="text-yellow-600 hover:opacity-70"
                  >
                    <FiRefreshCw />
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE */}
      <CreateAdminUserModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={fetchData}
      />

      {/* EDIT */}
      <EditAdminUserModal
        isOpen={!!editUser}
        user={editUser}
        stats={stats}
        onClose={() => setEditUser(null)}
        onUpdated={fetchData}
      />

      {/* RESET PASSWORD */}
      {resetUser && (
        <ResetPasswordAdminModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onUpdated={fetchData}
        />
      )}

    </div>
  )
}

export default AdminUsers