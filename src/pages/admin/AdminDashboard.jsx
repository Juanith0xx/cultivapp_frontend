import { Outlet, useNavigate } from "react-router-dom"
import { FiLogOut } from "react-icons/fi"
import AdminSidebar from "../../components/AdminSidebar"

const AdminDashboard = () => {

  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  return (
    <div className="min-h-screen flex bg-gray-100 font-[Outfit]">

      {/* Sidebar */}
      <AdminSidebar />

      {/* Content */}
      <div className="flex-1 p-6">

        <div className="flex justify-end mb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 text-sm"
          >
            <FiLogOut />
            Cerrar sesión
          </button>
        </div>

        <Outlet />

      </div>

    </div>
  )
}

export default AdminDashboard