import { NavLink } from "react-router-dom"
import { FiHome, FiMapPin, FiCalendar, FiLogOut, FiBell } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"
import { useNotificationContext } from "../context/NotificationContext"

const UserSidebar = () => {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotificationContext()

  const linkBase =
    "flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"

  const linkInactive =
    "text-gray-400 hover:bg-gray-50 hover:text-gray-900"

  const linkActive =
    "bg-[#87be00]/10 text-[#87be00] shadow-sm shadow-[#87be00]/5"

  return (
    <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col justify-between min-h-screen p-6 sticky top-0 font-[Outfit]">
      
      <div className="overflow-y-auto pr-2 custom-scrollbar">
        {/* LOGO SECCIÓN */}
        <div className="mb-10 px-4">
          <h2 className="text-2xl font-black text-[#87be00] tracking-tighter italic">
            Cultiva<span className="text-gray-900">App</span>
          </h2>
          <p className="text-[9px] text-gray-300 uppercase tracking-[0.3em] font-black">
            Panel Mercaderista
          </p>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex flex-col gap-1.5">
          
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2 ml-4">General</p>
          <NavLink
            to="/usuario/home"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiHome size={18} />
            Inicio
          </NavLink>

          {/* PLANIFICACIÓN */}
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Planificación</p>
          
          {/* 📅 MI AGENDA: Corregido de /routes a /agenda para que coincida con App.jsx */}
          <NavLink
            to="/usuario/agenda" 
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiCalendar size={18} />
            Mi Agenda
          </NavLink>

          <NavLink
            to="/usuario/locales"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiMapPin size={18} />
            Mis Locales
          </NavLink>

          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Comunicación</p>
          
          <NavLink
            to="/usuario/notifications"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <div className="relative">
              <FiBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Mi Bandeja
          </NavLink>

        </nav>
      </div>

      {/* FOOTER / USER INFO */}
      <div className="pt-6 border-t border-gray-100 mt-10">
        <div className="px-4 mb-4">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Operador</p>
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-[#87be00]/10 flex items-center justify-center text-[#87be00] font-black text-[10px]">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
             </div>
             <p className="text-[10px] font-black text-[#87be00] uppercase truncate italic">
                {user?.first_name} {user?.last_name}
             </p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all duration-300"
        >
          <FiLogOut size={16} />
          Cerrar Sesión
        </button>
      </div>

    </aside>
  )
}

export default UserSidebar