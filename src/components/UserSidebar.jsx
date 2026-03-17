import { NavLink } from "react-router-dom"
import { FiHome, FiMapPin, FiCalendar, FiFileText } from "react-icons/fi" // Cambié FiClipboard por FiCalendar
import { useAuth } from "../context/AuthContext"

const UserSidebar = () => {
  const { user } = useAuth()

  const baseClasses =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"

  const activeClasses =
    "bg-[#87be00]/10 text-[#87be00] shadow-sm font-bold"

  const inactiveClasses =
    "text-gray-500 hover:bg-gray-50 hover:text-gray-900"

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between min-h-screen p-6 sticky top-0">

      {/* TOP */}
      <div>
        {/* Logo */}
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black text-[#87be00] tracking-tighter">
            CULTIVAPP
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-[#87be00] rounded-full animate-pulse"></span>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              Modo Terreno
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {/* Dashboard / Inicio */}
          <NavLink
            to="/usuario"
            end
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiHome size={20} />
            Inicio
          </NavLink>

          {/* Calendario de Rutas - Ahora es el centro del SaaS */}
          <NavLink
            to="/usuario/routes"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiCalendar size={20} />
            Mi Agenda
          </NavLink>

          <NavLink
            to="/usuario/locales"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiMapPin size={20} />
            Mis Locales
          </NavLink>

          <NavLink
            to="/usuario/form"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <FiFileText size={20} />
            Reporte Diario
          </NavLink>
        </nav>
      </div>

      {/* USER INFO PANEL */}
      <div className="pt-6">
        <div className="bg-gray-900 p-4 rounded-2xl shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
            Operador
          </p>
          <p className="text-sm font-bold text-white truncate">
            {user?.first_name} {user?.last_name}
          </p>
          <div className="mt-3 pt-3 border-t border-white/10">
             <p className="text-[10px] text-[#87be00] font-black uppercase">
               {user?.company_name || 'Empresa Asociada'}
             </p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default UserSidebar