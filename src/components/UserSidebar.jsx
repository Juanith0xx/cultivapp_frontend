import { NavLink } from "react-router-dom"
import { FiHome, FiMapPin, FiClipboard, FiFileText } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"

const UserSidebar = () => {

  const { user } = useAuth()

  const baseClasses =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"

  const activeClasses =
    "bg-green-50 text-green-600 shadow-sm"

  const inactiveClasses =
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900"

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between min-h-screen p-6">

      {/* TOP */}
      <div>

        {/* Logo */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-[#87be00] tracking-tight">
            Cultivapp
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Panel Usuario
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">

          <NavLink
            to="/user"
            end
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiHome size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/user/locales"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiMapPin size={18} />
            Mis Locales
          </NavLink>

          <NavLink
            to="/user/routes"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiClipboard size={18} />
            Mis Rutas
          </NavLink>

          {/* NUEVO */}
          <NavLink
            to="/user/form"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiFileText size={18} />
            Formulario
          </NavLink>

        </nav>

      </div>

      {/* USER INFO */}
      <div className="pt-6 border-t border-gray-100">

        <div className="bg-gray-50 p-4 rounded-xl">
          <p className="text-xs text-gray-400">
            Conectado como
          </p>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {user?.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {user?.company_name}
          </p>
        </div>

      </div>

    </div>
  )
}

export default UserSidebar