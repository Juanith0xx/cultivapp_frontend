import { useState, useEffect, useMemo } from "react"
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom" // Añadimos Link
import { FiMenu, FiLogOut, FiActivity, FiGlobe, FiSend, FiBell } from "react-icons/fi" // Iconos nuevos
import Sidebar from "../../components/Sidebar"
import LocalesMap from "../../components/LocalesMap"
import api from "../../api/apiClient"
import { toast } from "react-hot-toast"

// 🔔 IMPORTACIONES SaaS
import Notifications from "../../components/Notifications" // El componente de la campana (Bell)
import { useAuth } from "../../context/AuthContext"
import { useNotificationContext } from "../../context/NotificationContext" // Hook global

import { Building2, Store, Users, MapPin, Globe } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const RootDashboard = () => {
  const { user } = useAuth() 
  // 🔔 CONSUMIMOS EL CONTEXTO GLOBAL
  const { unreadCount } = useNotificationContext()

  const [locales, setLocales] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedLocalId, setSelectedLocalId] = useState(null)
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()
  const location = useLocation()

  const isDashboard = location.pathname.endsWith("/root/analytics")
  const isLocales = location.pathname.endsWith("/root/locales")

  /* =========================================
     CARGA DE DATOS (PROTEGIDA)
     Ya no cargamos notificaciones aquí, lo hace el Contexto
  ========================================= */
  const fetchData = async () => {
    try {
      setLoading(true)
      const [localesData, companiesData, usersData] = await Promise.all([
        api.get("/locales").catch(err => []),
        api.get("/companies").catch(err => []),
        api.get("/users").catch(err => [])
      ])
      
      setLocales(localesData || [])
      setCompanies(companiesData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error("❌ Error General Dashboard:", error);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  /* =========================================
     FILTROS Y LÓGICA DE NEGOCIO
  ========================================= */
  const filteredLocales = useMemo(() => {
    return selectedCompany
      ? locales.filter(l => String(l.company_id) === String(selectedCompany))
      : locales
  }, [selectedCompany, locales])

  const filteredUsers = useMemo(() => {
    return selectedCompany
      ? users.filter(u => String(u.company_id) === String(selectedCompany))
      : users
  }, [selectedCompany, users])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  const stats = [
    { label: "Empresas", value: selectedCompany ? 1 : companies.length, icon: <Building2 size={20}/>, color: "text-blue-600" },
    { label: "Total Locales", value: filteredLocales.length, icon: <Store size={20}/>, color: "text-[#87be00]" },
    { label: "Usuarios", value: filteredUsers.length, icon: <Users size={20}/>, color: "text-purple-600" },
    { label: "Alertas Pendientes", value: unreadCount, icon: <FiBell size={20}/>, color: "text-red-500" } // 🔔 Stat dinámico
  ]

  const chartData = useMemo(() => {
    const counts = filteredLocales.reduce((acc, local) => {
      const region = local.region || "Sin región"
      acc[region] = (acc[region] || 0) + 1
      return acc
    }, {})
    return Object.keys(counts).map(name => ({ name, locales: counts[name] }))
  }, [filteredLocales])

  if (loading && !locales.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-[Outfit]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-gray-100 border-t-[#87be00] rounded-full animate-spin"></div>
           <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Sincronizando Red Global...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-[Outfit]">
      
      {/* SIDEBAR DESKTOP */}
       <div className="hidden md:flex md:flex-col md:w-72 bg-white border-r border-gray-100 min-h-screen px-6 py-10 shadow-sm z-20">
        
        <div className="px-4 mb-10">
           <h2 className="text-2xl font-black italic tracking-tighter text-gray-900">CULTIVAPP <span className="text-[#87be00]">ROOT</span></h2>
           <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">Infraestructura SaaS</p>
        </div>

        <nav className="flex-1 space-y-1">
          <Sidebar />

          {/* 📣 SECCIÓN DE COMUNICACIÓN (Añadida al Sidebar) */}
          <div className="pt-8 pb-2 px-6">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Comunicación</p>
          </div>
          
          <Link 
            to="notification-manager" 
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all text-[11px] font-black uppercase italic tracking-tighter ${
              location.pathname.includes('notification-manager') 
              ? 'bg-[#87be00] text-white shadow-lg shadow-[#87be00]/30' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FiSend size={18}/> Emitir Alertas
          </Link>

          <Link 
            to="notifications" 
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-tighter ${
              location.pathname.includes('notifications') 
              ? 'bg-gray-900 text-white shadow-xl' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FiBell size={18}/> Mi Bandeja
            {unreadCount > 0 && <span className="ml-auto bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span>}
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-50">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 text-gray-400 hover:text-red-500 hover:bg-red-50 px-6 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest w-full"
          >
            <FiLogOut size={18}/> Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOPBAR PREMIUM */}
        <div className="bg-white border-b border-gray-50 px-10 py-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-6">
            <button className="md:hidden text-gray-600"><FiMenu size={22}/></button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl text-gray-800">
                 <Globe size={20} className="animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Panel Central</h1>
                <span className="text-[10px] font-bold text-[#87be00] uppercase tracking-widest mt-1 italic">Infraestructura de Sistema</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* 🔔 CAMPANA SaaS (Ahora sin props, se conecta sola al contexto) */}
            <Notifications />
            
            <div className="hidden md:flex items-center gap-4 pl-8 border-l border-gray-100">
              <div className="text-right">
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-tighter italic leading-none mb-1">{user?.name || 'Root User'}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Super Administrador</p>
              </div>
              <div className="h-12 w-12 rounded-[1.2rem] bg-gray-900 flex items-center justify-center text-white font-black text-xs border-2 border-white shadow-xl shadow-gray-200">
                RT
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar pb-10">
          
          {/* SECCIÓN DASHBOARD / LOCALES */}
          {(isDashboard || isLocales) && (
            <div className="px-10 pt-10 space-y-10">
              
              <div className="bg-white border border-gray-50 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-gray-200/40">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#87be00]/10 rounded-2xl text-[#87be00]">
                        <Building2 size={24}/>
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Seleccionar Cliente</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase italic">Aislar datos de empresa específica</p>
                    </div>
                </div>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20 transition-all min-w-[320px] shadow-inner"
                >
                  <option value="">Todas las empresas de la red</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((s, i) => (
                  <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-50 flex items-center gap-6 shadow-xl shadow-gray-200/30">
                    <div className={`p-5 rounded-[1.5rem] bg-gray-50 ${s.color} shadow-inner`}>{s.icon}</div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{s.label}</p>
                      <p className="text-3xl font-black text-gray-900 tracking-tighter italic">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CHARTS & MAP */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                <div className="xl:col-span-2 bg-white p-10 rounded-[3.5rem] border border-gray-50 shadow-xl shadow-gray-200/40">
                   {/* ... Gráfico ... */}
                </div>
                <div className="xl:col-span-3 bg-white p-10 rounded-[3.5rem] border border-gray-50 shadow-xl shadow-gray-200/40">
                   {/* ... Mapa ... */}
                </div>
              </div>
            </div>
          )}

          {/* VISTAS HIJAS */}
          <div className="px-10 py-5">
            <Outlet context={{ fetchData, companies, users }} />
          </div>
        </div>
      </div>
    </div>
  )
}
export default RootDashboard