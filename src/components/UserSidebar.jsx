import { NavLink } from "react-router-dom"
import { FiHome, FiMapPin, FiCalendar, FiFileText, FiLogOut } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"

const UserSidebar = () => {
  const { user, logout } = useAuth()

  const navItems = [
    { to: "/usuario", icon: <FiHome size={20} />, label: "Inicio", end: true },
    { to: "/usuario/routes", icon: <FiCalendar size={20} />, label: "Mi Agenda" },
    { to: "/usuario/locales", icon: <FiMapPin size={20} />, label: "Mis Locales" },
    { to: "/usuario/form", icon: <FiFileText size={20} />, label: "Reportes" },
  ]

  return (
    /* 🚩 hidden md:flex -> Se oculta en móvil, aparece en desktop */
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col justify-between min-h-screen p-6 sticky top-0">
      <div>
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black text-[#87be00] tracking-tighter">Cultiva</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Panel Administrativo</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-[#87be00]/10 text-[#87be00] font-bold shadow-sm" : "text-gray-500 hover:bg-gray-50"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="bg-gray-900 p-4 rounded-2xl shadow-lg mt-auto">
        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Operador</p>
        <p className="text-sm font-bold text-white truncate">{user?.first_name} {user?.last_name}</p>
        <button onClick={logout} className="mt-3 flex items-center gap-2 text-[10px] text-red-400 font-black uppercase hover:text-red-300">
          <FiLogOut size={14}/> Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}

export default UserSidebar