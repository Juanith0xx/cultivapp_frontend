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

  const navigate = useNavigate()
  const location = useLocation()

  const isDashboard = location.pathname.includes("/root/analytics")
  const isLocales = location.pathname.includes("/root/locales")

  const fetchData = async () => {
    try {
      const [localesData, companiesData, usersData] = await Promise.all([
        api.get("/api/locales"),
        api.get("/api/companies"),
        api.get("/api/users")
      ])
      setLocales(localesData || [])
      setCompanies(companiesData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error("Error cargando dashboard", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
    { label: "Empresas", value: selectedCompany ? 1 : companies.length, icon: <Building2 size={20}/> },
    { label: "Total Locales", value: filteredLocales.length, icon: <Store size={20}/> },
    { label: "Usuarios", value: filteredUsers.length, icon: <Users size={20}/> },
    { label: "Activos Ahora", value: filteredLocales.filter(l => l.is_active).length, icon: <MapPin size={20}/> }
  ]

  const chartData = useMemo(() => {
    const counts = filteredLocales.reduce((acc, local) => {
      const region = local.region || "Sin región"
      acc[region] = (acc[region] || 0) + 1
      return acc
    }, {})
    return Object.keys(counts).map(name => ({ name, locales: counts[name] }))
  }, [filteredLocales])

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-100 min-h-screen px-6 py-6">
        <Sidebar />
        <div className="mt-auto pt-6 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition text-sm w-full font-medium">
            <FiLogOut size={16}/> Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between shrink-0">
          <button className="md:hidden text-gray-600"><FiMenu size={22}/></button>
          <h1 className="text-xl font-semibold text-gray-900 uppercase tracking-tight text-sm">Panel de Control Root</h1>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f8f9fb]">
          {(isDashboard || isLocales) && (
            <div className="px-6 pt-6">
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase">Filtrar Empresa:</span>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black transition min-w-[200px]"
                >
                  <option value="">Todas las empresas</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {isDashboard && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
                {stats.map((s, i) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className="bg-gray-50 p-3 rounded-lg text-gray-700">{s.icon}</div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{s.label}</p>
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 mb-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Locales por región</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="locales" fill="#000000" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="px-6 pb-10">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Mapa de Cobertura</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LISTA LATERAL ACTUALIZADA */}
                    <div className="lg:col-span-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                      {filteredLocales.length > 0 ? (
                        filteredLocales.map(local => (
                          <button
                            key={local.id}
                            onClick={() => setSelectedLocalId(local.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              selectedLocalId === local.id
                                ? "bg-black text-white border-black"
                                : "bg-white border-gray-100 hover:border-gray-300 shadow-sm"
                            } ${!local.is_active ? "opacity-50 grayscale-[0.5]" : ""}`}
                          >
                            <div className="flex justify-between items-start">
                              <p className={`font-bold ${selectedLocalId === local.id ? "text-white" : "text-gray-900"}`}>
                                {local.cadena}
                              </p>
                              {!local.is_active && (
                                <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase">Deshabilitado</span>
                              )}
                            </div>
                            <p className={`text-xs truncate ${selectedLocalId === local.id ? "text-gray-300" : "text-gray-500"}`}>{local.direccion}</p>
                            <div className="flex items-center gap-1 mt-2">
                                <div className={`w-2 h-2 rounded-full ${local.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-[10px] uppercase font-medium opacity-70">{local.comuna}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-10 text-sm">No se encontraron locales.</p>
                      )}
                    </div>
                    <div className="lg:col-span-8 min-h-[400px] rounded-xl overflow-hidden border border-gray-100">
                      <LocalesMap locales={filteredLocales} selectedLocal={selectedLocal} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RootDashboard