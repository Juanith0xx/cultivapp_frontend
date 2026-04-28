import { useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { FiLogOut } from "react-icons/fi"
import { AiOutlineQrcode } from "react-icons/ai"
import { QRCodeSVG } from "qrcode.react"
import UserSidebar from "../../components/UserSidebar"
import Notifications from "../../components/Notifications"
import { useAuth } from "../../context/AuthContext"
import { useNotificationContext } from "../../context/NotificationContext"

const UserDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  const { notifications, unreadCount, onMarkRead } = useNotificationContext()
  const [showQR, setShowQR] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const shareUrl = user ? `${window.location.origin}/verify/${user.id}` : ""

  /**
   * 🚩 EXTRACCIÓN DE INICIALES CORREGIDA
   * Segura, dinámica y a prueba de datos nulos.
   */
  const getInitials = () => {
    // 1. Si el usuario aún no carga en el contexto, devolvemos un placeholder visual
    if (!user) return "--";

    // 2. Forzamos a que sean Strings para que .trim() y .charAt() nunca fallen
    const fName = String(user.first_name || "").trim();
    const lName = String(user.last_name || "").trim();
    
    // 3. Si tenemos ambos, tomamos la primera letra de cada uno
    if (fName && lName) {
      return `${fName.charAt(0)}${lName.charAt(0)}`.toUpperCase();
    }
    
    // 4. Si solo tiene nombre, tomamos sus primeras dos letras
    if (fName) {
      return fName.substring(0, 2).toUpperCase();
    }
    
    // 5. Fallback final si la base de datos devuelve un usuario sin nombre ni apellido
    return "US"; // (User)
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-[Outfit]">
      
      <UserSidebar />

      <div className="flex-1 p-6 md:p-10 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 shrink-0 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50">
          
          <div className="flex items-center gap-4 pl-4">
            {/* 🎨 Avatar Dinámico */}
            <div className="h-12 w-12 rounded-[1.2rem] bg-[#87be00]/10 flex items-center justify-center text-[#87be00] font-black text-xs border border-[#87be00]/20 shadow-sm overflow-hidden transition-all">
              {getInitials()}
            </div>

            <div>
              <p className="text-[11px] font-black text-gray-900 uppercase italic leading-none">
                Hola, {user?.first_name || 'Colaborador'}
              </p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Panel de Colaborador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <Notifications /> 

            <div className="h-8 w-[1px] bg-gray-100 hidden md:block"></div>

            <button
              onClick={() => setShowQR(!showQR)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                showQR 
                  ? "bg-[#87be00] text-white border-[#87be00]" 
                  : "bg-white text-gray-600 border-gray-100 hover:border-[#87be00] hover:text-[#87be00]"
              }`}
            >
              <AiOutlineQrcode size={18} />
              {showQR ? "Cerrar" : "QR"}
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Cerrar sesión"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>

        {/* QR SECTION */}
        {showQR && user && (
          <div className="mb-8 flex justify-center animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-50 flex flex-col items-center max-w-xs w-full relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-[#87be00]"></div>
              
              <h3 className="text-gray-900 font-black uppercase italic mb-1 text-sm">Tu Identificación</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Acceso CultivaApp</p>
              
              <div className="bg-white p-5 border-[4px] border-[#87be00]/20 rounded-[2.5rem] mb-6 shadow-sm">
                <QRCodeSVG value={shareUrl} size={150} level={"H"} />
              </div>

              <div className="text-center">
                <p className="text-xl font-black text-gray-900 uppercase italic leading-none">
                  {user.first_name} {user.last_name}
                </p>
                <div className="mt-4 flex flex-col gap-1">
                  <span className="text-[8px] font-black text-[#87be00] uppercase tracking-[0.3em] bg-[#87be00]/10 px-4 py-1.5 rounded-full">
                    Socio Activo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTAS DINÁMICAS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-[2.5rem] bg-white shadow-sm border border-gray-50 p-6 md:p-8">
          <Outlet context={{ notifications, unreadCount, onMarkRead }} />
        </div>

      </div>
    </div>
  )
}

export default UserDashboard