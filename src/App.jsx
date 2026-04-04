import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { Toaster } from "react-hot-toast"

// 🚩 IMPORTAMOS EL HOOK DE SINCRONIZACIÓN
import { useOfflineSync } from "./hooks/useOfflineSync"
import { FiCloudOff, FiRefreshCw } from "react-icons/fi"

import Login from "./pages/Login"
import ChangePassword from "./pages/auth/ChangePassword"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword from "./pages/auth/ResetPassword"

// --- COMPONENTE GLOBALES ---
import UserCredential from "./components/UserCredential" 
import ProtectedRoute from "./components/ProtectedRoute"

/* ================= ROOT ================= */
import RootDashboard from "./pages/root/RootDashboard"
import Analytics from "./pages/root/Analytics"
import Companies from "./pages/root/Companies"
import Users from "./pages/root/Users"
import Locales from "./pages/root/Locales"

/* ================= ADMIN CLIENTE ================= */
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminOverview from "./pages/admin/AdminOverview"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminLocales from "./components/AdminLocales"
import AdminRoutes from "./pages/admin/AdminRoutes"
import GpsMonitor from "./pages/admin/GpsMonitor" 

/* ================= NUEVO: AUDITORÍA FOTOGRÁFICA ================= */
import PhotoAuditDashboard from "./components/PhotoAuditDashboard" //

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
      {/* Banner de aviso cuando no hay internet */}
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-orange-500 text-white text-[10px] font-black py-1.5 flex items-center justify-center gap-2 z-[9999] shadow-lg uppercase tracking-widest animate-pulse">
          <FiCloudOff size={14} /> Modo Offline: Los datos se guardarán localmente
        </div>
      )}

      {/* Indicador de que se están subiendo datos pendientes */}
      {syncing && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-3 rounded-2xl shadow-2xl z-[9999] flex items-center gap-3 border border-white/10 animate-bounce">
          <FiRefreshCw size={18} className="animate-spin text-[#87be00]" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Sincronizando Cultivapp...</span>
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        
        {/* 🚩 AGREGAMOS EL MONITOR AQUÍ */}
        <OfflineMonitor />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "#111",
              color: "#fff",
              fontSize: "14px"
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
            {/* 📸 NUEVA RUTA ROOT */}
            <Route path="auditoria-fotos" element={<PhotoAuditDashboard />} />
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
            {/* 📸 NUEVA RUTA ADMIN CLIENTE */}
            <Route path="auditoria-fotos" element={<PhotoAuditDashboard />} />
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
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;