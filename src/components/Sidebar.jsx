import { NavLink } from "react-router-dom"
import {
  FiBarChart2,
  FiUsers,
  FiBriefcase,
  FiHome,
  FiHelpCircle,
  FiCalendar, // Icono para Planificación
  FiMapPin      // Icono para rutas
} from "react-icons/fi"

const Sidebar = () => {

  const linkBase =
    "flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"

  const linkInactive =
    "text-gray-400 hover:bg-gray-50 hover:text-gray-900"

  const linkActive =
    "bg-[#87be00]/10 text-[#87be00] shadow-sm shadow-[#87be00]/5"

  return (
    <div className="h-full flex flex-col font-[Outfit]">

      {/* LOGO / TITLE */}
      <div className="mb-12 px-2">
        <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">
          Cultiva<span className="text-[#87be00]">App</span>
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#87be00] animate-pulse" />
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Root Control Center
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-col gap-1.5">
        
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2 ml-4">Métricas</p>
        <NavLink
          to="/root/analytics"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiBarChart2 size={18} />
          Dashboard
        </NavLink>

        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Logística</p>
        {/* 🚩 NUEVA RUTA DE PLANIFICACIÓN */}
        <NavLink
          to="/root/planificacion"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiCalendar size={18} />
          Planificación
        </NavLink>

        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Estructura</p>
        <NavLink
          to="/root/companies"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiBriefcase size={18} />
          Empresas
        </NavLink>

        <NavLink
          to="/root/users"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiUsers size={18} />
          Usuarios
        </NavLink>

        <NavLink
          to="/root/locales"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiHome size={18} />
          Locales
        </NavLink>

        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Soporte</p>
        <NavLink
          to="/root/questions"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiHelpCircle size={18} />
          Preguntas
        </NavLink>

      </nav>

    </div>
  )
}

export default Sidebar