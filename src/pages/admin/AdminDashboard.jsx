import { useState, useEffect, useMemo, useCallback } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { FiLogOut, FiLayout, FiMenu } from "react-icons/fi"
import AdminSidebar from "../../components/AdminSidebar" 
import Notifications from "../../components/Notifications"
import { useAuth } from "../../context/AuthContext"
import api from "../../api/apiClient"
import { supabase } from "../../lib/supabase" // ⚡ Importamos tu cliente de Supabase

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  // 🔔 CARGA INICIAL (API REST)
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

  // ⚡ CONFIGURACIÓN DE REALTIME Y CARGA INICIAL
  useEffect(() => {
    fetchNotifications()

    if (!user?.id) return

    // Suscribirse a cambios en la tabla 'notifications'
    const channel = supabase
      .channel(`realtime-notifications-${user.id}`) // Canal único por usuario
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Solo nos interesan las nuevas
          schema: 'public',
          table: 'notifications',
          filter: `target_user_id=eq.${user.id}` // Filtro: Solo las mías
        },
        (payload) => {
          console.log("🔔 Nueva notificación en tiempo real:", payload.new)
          // Insertamos la nueva notificación al inicio de la lista
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    // Limpiar suscripción al desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchNotifications])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

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

  const handleLogoutAction = async () => {
    await logout()
    navigate("/")
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-[Outfit] text-gray-900">
      
      {/* 📱 OVERLAY MÓVIL */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full px-8 py-10 shadow-sm">
          <div className="mb-10 px-4">
             <span className="text-[10px] font-black text-[#87be00] uppercase tracking-[0.2em]">Panel Administrativo</span>
          </div>
          
          <AdminSidebar />

          <div className="mt-auto pt-6 border-t border-gray-50">
            <button 
              onClick={handleLogoutAction} 
              className="flex items-center gap-3 text-gray-400 hover:text-red-500 hover:bg-red-50 px-6 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest w-full group"
            >
              <FiLogOut size={18} className="group-hover:scale-110 transition-transform"/> 
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOPBAR */}
        <header className="bg-white border-b border-gray-50 px-6 md:px-10 py-6 flex items-center justify-between shrink-0 z-30 shadow-sm">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 md:hidden text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              <FiMenu size={24} />
            </button>

            <div className="hidden sm:flex p-3 bg-gray-50 rounded-2xl text-gray-800">
               <FiLayout size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                Gestión Empresa
              </h1>
              <span className="text-[9px] md:text-[10px] font-bold text-[#87be00] uppercase tracking-widest mt-1 italic">
                {user?.company_name || 'Alaluf Real Estate'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-8">
            <Notifications 
              notifications={notifications} 
              unreadCount={unreadCount} 
              onMarkAsRead={handleMarkAsRead} 
            />

            <div className="hidden md:flex items-center gap-4 pl-8 border-l border-gray-100">
              <div className="text-right">
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-tighter italic leading-none mb-1">
                  {user?.name || 'Usuario Admin'}
                </p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  {user?.role || 'Admin de Cuenta'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-[1.2rem] bg-[#87be00]/10 flex items-center justify-center text-[#87be00] font-black text-xs border border-[#87be00]/20 shadow-sm overflow-hidden">
                {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ 
                notifications, 
                setNotifications, 
                handleMarkAsRead, 
                loading: loadingNotifs,
                fetchNotifications
            }} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard