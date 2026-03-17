import { useEffect, useState, useCallback } from "react"
import {
  FiUserPlus,
  FiRotateCw,
  FiEdit,
  FiTrash
} from "react-icons/fi"

import api from "../../api/apiClient"

import CreateAdminUserModal from "../../components/CreateAdminUserModal"
import EditAdminUserModal from "../../components/EditAdminUserModal"
import ResetPasswordAdminModal from "../../components/ResetPasswordAdminModal"

const AdminUsers = () => {

  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const userLocal = JSON.parse(localStorage.getItem("user"))

  /* ===========================
     SAFE NUMBER
  =========================== */
  const safe = (value) => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  /* ===========================
     FETCH DATA
  =========================== */
  const fetchData = useCallback(async () => {

    try {

      setLoading(true)

      const timestamp = Date.now()

      const [usersData, statsData] = await Promise.all([
        api.get(`users?ts=${timestamp}`),
        api.get(`users/company/${userLocal.company_id}/stats?ts=${timestamp}`)
      ])

      setUsers(usersData)
      setStats(statsData)

    } catch (error) {
      console.error("FETCH ERROR:", error)
    } finally {
      setLoading(false)
    }

  }, [userLocal.company_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ===========================
     TOGGLE USER
  =========================== */
  const toggleUser = async (id) => {
    try {

      await api.patch(`users/${id}/toggle`)

      fetchData()

    } catch (error) {
      console.error("TOGGLE ERROR:", error)
    }
  }

  /* ===========================
     DELETE USER
  =========================== */
  const deleteUser = async (targetUser) => {

    if (targetUser.role === "ADMIN_CLIENTE") {
      alert("No puedes eliminar otro ADMIN_CLIENTE")
      return
    }

    if (targetUser.id === userLocal.id) {
      alert("No puedes eliminar tu propio usuario")
      return
    }

    const confirmDelete = window.confirm(
      `¿Eliminar a ${targetUser.first_name}?`
    )

    if (!confirmDelete) return

    try {

      await api.delete(`users/${targetUser.id}`)

      fetchData()

    } catch (error) {
      console.error("DELETE ERROR:", error)
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
     STATS
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

  const Card = ({ title, used, max, color }) => {

    const percentage = max > 0 ? (used / max) * 100 : 0

    return (
      <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">

        <p className="text-sm text-gray-500 mb-2">
          {title}
        </p>

        <p className="text-3xl font-bold text-gray-800">
          {used} / {max}
        </p>

        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className={`${color} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>

      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card
          title="Supervisores"
          used={usedSupervisors}
          max={maxSupervisors}
          color="bg-green-500"
        />

        <Card
          title="Usuarios"
          used={usedUsers}
          max={maxUsers}
          color="bg-blue-500"
        />

        <Card
          title="Solo Vista"
          used={usedView}
          max={maxView}
          color="bg-purple-500"
        />

      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <h1 className="text-xl font-semibold">
          Usuarios de la Empresa
        </h1>

        <button
          onClick={() => setOpenModal(true)}
          disabled={isCompanyFull}
          className="flex items-center gap-2 bg-[#87be00] text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-40"
        >
          <FiUserPlus />
          Crear Usuario
        </button>

      </div>

      {/* TABLA */}
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

              <tr key={user.id} className="border-t hover:bg-gray-50 transition">

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

                <td className="p-4 flex gap-5 items-center text-gray-600">

                  <button
                    onClick={() => setEditUser(user)}
                    className="hover:text-blue-600 transition"
                  >
                    <FiEdit size={16} />
                  </button>

                  <button
                    onClick={() => setResetUser(user)}
                    className="hover:text-yellow-600 transition"
                  >
                    <FiRotateCw size={16} />
                  </button>

                  {user.role !== "ADMIN_CLIENTE" &&
                    user.id !== userLocal.id && (
                      <button
                        onClick={() => deleteUser(user)}
                        className="hover:text-red-600 transition"
                      >
                        <FiTrash size={16} />
                      </button>
                    )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* MODALS */}
      <CreateAdminUserModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={fetchData}
      />

      <EditAdminUserModal
        isOpen={!!editUser}
        user={editUser}
        stats={stats}
        onClose={() => setEditUser(null)}
        onUpdated={fetchData}
      />

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