import { useState } from "react"
import { useNavigate, Outlet, useLocation } from "react-router-dom"
import { FiMenu, FiLogOut } from "react-icons/fi"
import Sidebar from "../../components/Sidebar"

const RootDashboard = () => {

  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  /* ===============================
     Título dinámico según ruta
  =============================== */

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

  return (
    <div className="min-h-screen bg-[#f8f9fb] font-[Outfit] flex">

      {/* ===============================
          SIDEBAR DESKTOP
      =============================== */}

      <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-100 min-h-screen px-6 py-6">

        <Sidebar />

        <div className="mt-auto pt-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition text-sm w-full"
          >
            <FiLogOut size={16} />
            Cerrar sesión
          </button>
        </div>

      </div>

      {/* ===============================
          MAIN AREA
      =============================== */}

      <div className="flex-1 flex flex-col">

        {/* HEADER */}

        <div className="bg-white border-b border-gray-100 px-4 md:px-10 py-5 flex items-center justify-between">

          {/* Botón menú móvil */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-gray-600"
          >
            <FiMenu size={22} />
          </button>

          {/* Título dinámico */}
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900 tracking-tight">
            {getPageTitle()}
          </h1>

          {/* Logout mobile */}
          <button
            onClick={handleLogout}
            className="md:hidden text-gray-500 hover:text-red-500 transition"
          >
            <FiLogOut size={20} />
          </button>

        </div>

        {/* ===============================
            DRAWER MOBILE
        =============================== */}

        {open && (
          <div className="fixed inset-0 z-40 md:hidden">

            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <div className="absolute left-0 top-0 w-72 bg-white h-full px-6 py-6 flex flex-col shadow-2xl">

              <button
                onClick={() => setOpen(false)}
                className="mb-6 text-sm text-gray-400 hover:text-gray-600"
              >
                Cerrar
              </button>

              <Sidebar />

              <div className="mt-auto pt-6 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition text-sm w-full"
                >
                  <FiLogOut size={16} />
                  Cerrar sesión
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ===============================
            CONTENT
        =============================== */}

        <div className="flex-1 p-6 md:p-10">
          <Outlet />
        </div>

      </div>

    </div>
  )
}

export default RootDashboard