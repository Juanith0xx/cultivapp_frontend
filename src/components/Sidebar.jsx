import { NavLink } from "react-router-dom"
import {
  FiBarChart2,
  FiUsers,
  FiBriefcase,
  FiHome,
  FiHelpCircle,
  FiCalendar, 
  FiCamera,
  FiSend, // ✈️ Icono para emitir (enviar)
  FiBell,  // 🔔 Icono para la bandeja (recibir)
  FiClock  // 🕒 Icono para Turnos
} from "react-icons/fi"
import { useNotificationContext } from "../context/NotificationContext"

const Sidebar = () => {
  // Obtenemos el contador global para el badge de la bandeja
  const { unreadCount } = useNotificationContext();

  const linkBase =
    "flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"

  const linkInactive =
    "text-gray-400 hover:bg-gray-50 hover:text-gray-900"

  const linkActive =
    "bg-[#87be00]/10 text-[#87be00] shadow-sm shadow-[#87be00]/5"

  // Estilo especial para el botón de acción principal (Emitir Alertas)
  const actionButton = 
    "flex items-center gap-3 px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 bg-[#87be00] text-white shadow-lg shadow-[#87be00]/30 hover:bg-[#76a500] hover:-translate-y-0.5 mt-2"

  return (
    <div className="h-full flex flex-col font-[Outfit]">

      {/* LOGO / TITLE */}
      <div className="mb-12 px-2">
        <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">
          Cultiva<span className="text-[#87be00]">App</span>
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#87be00] animate-pulse" />
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">
            Root Control Center
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-col gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
        
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2 ml-4">Métricas</p>
        <NavLink
          to="/root/analytics"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <FiBarChart2 size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/root/auditoria-fotos"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <FiCamera size={18} />
          Auditoría Fotos
        </NavLink>

        {/* 🔔 SECCIÓN DE COMUNICACIÓN ACTUALIZADA */}
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Comunicación</p>
        
        {/* 🚀 LINK AL NOTIFICATION MANAGER (Emitir) */}
        <NavLink
          to="/root/notification-manager"
          className={({ isActive }) => 
            isActive ? actionButton : `${actionButton} opacity-90`
          }
        >
          <FiSend size={18} strokeWidth={3} />
          Emitir Alertas
        </NavLink>

        {/* 📥 LINK A LA BANDEJA (Historial) */}
        <NavLink
          to="/root/notifications"
          className={({ isActive }) => 
            `${linkBase} ${isActive ? linkActive : linkInactive} mt-1`
          }
        >
          <div className="relative">
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          Mi Bandeja
        </NavLink>

        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Logística</p>
        <NavLink
          to="/root/planificacion"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <FiCalendar size={18} />
          Planificación
        </NavLink>

        {/* 🚩 NUEVO: GESTIÓN DE TURNOS */}
        <NavLink
          to="/root/turnos"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <FiClock size={18} />
          Configurar Turnos
        </NavLink>

        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Estructura</p>
        <NavLink
          to="/root/companies"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <FiBriefcase size={18} />
          Empresas
        </NavLink>

        <NavLink
          to="/root/users"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <FiUsers size={18} />
          Usuarios
        </NavLink>

        <NavLink
          to="/root/locales"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <FiHome size={18} />
          Locales
        </NavLink>

        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Soporte</p>
        <NavLink
          to="/root/questions"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          <FiHelpCircle size={18} />
          Preguntas
        </NavLink>

      </nav>

    </div>
  )
}

export default Sidebar