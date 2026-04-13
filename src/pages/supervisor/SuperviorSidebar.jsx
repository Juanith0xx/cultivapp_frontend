import { NavLink } from "react-router-dom"
import { 
  FiGrid, 
  FiMap, 
  FiSend, 
  FiClock, 
  FiCamera, 
  FiLogOut, 
  FiBell 
} from "react-icons/fi"
import { useAuth } from "../../context/AuthContext"
import { useNotificationContext } from "../../context/NotificationContext"

const SupervisorSidebar = () => {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotificationContext()

  // Clases homologadas con Admin y User
  const linkBase =
    "flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
  const linkInactive = "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
  const linkActive = "bg-[#87be00]/10 text-[#87be00] shadow-sm shadow-[#87be00]/5"

  return (
    <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col justify-between min-h-screen p-6 sticky top-0 font-[Outfit]">
      
      <div className="overflow-y-auto pr-2 custom-scrollbar">
        {/* LOGO */}
        <div className="mb-10 px-4">
          <h2 className="text-2xl font-black text-[#87be00] tracking-tighter italic">
            Cultiva<span className="text-gray-900">App</span>
          </h2>
          <p className="text-[9px] text-gray-300 uppercase tracking-[0.3em] font-black">
            Panel Supervisor
          </p>
        </div>

        <nav className="flex flex-col gap-1.5">
          {/* MONITOREO */}
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2 ml-4">Operación Viva</p>
          <NavLink to="/supervisor" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <FiGrid size={18} /> Panel Cobertura
          </NavLink>
          
          <NavLink to="/supervisor/mapa" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <FiMap size={18} /> Mapa en Vivo
          </NavLink>

          {/* COMUNICACIÓN */}
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Comunicación</p>
          <NavLink to="/supervisor/alertas" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <FiSend size={18} /> Enviar Instrucciones
          </NavLink>

          <NavLink to="/supervisor/notificaciones" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <div className="relative">
              <FiBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Bandeja Avisos
          </NavLink>

          {/* CONTROL */}
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Auditoría</p>
          <NavLink to="/supervisor/asistencia" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <FiClock size={18} /> Control Jornada
          </NavLink>

          <NavLink to="/supervisor/ejecucion" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <FiCamera size={18} /> Validación Sala
          </NavLink>
        </nav>
      </div>

      {/* FOOTER USER */}
      <div className="pt-6 border-t border-gray-100 mt-10">
        <div className="px-4 mb-4">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Supervisor de Zona</p>
          <p className="text-[10px] font-black text-[#87be00] uppercase truncate italic">
            {user?.first_name} {user?.last_name}
          </p>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all duration-300">
          <FiLogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}

export default SupervisorSidebar