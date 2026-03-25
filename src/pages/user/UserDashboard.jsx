import { Outlet, useNavigate } from "react-router-dom"
import { FiLogOut } from "react-icons/fi"
import { AiOutlineQrcode } from "react-icons/ai"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"
import UserSidebar from "../../components/UserSidebar"
// 🚩 Importamos el contexto de autenticación
import { useAuth } from "../../context/AuthContext"

const UserDashboard = () => {
  const navigate = useNavigate()
  const [showQR, setShowQR] = useState(false)
  
  // 🚩 Obtenemos el usuario y la función de logout del contexto global
  const { user, logout } = useAuth()

  const handleLogout = () => {
    // 🚩 Usamos la función logout del contexto para limpiar TODO
    logout()
    navigate("/")
  }

  // URL para el QR: apunta a la vista de credencial pública
  const shareUrl = user ? `${window.location.origin}/verify/${user.id}` : ""

  return (
    <div className="min-h-screen flex bg-gray-100 font-[Outfit]">
      
      {/* Sidebar - Mantiene la navegación lateral */}
      <UserSidebar />

      {/* Content - Área principal de trabajo */}
      <div className="flex-1 p-6">
        
        {/* Header con Botones de Acción */}
        <div className="flex justify-end items-center gap-4 mb-6">
          
          {/* Botón Mi Credencial */}
          <button
            onClick={() => setShowQR(!showQR)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm text-sm font-bold border transition-all duration-300 ${
              showQR 
                ? "bg-[#87be00] text-white border-[#87be00]" 
                : "bg-white text-[#87be00] border-[#87be00] hover:bg-gray-50"
            }`}
          >
            <AiOutlineQrcode size={20} />
            {showQR ? "Ocultar QR" : "Mi Credencial QR"}
          </button>

          {/* Botón Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 text-sm hover:text-red-700 font-black uppercase tracking-tighter transition-colors"
          >
            <FiLogOut size={18} />
            Cerrar sesión
          </button>
        </div>

        {/* Contenedor del QR (se muestra al hacer click) */}
        {showQR && user && (
          <div className="mb-8 flex justify-center animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col items-center max-w-xs w-full">
              <h3 className="text-gray-900 font-black uppercase italic mb-1">Tu Identificación</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Escanea para verificar perfil</p>
              
              <div className="bg-white p-4 border-[6px] border-[#87be00] rounded-[2rem] mb-4 shadow-inner">
                <QRCodeSVG 
                  value={shareUrl} 
                  size={160}
                  level={"H"} 
                  includeMargin={false}
                />
              </div>

              <div className="text-center">
                <p className="text-lg font-black text-gray-900 uppercase italic leading-none">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-[9px] font-black text-[#87be00] uppercase tracking-[0.2em] mt-2 bg-[#87be00]/10 px-3 py-1 rounded-full">
                  Colaborador Autorizado
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vistas anidadas (Aquí se renderiza el WorkerCalendar o VisitFlow) */}
        <div className="bg-white rounded-[2.5rem] shadow-sm min-h-[calc(100vh-160px)] p-6 border border-gray-50">
          <Outlet />
        </div>

      </div>

    </div>
  )
}

export default UserDashboard