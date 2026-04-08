import { NavLink } from "react-router-dom"
import { 
  FiBarChart2, 
  FiUsers, 
  FiHome, 
  FiHelpCircle, 
  FiCalendar, 
  FiNavigation,
  FiBell 
} from "react-icons/fi"
import { useAuth } from "../context/AuthContext"

const AdminSidebar = () => {
  const { user } = useAuth()

  const linkBase =
    "flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"

  const linkInactive =
    "text-gray-400 hover:bg-gray-50 hover:text-gray-900"

  const linkActive =
    "bg-[#87be00]/10 text-[#87be00] shadow-sm shadow-[#87be00]/5"

  return (
    <div className="h-full flex flex-col justify-between font-[Outfit]">
      
      <div>
        {/* NAVIGATION */}
        <nav className="flex flex-col gap-1.5">
          
          {/* MÉTRICAS */}
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2 ml-4">Métricas</p>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiBarChart2 size={18} />
            Dashboard
          </NavLink>

          {/* LOGÍSTICA */}
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Logística</p>
          <NavLink
            to="/admin/routes"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiCalendar size={18} />
            Planificación
          </NavLink>

          <NavLink
            to="/admin/gps"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiNavigation size={18} />
            Monitoreo GPS
          </NavLink>

          {/* COMUNICACIÓN */}
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Comunicación</p>
          <NavLink
            to="/admin/notifications"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiBell size={18} />
            Centro de Alertas
          </NavLink>

          {/* ESTRUCTURA */}
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Estructura</p>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiUsers size={18} />
            Usuarios
          </NavLink>

          <NavLink
            to="/admin/locales"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiHome size={18} />
            Red de Locales
          </NavLink>

          {/* SOPORTE */}
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 mb-2 ml-4">Soporte</p>
          <NavLink
            to="/admin/questions"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <FiHelpCircle size={18} />
            Preguntas
          </NavLink>
        </nav>
      </div>

      {/* INFO DEL USUARIO (Opcional, pero ayuda a llenar el espacio inferior) */}
      <div className="pt-6 border-t border-gray-50 mt-10">
        <div className="px-4">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Empresa</p>
          <p className="text-[10px] font-black text-gray-800 uppercase truncate italic">
            {user?.company_name || "Admin Panel"}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar