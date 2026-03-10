import { NavLink } from "react-router-dom"
import {
  FiBarChart2,
  FiUsers,
  FiBriefcase,
  FiHome,
  FiHelpCircle
} from "react-icons/fi"

const Sidebar = () => {

  const linkBase =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition"

  const linkInactive =
    "text-gray-600 hover:bg-gray-100 hover:text-black"

  const linkActive =
    "bg-[#87be00]/10 text-[#87be00] font-medium"

  return (
    <div className="h-full flex flex-col font-[Outfit]">

      {/* LOGO / TITLE */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-[#87be00] tracking-tight">
          Root Panel
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Administración Global
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-col gap-2">

        <NavLink
          to="/root/analytics"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiBarChart2 size={16} />
          Dashboard
        </NavLink>

        <NavLink
          to="/root/companies"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiBriefcase size={16} />
          Empresas
        </NavLink>

        <NavLink
          to="/root/users"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiUsers size={16} />
          Usuarios
        </NavLink>

        <NavLink
          to="/root/locales"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiHome size={16} />
          Locales
        </NavLink>

        {/* NUEVA SECCIÓN */}
        <NavLink
          to="/root/questions"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <FiHelpCircle size={16} />
          Preguntas
        </NavLink>

      </nav>

    </div>
  )
}

export default Sidebar