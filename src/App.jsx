import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { Toaster } from "react-hot-toast"

// --- HOOKS ---
import { useOfflineSync } from "./hooks/useOfflineSync"
import { useNotifications } from "./hooks/useNotifications" // 🔔 Hook de Realtime
import { FiCloudOff, FiRefreshCw } from "react-icons/fi"

// --- AUTH PAGES ---
import Login from "./pages/Login"
import ChangePassword from "./pages/auth/ChangePassword"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword from "./pages/auth/ResetPassword"

// --- COMPONENTE GLOBALES ---
import UserCredential from "./components/UserCredential" 
import ProtectedRoute from "./components/ProtectedRoute"
// 🔔 NUEVO: Importación del Layout de Notificaciones
import NotificationsLayout from "./components/NotificationsLayout" 

/* ================= ROOT ================= */
import RootDashboard from "./pages/root/RootDashboard"
import Analytics from "./pages/root/Analytics"
import Companies from "./pages/root/Companies"
import Users from "./pages/root/Users"
import Locales from "./pages/root/Locales"
import NotificationManager from "./pages/root/NotificationManager" // 🔔 Nuevo: Gestor de envíos

/* ================= ADMIN CLIENTE ================= */
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminOverview from "./pages/admin/AdminOverview"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminLocales from "./components/AdminLocales"
import AdminRoutes from "./pages/admin/AdminRoutes"
import GpsMonitor from "./pages/admin/GpsMonitor" 

/* ================= AUDITORÍA FOTOGRÁFICA ================= */
import PhotoAuditDashboard from "./components/PhotoAuditDashboard"

/* ================= USUARIO (MERCADERISTA) ================= */
import UserDashboard from "./pages/user/UserDashboard"
import UserHome from "./pages/user/UserHome" 
import UserLocales from "./pages/user/UserLocales"
import VisitFlow from "./pages/user/VisitFlow" 

/* ================= QUESTIONS ================= */
import QuestionsManager from "./pages/admin/QuestionsManager"

import "./App.css"

// 🚩 COMPONENTE DE MONITOREO OFFLINE
const OfflineMonitor = () => {
  const { isOnline, syncing } = useOfflineSync();

  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-orange-500 text-white text-[10px] font-black py-1.5 flex items-center justify-center gap-2 z-[9999] shadow-lg uppercase tracking-widest animate-pulse">
          <FiCloudOff size={14} /> Modo Offline: Los datos se guardarán localmente
        </div>
      )}

      {syncing && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-3 rounded-2xl shadow-2xl z-[9999] flex items-center gap-3 border border-white/10 animate-bounce">
          <FiRefreshCw size={18} className="animate-spin text-[#87be00]" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Sincronizando Cultivapp...</span>
        </div>
      )}
    </>
  );
};

// 🔔 COMPONENTE DE ESCUCHA DE NOTIFICACIONES (REALTIME)
const NotificationListener = () => {
  const { user } = useAuth(); 
  
  // Activa la escucha de Supabase para mostrar Toasts instantáneos
  useNotifications(user);

  return null; 
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        
        <OfflineMonitor />
        <NotificationListener />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              borderRadius: "12px",
              background: "#111",
              color: "#fff",
              fontSize: "14px",
              border: "1px solid #333"
            },
            success: {
                iconTheme: {
                  primary: '#87be00',
                  secondary: '#fff',
                },
            }
          }}
        />

        <Routes>
          {/* ================= RUTAS PÚBLICAS ================= */}
          <Route path="/" element={<Login />} />
          <Route path="/verify/:id" element={<UserCredential />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* ================= SECCIÓN ROOT ================= */}
          <Route
            path="/root"
            element={
              <ProtectedRoute role="ROOT">
                <RootDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="analytics" />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="companies" element={<Companies />} />
            <Route path="users" element={<Users />} />
            <Route path="locales" element={<Locales />} />
            <Route path="planificacion" element={<AdminRoutes />} /> 
            <Route path="gps" element={<GpsMonitor />} /> 
            <Route path="questions" element={<QuestionsManager />} />
            <Route path="auditoria-fotos" element={<PhotoAuditDashboard />} />
            
            {/* 🔔 Gestor de envíos */}
            <Route path="notification-manager" element={<NotificationManager />} />
            {/* 🔔 NUEVO: Vista de centro de alertas para ROOT */}
            <Route path="notifications" element={<NotificationsLayout userRole="ROOT" />} />
          </Route>

          {/* ================= SECCIÓN ADMIN CLIENTE ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN_CLIENTE">
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="locales" element={<AdminLocales />} />
            <Route path="routes" element={<AdminRoutes />} />
            <Route path="gps" element={<GpsMonitor />} /> 
            <Route path="questions" element={<QuestionsManager />} />
            <Route path="auditoria-fotos" element={<PhotoAuditDashboard />} />
            
            <Route path="notification-manager" element={<NotificationManager />} />
            {/* 🔔 NUEVO: Vista de centro de alertas para ADMIN */}
            <Route path="notifications" element={<NotificationsLayout userRole="ADMIN" />} />
          </Route>

          {/* ================= SECCIÓN USUARIO (MERCADERISTA) ================= */}
          <Route
            path="/usuario"
            element={
              <ProtectedRoute role="USUARIO">
                <UserDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserHome />} />
            <Route path="home" element={<UserHome />} />
            <Route path="agenda" element={<UserHome />} /> 
            <Route path="locales" element={<UserLocales />} />
            <Route path="reporte/:id" element={<VisitFlow />} />
            
            {/* 🔔 NUEVO: Vista de centro de alertas para MERCADERISTA */}
            <Route path="notifications" element={<NotificationsLayout userRole="MERCADERISTA" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;