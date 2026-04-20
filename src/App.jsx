import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { NotificationProvider } from "./context/NotificationContext" 
import { Toaster } from "react-hot-toast"

// --- HOOKS ---
import { useOfflineSync } from "./hooks/useOfflineSync"
import { FiCloudOff, FiRefreshCw } from "react-icons/fi"

// --- AUTH PAGES ---
import Login from "./pages/Login"
import ChangePassword from "./pages/auth/ChangePassword"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword from "./pages/auth/ResetPassword"

// --- COMPONENTES GLOBALES ---
import UserCredential from "./components/UserCredential" 
import ProtectedRoute from "./components/ProtectedRoute"
import NotificationsLayout from "./components/NotificationsLayout" 

/* ================= ROOT ================= */
import RootDashboard from "./pages/root/RootDashboard"
import Analytics from "./pages/root/Analytics"
import Companies from "./pages/root/Companies"
import Users from "./pages/root/Users"
import Locales from "./pages/root/Locales"
import NotificationManager from "./pages/root/NotificationManager"
import TurnosManager from "./pages/root/TurnosManager"

/* ================= ADMIN CLIENTE ================= */
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminOverview from "./pages/admin/AdminOverview"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminLocales from "./components/AdminLocales"
import AdminRoutes from "./pages/admin/AdminRoutes"
import GpsMonitor from "./pages/admin/GpsMonitor" 

/* ================= AUDITORÍA FOTOGRÁFICA ================= */
import PhotoAuditDashboard from "./components/PhotoAuditDashboard"

/* ================= SUPERVISOR ================= */
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard"
import SupervisorPanel from "./pages/supervisor/SupervisorPanel"
import LiveMap from "./pages/supervisor/LiveMap"
import AlertManager from "./pages/supervisor/AlertManager"
import AttendanceControl from "./pages/supervisor/AttendanceControl"
import PhotoValidation from "./pages/supervisor/PhotoValidation"
import SupervisorAlertsHistory from "./pages/supervisor/SupervisorAlertsHistory" 

/* ================= USUARIO (MERCADERISTA) ================= */
import UserDashboard from "./pages/user/UserDashboard"
import UserHome from "./pages/user/UserHome" 
import UserLocales from "./pages/user/UserLocales"
import VisitFlow from "./pages/user/VisitFlow" 
import UserAgenda from "./pages/user/UserAgenda" // 🚩 VERIFICAR QUE EL ARCHIVO SE LLAME EXACTAMENTE ASÍ

/* ================= QUESTIONS ================= */
import QuestionsManager from "./pages/admin/QuestionsManager"

import "./App.css"

const OfflineMonitor = () => {
  const { isOnline, syncing } = useOfflineSync();
  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-orange-500 text-white text-[10px] font-black py-1.5 flex items-center justify-center gap-2 z-[9999] shadow-lg uppercase tracking-widest animate-pulse">
          <FiCloudOff size={14} /> Modo Offline
        </div>
      )}
      {syncing && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-3 rounded-2xl shadow-2xl z-[9999] flex items-center gap-3 border border-white/10 animate-bounce">
          <FiRefreshCw size={18} className="animate-spin text-[#87be00]" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Sincronizando...</span>
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider> 
        <BrowserRouter>
          <OfflineMonitor />
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Login />} />
            {/* ... otras rutas públicas ... */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

            {/* SECCIÓN USUARIO */}
            <Route path="/usuario" element={<ProtectedRoute role="USUARIO"><UserDashboard /></ProtectedRoute>}>
              <Route index element={<UserHome />} />
              <Route path="home" element={<UserHome />} />
              <Route path="agenda" element={<UserAgenda />} /> 
              <Route path="locales" element={<UserLocales />} />
              <Route path="reporte/:id" element={<VisitFlow />} />
              <Route path="notifications" element={<NotificationsLayout userRole="MERCADERISTA" />} />
            </Route>

            {/* SECCIÓN SUPERVISOR */}
            <Route path="/supervisor" element={<ProtectedRoute role="SUPERVISOR"><SupervisorDashboard /></ProtectedRoute>}>
              <Route index element={<SupervisorPanel />} />
              <Route path="trazabilidad-alertas" element={<SupervisorAlertsHistory />} />
              <Route path="mapa" element={<LiveMap />} />
              <Route path="alertas" element={<AlertManager />} />
              <Route path="asistencia" element={<AttendanceControl />} />
              <Route path="ejecucion" element={<PhotoValidation />} />
              <Route path="notificaciones" element={<NotificationsLayout userRole="SUPERVISOR" />} />
            </Route>

            {/* SECCIÓN ADMIN */}
            <Route path="/admin" element={<ProtectedRoute role="ADMIN_CLIENTE"><AdminDashboard /></ProtectedRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="locales" element={<AdminLocales />} />
              <Route path="turnos" element={<TurnosManager />} />
              <Route path="routes" element={<AdminRoutes />} />
              <Route path="notifications" element={<NotificationsLayout userRole="ADMIN" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App;