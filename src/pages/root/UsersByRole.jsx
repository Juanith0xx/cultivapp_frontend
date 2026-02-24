import { useState, useEffect } from "react"
import { FiPlus, FiTrash2 } from "react-icons/fi"
import CreateUserModal from "../../components/CreateUserModal"

const UsersByRole = ({ role = null, title, buttonLabel }) => {

  const [openModal, setOpenModal] = useState(false)
  const [users, setUsers] = useState([])

  /* =========================================
     FETCH USERS (con o sin filtro)
  ========================================= */
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")

      const url = role
        ? `http://localhost:5000/api/users?role=${role}`
        : `http://localhost:5000/api/users`

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      setUsers(data)

    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [role])

  /* =========================================
     TOGGLE
  ========================================= */
  const toggleUser = async (id) => {
    try {
      const token = localStorage.getItem("token")

      await fetch(
        `http://localhost:5000/api/users/${id}/toggle`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      fetchUsers()

    } catch (error) {
      console.error(error)
    }
  }

  /* =========================================
     DELETE
  ========================================= */
  const deleteUser = async (id) => {
    const confirmDelete = window.confirm("¿Seguro que deseas eliminar este usuario?")
    if (!confirmDelete) return

    try {
      const token = localStorage.getItem("token")

      await fetch(
        `http://localhost:5000/api/users/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      fetchUsers()

    } catch (error) {
      console.error(error)
    }
  }

  const total = users.length
  const activos = users.filter(u => u.is_active).length
  const inactivos = users.filter(u => !u.is_active).length

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {title}
        </h2>

        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:opacity-90 transition text-sm"
        >
          <FiPlus size={16} />
          {buttonLabel}
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-2xl font-semibold">{total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Activos</p>
          <p className="text-2xl font-semibold text-green-500">{activos}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Inactivos</p>
          <p className="text-2xl font-semibold text-red-500">{inactivos}</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              {!role && <th className="p-4">Rol</th>}
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr className="border-t">
                <td className="p-4">Sin registros</td>
                <td className="p-4">-</td>
                {!role && <td className="p-4">-</td>}
                <td className="p-4">-</td>
                <td className="p-4">-</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-t">

                  <td className="p-4">{user.first_name}</td>
                  <td className="p-4">{user.email}</td>

                  {!role && (
                    <td className="p-4">
                      <span className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {user.role}
                      </span>
                    </td>
                  )}

                  <td className="p-4">
                    <button
                      onClick={() => toggleUser(user.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        user.is_active ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          user.is_active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <CreateUserModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={fetchUsers}
        defaultRole={role || ""}
      />

    </div>
  )
}

export default UsersByRole