import { Outlet, useNavigate } from "react-router-dom"
import { FiLogOut } from "react-icons/fi"
import UserSidebar from "../../components/UserSidebar"

const UserDashboard = () => {

  const navigate = useNavigate()

  const handleLogout = () => {

    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")

  }

  return (

    <div className="min-h-screen flex bg-gray-100 font-[Outfit]">

      {/* Sidebar */}
      <UserSidebar />

      {/* Content */}
      <div className="flex-1 p-6">

        {/* Header */}
        <div className="flex justify-end mb-6">

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 text-sm hover:text-red-600 transition"
          >
            <FiLogOut />
            Cerrar sesión
          </button>

        </div>

        {/* Pages */}
        <Outlet />

      </div>

    </div>

  )

}

export default UserDashboard