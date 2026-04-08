import { useState, useEffect, useMemo } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { FiLogOut, FiLayout } from "react-icons/fi"
import AdminSidebar from "../../components/AdminSidebar" 

// 🔔 IMPORTACIONES PARA NOTIFICACIONES
import Notifications from "../../components/Notifications"
import { useAuth } from "../../context/AuthContext"
import api from "../../api/apiClient"

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // 🔔 ESTADOS PARA NOTIFICACIONES
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true)
      const res = await api.get("/notifications")
      setNotifications(res || [])
    } catch (error) {
      console.error("❌ Error cargando notificaciones:", error.message)
    } finally {
      setLoadingNotifs(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // 🔔 FUNCIÓN PARA MARCAR COMO LEÍDA
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
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-[Outfit]">

      {/* SIDEBAR ADMINISTRATIVO (Sección de branding removida) */}
      <div className="hidden md:flex md:flex-col md:w-72 bg-white border-r border-gray-100 min-h-screen px-8 py-10 shadow-sm z-20">
        
        {/* 🚩 Hemos quitado el div de 'CultivaApp / Panel Administrativo' 
            que estaba aquí para limpiar la interfaz.
        */}
        
        <AdminSidebar />

        <div className="mt-auto pt-6 border-t border-gray-50">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 text-gray-400 hover:text-red-500 hover:bg-red-50 px-6 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest w-full"
          >
            <FiLogOut size={18}/> Cerrar sesión
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOPBAR PREMIUM */}
        <div className="bg-white border-b border-gray-50 px-10 py-6 flex items-center justify-between shrink-0 z-10 shadow-sm">
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-2xl text-gray-800">
               <FiLayout size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Gestión Empresa</h1>
              <span className="text-[10px] font-bold text-[#87be00] uppercase tracking-widest mt-1 italic">Administración de Cliente</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <Notifications 
              notifications={notifications} 
              unreadCount={unreadCount} 
              onMarkAsRead={handleMarkAsRead} 
            />

            <div className="hidden md:flex items-center gap-4 pl-8 border-l border-gray-100">
              <div className="text-right">
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-tighter italic leading-none mb-1">{user?.name || 'Admin User'}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Admin de Cuenta</p>
              </div>
              <div className="h-12 w-12 rounded-[1.2rem] bg-[#87be00]/10 flex items-center justify-center text-[#87be00] font-black text-xs border border-[#87be00]/20 shadow-sm">
                {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENIDO SCROLLABLE CON CONTEXTO */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar p-10">
          
          <Outlet context={{ 
              notifications, 
              setNotifications, 
              handleMarkAsRead, 
              loading: loadingNotifs,
              fetchNotifications
          }} />

        </div>
      </div>
    </div>
  )
}

export default AdminDashboard