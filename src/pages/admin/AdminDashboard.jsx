import { useState, useEffect, useMemo } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { FiLogOut } from "react-icons/fi"
import AdminSidebar from "../../components/AdminSidebar"

// 🔔 IMPORTACIONES PARA NOTIFICACIONES
import Notifications from "../../components/Notifications"
import { useAuth } from "../../context/AuthContext"
import api from "../../api/apiClient"

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // 🔔 ESTADO PARA NOTIFICACIONES
  const [notifications, setNotifications] = useState([])

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications")
      setNotifications(res || [])
    } catch (error) {
      console.error("❌ Error cargando notificaciones:", error.message)
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
    <div className="min-h-screen flex bg-gray-50 font-[Outfit]">

      {/* Sidebar */}
      <AdminSidebar />

      {/* Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOPBAR / HEADER */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0 shadow-sm">
          
          <div className="flex flex-col">
            <h1 className="text-md font-black text-gray-800 uppercase tracking-tighter">Panel Administrativo</h1>
            <span className="text-[9px] font-bold text-[#87be00] uppercase tracking-widest">Gestión de Cliente</span>
          </div>

          <div className="flex items-center gap-6">
            {/* 🔔 COMPONENTE DE NOTIFICACIONES */}
            <Notifications 
              notifications={notifications} 
              unreadCount={unreadCount} 
              onMarkAsRead={handleMarkAsRead} 
            />

            <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>

            <div className="flex items-center gap-4">
               <div className="text-right hidden md:block">
                  <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">{user?.name}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Admin Cliente</p>
               </div>
               
               <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <FiLogOut size={16}/>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </div>

      </div>

    </div>
  )
}

export default AdminDashboard