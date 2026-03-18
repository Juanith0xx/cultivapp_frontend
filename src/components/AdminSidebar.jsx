import { NavLink } from "react-router-dom"
import { FiHome, FiUsers, FiMapPin, FiHelpCircle, FiCalendar } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"

const AdminSidebar = () => {
  const { user } = useAuth()

  const baseClasses =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"

  const activeClasses =
    "bg-green-50 text-green-600 shadow-sm"

  const inactiveClasses =
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900"

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between min-h-screen p-6 shrink-0">

      {/* TOP */}
      <div>
        {/* Logo / Brand */}
        <div className="mb-10">
          <h2 className="text-2xl font-black text-[#87be00] tracking-tight uppercase">
            Cultivapp
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Panel Administrador
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiHome size={18} />
            Dashboard
          </NavLink>

          {/* 🚩 NUEVA SECCIÓN: PLANIFICACIÓN DE RUTAS */}
          <NavLink
            to="/admin/routes"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiCalendar size={18} />
            Planificación
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiUsers size={18} />
            Usuarios
          </NavLink>

          <NavLink
            to="/admin/locales"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiMapPin size={18} />
            Locales
          </NavLink>

          <NavLink
            to="/admin/questions"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiHelpCircle size={18} />
            Preguntas
          </NavLink>
        </nav>
      </div>

      {/* BOTTOM USER INFO */}
      <div className="pt-6 border-t border-gray-100">
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Conectado como
          </p>
          <p className="text-sm font-black text-gray-800 truncate mt-1">
            {user?.name || "Administrador"}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#87be00]" />
            <p className="text-[10px] font-bold text-gray-500 uppercase truncate">
              {user?.company_name || "Empresa Cliente"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar