import { useState, useEffect } from "react"
import { useNavigate, Outlet, useLocation } from "react-router-dom"
import { FiMenu, FiLogOut } from "react-icons/fi"
import Sidebar from "../../components/Sidebar"
import LocalesMap from "../../components/LocalesMap"
import api from "../../api/apiClient"

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
  const [selectedLocal, setSelectedLocal] = useState(null)

  const navigate = useNavigate()
  const location = useLocation()

  const fetchLocales = async () => {

    try {

      const data = await api.get("/api/locales")

      setLocales(data)

    } catch (error) {

      console.error("Error cargando locales", error)

    }

  }

  useEffect(() => {

    fetchLocales()

  }, [])

  const getPageTitle = () => {

    const path = location.pathname

    if (path.includes("/root/analytics")) return "Dashboard Global"
    if (path.includes("/root/companies")) return "Empresas"
    if (path.includes("/root/users")) return "Usuarios"
    if (path.includes("/root/locales")) return "Locales"

    return "Root Panel"

  }

  const handleLogout = () => {

    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")

  }

  const stats = [
    { label: "Empresas", value: 12 },
    { label: "Locales", value: locales.length },
    { label: "Usuarios", value: 140 },
    { label: "Locales Activos", value: locales.filter(l => l.is_active).length }
  ]

  const chartData = [
    { name: "Ene", users: 30 },
    { name: "Feb", users: 40 },
    { name: "Mar", users: 65 },
    { name: "Abr", users: 80 },
    { name: "May", users: 110 }
  ]

  return (
    <div className="min-h-screen bg-[#f8f9fb] font-[Outfit] flex">

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

      <div className="flex-1 flex flex-col">

        {/* HEADER */}

        <div className="bg-white border-b border-gray-100 px-4 md:px-10 py-5 flex items-center justify-between">

          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-gray-600"
          >
            <FiMenu size={22}/>
          </button>

          <h1 className="text-lg md:text-2xl font-semibold text-gray-900 tracking-tight">
            {getPageTitle()}
          </h1>

          <button
            onClick={handleLogout}
            className="md:hidden text-gray-500 hover:text-red-500 transition"
          >
            <FiLogOut size={20}/>
          </button>

        </div>

        {/* KPI */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 md:p-10">

          {stats.map((s,i)=>(
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >

              <p className="text-sm text-gray-500">
                {s.label}
              </p>

              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {s.value}
              </p>

            </div>
          ))}

        </div>

        {/* CHART */}

        <div className="px-6 md:px-10 pb-10">

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

            <h3 className="text-lg font-semibold mb-4">
              Crecimiento de usuarios
            </h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="users" fill="#111827" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>

          </div>

        </div>

        {/* MAPA + LISTA */}

        <div className="px-6 md:px-10 pb-10">

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

            <h3 className="text-lg font-semibold mb-4">
              Distribución de locales
            </h3>

            <div className="grid grid-cols-12 gap-6">

              {/* LISTA */}

              <div className="col-span-4 max-h-[450px] overflow-y-auto">

                {locales.map(local => (

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

              {/* MAPA */}

              <div className="col-span-8">

                <LocalesMap
                  locales={locales}
                  selectedLocal={selectedLocal}
                />

              </div>

            </div>

          </div>

        </div>

        <div className="flex-1 p-6 md:p-10">
          <Outlet/>
        </div>

      </div>

    </div>
  )

}

export default RootDashboard