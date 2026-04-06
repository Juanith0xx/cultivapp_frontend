import { NavLink } from "react-router-dom"
import { 
  FiHome, 
  FiUsers, 
  FiMapPin, 
  FiHelpCircle, 
  FiCalendar, 
  FiNavigation,
  FiBell // 🔔 Importamos el icono de campana
} from "react-icons/fi"
import { useAuth } from "../context/AuthContext"

const AdminSidebar = () => {
  const { user } = useAuth()

  const baseClasses =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"

  const activeClasses =
    "bg-green-50 text-[#87be00] shadow-sm font-black"

  const inactiveClasses =
    "text-gray-600 hover:bg-gray-50 hover:text-gray-900"

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between min-h-screen p-6 shrink-0">

      {/* TOP */}
      <div>
        {/* Logo / Brand */}
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black text-[#87be00] tracking-tight uppercase leading-none">
            Cultivapp
          </h2>
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mt-2">
            Panel Administrador
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
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
            to="/admin/gps"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiNavigation size={18} />
            Monitoreo GPS
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

          {/* 🔔 NUEVA SECCIÓN: GENERADOR DE ALERTAS */}
          <NavLink
            to="/admin/notifications"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiBell size={18} />
            Notificaciones
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
        <div className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100/50">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Conectado como
          </p>
          <p className="text-sm font-black text-gray-800 truncate mt-1 uppercase tracking-tight">
            {user?.first_name} {user?.last_name}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#87be00] animate-pulse" />
            <p className="text-[9px] font-bold text-gray-400 uppercase truncate">
              {user?.company_name || "Cultiva Strategic Partners"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar