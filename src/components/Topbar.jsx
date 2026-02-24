import { useContext, useState, useRef, useEffect } from "react"
import { AuthContext } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { FiLogOut, FiUser } from "react-icons/fi"

const Topbar = () => {
  const { logout, user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate("/", { replace: true })
  }

  // Cerrar dropdown si se hace click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="bg-white border-b px-4 md:px-8 py-4 flex justify-between items-center">

      {/* Título */}
      <h1 className="text-lg md:text-xl font-semibold text-gray-800">
        Dashboard Root
      </h1>

      {/* Usuario */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 
                     px-3 py-2 rounded-xl transition text-sm"
        >
          <FiUser />
          <span className="hidden sm:inline">{user?.name}</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border p-2 z-50">

            <div className="px-3 py-2 text-sm text-gray-600 border-b mb-2">
              {user?.name}
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm 
                         text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <FiLogOut />
              Cerrar sesión
            </button>

          </div>
        )}

      </div>

    </div>
  )
}

export default Topbar