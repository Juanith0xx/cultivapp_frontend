import { useState, useEffect, useMemo } from "react"
import { useNavigate, Outlet, useLocation } from "react-router-dom"
import { FiMenu, FiLogOut } from "react-icons/fi"
import Sidebar from "../../components/Sidebar"
import LocalesMap from "../../components/LocalesMap"
import api from "../../api/apiClient"

import { Building2, Store, Users, MapPin } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const RootDashboard = () => {
  const [locales, setLocales] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedLocalId, setSelectedLocalId] = useState(null)
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()
  const location = useLocation()

  // Detectamos si estamos en la raíz de analytics o locales para mostrar el filtro global
  const isDashboard = location.pathname.includes("/root/analytics")
  const isLocales = location.pathname.includes("/root/locales")

  const fetchData = async () => {
    try {
      setLoading(true)
      // ✅ MEJORA: Eliminamos "/api" manual para evitar el error 404 (/api/api/...)
      const [localesData, companiesData, usersData] = await Promise.all([
        api.get("/locales"),
        api.get("/companies"),
        api.get("/users")
      ])
      
      setLocales(localesData || [])
      setCompanies(companiesData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error("❌ Error cargando datos del dashboard:", error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Memorizamos filtros para optimizar rendimiento en móviles
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

  const selectedLocal = useMemo(() => {
    return filteredLocales.find(l => l.id === selectedLocalId)
  }, [selectedLocalId, filteredLocales])

  useEffect(() => {
    setSelectedLocalId(null)
  }, [selectedCompany])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  const stats = [
    { label: "Empresas", value: selectedCompany ? 1 : companies.length, icon: <Building2 size={20}/>, color: "text-blue-600" },
    { label: "Total Locales", value: filteredLocales.length, icon: <Store size={20}/>, color: "text-[#87be00]" },
    { label: "Usuarios", value: filteredUsers.length, icon: <Users size={20}/>, color: "text-purple-600" },
    { label: "Activos Ahora", value: filteredLocales.filter(l => l.is_active).length, icon: <MapPin size={20}/>, color: "text-orange-600" }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-[Outfit]">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#87be00]"></div>
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando Red Cultiva...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-[Outfit]">
      {/* SIDEBAR DESKTOP */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-100 min-h-screen px-6 py-8">
        <Sidebar />
        <div className="mt-auto pt-6">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 text-gray-400 hover:text-red-500 hover:bg-red-50 px-4 py-3 rounded-2xl transition-all text-xs font-black uppercase tracking-widest w-full"
          >
            <FiLogOut size={18}/> Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOPBAR */}
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shrink-0">
          <button className="md:hidden text-gray-600"><FiMenu size={22}/></button>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Panel Central</h1>
            <span className="text-[10px] font-bold text-[#87be00] uppercase tracking-widest">Acceso Root / Nivel Sistema</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar">
          {/* FILTRO GLOBAL (Solo en Dashboard o Locales) */}
          {(isDashboard || isLocales) && (
            <div className="px-8 pt-8">
              <div className="bg-white border border-gray-100 rounded-[2rem] p-5 flex items-center gap-6 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Filtrar por Cliente</span>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 transition min-w-[250px]"
                  >
                    <option value="">Todas las empresas registradas</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {isDashboard && (
            <>
              {/* STATS CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8">
                {stats.map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-5 shadow-sm hover:shadow-md transition-all group">
                    <div className={`p-4 rounded-2xl bg-gray-50 ${s.color} transition-colors group-hover:bg-white`}>{s.icon}</div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{s.label}</p>
                      <p className="text-2xl font-black text-gray-800 tracking-tight">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CHART & MAP SECTION */}
              <div className="px-8 space-y-8 pb-12">
                
                {/* GRÁFICO */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Distribución Geográfica</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" fontSize={9} fontWeight={800} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <YAxis fontSize={9} fontWeight={800} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}} 
                      />
                      <Bar dataKey="locales" fill="#87be00" radius={[8, 8, 8, 8]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* MAPA INTERACTIVO */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Monitor de Cobertura</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LISTA DE LOCALES */}
                    <div className="lg:col-span-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar space-y-3">
                      {filteredLocales.length > 0 ? (
                        filteredLocales.map(local => (
                          <button
                            key={local.id}
                            onClick={() => setSelectedLocalId(local.id)}
                            className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${
                              selectedLocalId === local.id
                                ? "bg-gray-900 text-white border-gray-900 shadow-xl translate-x-1"
                                : "bg-white border-gray-50 hover:border-gray-200 shadow-sm"
                            } ${!local.is_active ? "opacity-50" : ""}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className={`text-sm font-black uppercase tracking-tight ${selectedLocalId === local.id ? "text-white" : "text-gray-800"}`}>
                                {local.cadena}
                              </p>
                              {!local.is_active && (
                                <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">Off</span>
                              )}
                            </div>
                            <p className={`text-[10px] font-bold line-clamp-1 ${selectedLocalId === local.id ? "text-gray-400" : "text-gray-400"}`}>
                              {local.direccion}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${local.is_active ? 'bg-[#87be00]' : 'bg-red-500'}`} />
                                <span className="text-[9px] uppercase font-black tracking-tighter opacity-80">{local.comuna}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                           <Store size={40} strokeWidth={1}/>
                           <p className="text-[10px] font-bold uppercase mt-2">Sin locales en esta red</p>
                        </div>
                      )}
                    </div>

                    {/* MAPA */}
                    <div className="lg:col-span-8 min-h-[500px] rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                      <LocalesMap locales={filteredLocales} selectedLocal={selectedLocal} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VISTAS HIJAS (Outlet) */}
          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
export default RootDashboard