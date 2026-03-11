import { Outlet, useNavigate } from "react-router-dom"
import { FiLogOut } from "react-icons/fi"
import { AiOutlineQrcode } from "react-icons/ai" // Icono de QR más estable
import { QRCodeSVG } from "qrcode.react"
import { useState, useEffect } from "react"
import UserSidebar from "../../components/UserSidebar"

const UserDashboard = () => {
  const navigate = useNavigate()
  const [showQR, setShowQR] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  // URL para el QR: apunta a la vista de credencial pública que creamos
  const shareUrl = user ? `${window.location.origin}/verify/${user.id}` : ""

  return (
    <div className="min-h-screen flex bg-gray-100 font-[Outfit]">
      
      {/* Sidebar */}
      <UserSidebar />

      {/* Content */}
      <div className="flex-1 p-6">
        
        {/* Header con Botones de Acción */}
        <div className="flex justify-end items-center gap-4 mb-6">
          
          {/* Botón Mi Credencial */}
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 bg-white text-[#87be00] px-4 py-2 rounded-lg shadow-sm text-sm font-bold border border-[#87be00] hover:bg-[#87be00] hover:text-white transition-all duration-300"
          >
            <AiOutlineQrcode size={20} />
            {showQR ? "Ocultar QR" : "Mi Credencial QR"}
          </button>

          {/* Botón Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 text-sm hover:text-red-600 font-medium transition"
          >
            <FiLogOut />
            Cerrar sesión
          </button>
        </div>

        {/* Contenedor del QR (se muestra al hacer click) */}
        {showQR && user && (
          <div className="mb-8 flex justify-center animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center max-w-xs w-full">
              <h3 className="text-gray-800 font-bold mb-1">Tu Identificación</h3>
              <p className="text-xs text-gray-500 mb-4">Escanea para verificar perfil</p>
              
              <div className="bg-white p-3 border-4 border-[#87be00] rounded-xl mb-4">
                <QRCodeSVG 
                  value={shareUrl} 
                  size={160}
                  level={"H"} // Alta capacidad de corrección de errores
                  includeMargin={false}
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">{user.first_name} {user.last_name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Colaborador Autorizado</p>
              </div>
            </div>
          </div>
        )}

        {/* Vistas anidadas */}
        <div className="bg-white rounded-xl shadow-sm min-h-[calc(100vh-160px)] p-4">
          <Outlet />
        </div>

      </div>

    </div>
  )
}

export default UserDashboard