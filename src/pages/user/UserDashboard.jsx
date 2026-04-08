import { useState, useEffect, useMemo, useCallback } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { FiLogOut } from "react-icons/fi"
import { AiOutlineQrcode } from "react-icons/ai"
import { QRCodeSVG } from "qrcode.react"
import UserSidebar from "../../components/UserSidebar"
import Notifications from "../../components/Notifications" // 🔔 Nuevo componente
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase" // ⚡ Cliente Realtime
import api from "../../api/apiClient"

const UserDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  // 📱 ESTADOS
  const [showQR, setShowQR] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  // 🔔 CARGA INICIAL DE NOTIFICACIONES
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifs(true)
      const res = await api.get("/notifications")
      setNotifications(Array.isArray(res) ? res : res.data || [])
    } catch (error) {
      console.error("❌ Error cargando notificaciones:", error.message)
    } finally {
      setLoadingNotifs(false)
    }
  }, [])

  // ⚡ CONFIGURACIÓN REALTIME
  useEffect(() => {
    fetchNotifications()

    if (!user?.id) return

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `target_user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
          // Opcional: Aquí podrías disparar un sonido de notificación
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchNotifications])

  // LÓGICA DE GESTIÓN
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (err) {
      console.error("Error al marcar como leída", err)
    }
  }

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.is_read).length, 
  [notifications])

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const shareUrl = user ? `${window.location.origin}/verify/${user.id}` : ""

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-[Outfit]">
      
      <UserSidebar />

      <div className="flex-1 p-6 md:p-10 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER CON NOTIFICACIONES Y ACCIONES */}
        <div className="flex justify-between items-center mb-8 shrink-0 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50">
          
          <div className="flex items-center gap-4 pl-4">
            <div className="h-10 w-10 rounded-full bg-[#87be00]/10 flex items-center justify-center text-[#87be00] font-black text-xs border border-[#87be00]/20">
              {user?.first_name?.substring(0, 1)}{user?.last_name?.substring(0, 1)}
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-900 uppercase italic leading-none">Hola, {user?.first_name}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Panel de Colaborador</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* 🔔 COMPONENTE DE NOTIFICACIONES */}
            <Notifications 
              notifications={notifications} 
              unreadCount={unreadCount} 
              onMarkAsRead={handleMarkAsRead} 
            />

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
          <Outlet context={{ 
            notifications, 
            unreadCount, 
            handleMarkAsRead,
            fetchNotifications 
          }} />
        </div>

      </div>
    </div>
  )
}

export default UserDashboard