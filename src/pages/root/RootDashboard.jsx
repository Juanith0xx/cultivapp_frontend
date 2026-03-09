import { useState, useEffect } from "react"
import { useNavigate, Outlet, useLocation } from "react-router-dom"
import { FiMenu, FiLogOut } from "react-icons/fi"
import Sidebar from "../../components/Sidebar"
import LocalesMap from "../../components/LocalesMap"
import api from "../../api/apiClient"

import {
  Building2,
  Store,
  Users,
  MapPin
} from "lucide-react"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

const RootDashboard = () => {

  const [open, setOpen] = useState(false)

  const [locales, setLocales] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])

  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedLocal, setSelectedLocal] = useState(null)

  const navigate = useNavigate()
  const location = useLocation()

  /* =============================
     DETECTAR SECCIÓN
  ============================= */

  const isDashboard = location.pathname.includes("/root/analytics")
  const isCompanies = location.pathname.includes("/root/companies")
  const isUsers = location.pathname.includes("/root/users")
  const isLocales = location.pathname.includes("/root/locales")

  /* =============================
     FETCH DATA
  ============================= */

  const fetchData = async () => {

    try {

      const [localesData, companiesData, usersData] = await Promise.all([
        api.get("/api/locales"),
        api.get("/api/companies"),
        api.get("/api/users")
      ])

      setLocales(localesData)
      setCompanies(companiesData)
      setUsers(usersData)

    } catch (error) {

      console.error("Error cargando dashboard", error)

    }

  }

  useEffect(() => {
    fetchData()
  }, [])

  /* =============================
     FILTRO EMPRESA
  ============================= */

  const filteredLocales = selectedCompany
    ? locales.filter(l => l.company_id === selectedCompany)
    : locales

  const filteredUsers = selectedCompany
    ? users.filter(u => u.company_id === selectedCompany)
    : users

  /* =============================
     TITULO
  ============================= */

  const getPageTitle = () => {

    const path = location.pathname

    if (path.includes("/root/analytics")) return "Dashboard"
    if (path.includes("/root/companies")) return "Empresas"
    if (path.includes("/root/users")) return "Usuarios"
    if (path.includes("/root/locales")) return "Locales"

    return "Panel"

  }

  /* =============================
     LOGOUT
  ============================= */

  const handleLogout = () => {

    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")

  }

  /* =============================
     KPI
  ============================= */

  const stats = [
    {
      label: "Empresas",
      value: selectedCompany ? 1 : companies.length,
      icon: <Building2 size={20}/>
    },
    {
      label: "Locales",
      value: filteredLocales.length,
      icon: <Store size={20}/>
    },
    {
      label: "Usuarios",
      value: filteredUsers.length,
      icon: <Users size={20}/>
    },
    {
      label: "Activos",
      value: filteredLocales.filter(l => l.is_active).length,
      icon: <MapPin size={20}/>
    }
  ]

  /* =============================
     CHART REGIONES
  ============================= */

  const chartData = Object.values(
    filteredLocales.reduce((acc, local) => {

      if (!acc[local.region]) {
        acc[local.region] = { name: local.region, locales: 0 }
      }

      acc[local.region].locales += 1

      return acc

    }, {})
  )

  /* =============================
     LOCALES POR EMPRESA
  ============================= */

  const localesPorEmpresa = Object.values(
    filteredLocales.reduce((acc, local) => {

      if (!acc[local.company_id]) {

        const company = companies.find(c => c.id === local.company_id)

        acc[local.company_id] = {
          name: company?.name || "Empresa",
          total: 0
        }

      }

      acc[local.company_id].total += 1

      return acc

    }, {})
  )

  /* =============================
     USERS POR ROL
  ============================= */

  const usersByRole = Object.values(
    filteredUsers.reduce((acc, user) => {

      if (!acc[user.role]) {
        acc[user.role] = { role: user.role, total: 0 }
      }

      acc[user.role].total += 1

      return acc

    }, {})
  )

  return (

    <div className="min-h-screen bg-[#f8f9fb] flex">

      {/* SIDEBAR */}

      <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-100 min-h-screen px-6 py-6">

        <Sidebar />

        <div className="mt-auto pt-6 border-t border-gray-100">

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition text-sm w-full"
          >
            <FiLogOut size={16}/>
            Cerrar sesión
          </button>

        </div>

      </div>

      {/* MAIN */}

      <div className="flex-1 flex flex-col">

        {/* HEADER */}

        <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">

          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-gray-600"
          >
            <FiMenu size={22}/>
          </button>

          <h1 className="text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>

        </div>

        {/* FILTRO EMPRESA */}

        {isDashboard && (

        <div className="px-6 pt-6">

          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">

            <span className="text-sm text-gray-500">
              Filtrar empresa
            </span>

            <select
              value={selectedCompany}
              onChange={(e)=>setSelectedCompany(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >

              <option value="">
                Todas las empresas
              </option>

              {companies.map(c=>(
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}

            </select>

          </div>

        </div>

        )}

        {/* KPI */}

        {isDashboard && (

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">

          {stats.map((s,i)=>(

            <div
              key={i}
              className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4"
            >

              <div className="bg-gray-100 p-3 rounded-lg">
                {s.icon}
              </div>

              <div>

                <p className="text-sm text-gray-500">
                  {s.label}
                </p>

                <p className="text-xl font-semibold">
                  {s.value}
                </p>

              </div>

            </div>

          ))}

        </div>

        )}

        {/* CHART */}

        {(isDashboard || isLocales) && (

        <div className="px-6 pb-10">

          <div className="bg-white p-6 rounded-xl border border-gray-100">

            <h3 className="text-lg font-semibold mb-4">
              Locales por región
            </h3>

            <ResponsiveContainer width="100%" height={260}>

              <BarChart data={chartData}>
                <XAxis dataKey="name"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="locales" fill="#111827" radius={[6,6,0,0]} />
              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        )}

        {/* MAPA */}

        {(isDashboard || isLocales) && (

        <div className="px-6 pb-10">

          <div className="bg-white p-6 rounded-xl border border-gray-100">

            <h3 className="text-lg font-semibold mb-4">
              Distribución de locales
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              <div className="lg:col-span-4 max-h-[450px] overflow-y-auto">

                {filteredLocales.map(local => (

                  <button
                    key={local.id}
                    onClick={() => setSelectedLocal(local)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition ${
                      selectedLocal?.id === local.id
                        ? "bg-gray-200"
                        : "hover:bg-gray-100"
                    }`}
                  >

                    <p className="font-medium">
                      {local.cadena}
                    </p>

                    <p className="text-sm text-gray-500">
                      {local.direccion}
                    </p>

                    <p className="text-xs text-gray-400">
                      {local.comuna}
                    </p>

                  </button>

                ))}

              </div>

              <div className="lg:col-span-8">

                <LocalesMap
                  locales={filteredLocales}
                  selectedLocal={selectedLocal}
                />

              </div>

            </div>

          </div>

        </div>

        )}

        <div className="flex-1 p-6">
          <Outlet/>
        </div>

      </div>

    </div>

  )

}

export default RootDashboard