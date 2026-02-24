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
    <div className="min-h-screen bg-gray-100 font-[Outfit] flex">

      {/* ===============================
          SIDEBAR DESKTOP
      =============================== */}

      <div className="hidden md:flex md:flex-col md:w-64 bg-white shadow-md min-h-screen p-4">

        <Sidebar />

        <div className="mt-auto pt-6 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition text-sm w-full"
          >
            <FiLogOut size={18} />
            Cerrar sesión
          </button>
        </div>

      </div>

      {/* ===============================
          MAIN AREA
      =============================== */}

      <div className="flex-1 flex flex-col">

        {/* HEADER (MOBILE + DESKTOP TOP BAR) */}

        <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center justify-between">

          {/* Botón menú móvil */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden"
          >
            <FiMenu size={22} />
          </button>

          {/* Título dinámico */}
          <h1 className="text-lg md:text-xl font-semibold text-gray-800">
            {getPageTitle()}
          </h1>

          {/* Logout (mobile visible) */}
          <button
            onClick={handleLogout}
            className="md:hidden text-red-500"
          >
            <FiLogOut size={20} />
          </button>

        </div>

        {/* ===============================
            DRAWER MOBILE
        =============================== */}

        {open && (
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden">
            <div className="w-64 bg-white h-full p-4 flex flex-col">

              <button
                onClick={() => setOpen(false)}
                className="mb-4 text-sm text-gray-500"
              >
                Cerrar
              </button>

              <Sidebar />

              <div className="mt-auto pt-6 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition text-sm w-full"
                >
                  <FiLogOut size={18} />
                  Cerrar sesión
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ===============================
            CONTENT
        =============================== */}

        <div className="flex-1 p-4 md:p-8">
          <Outlet />
        </div>

      </div>

    </div>
  )
}

export default RootDashboard