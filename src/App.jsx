import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { Toaster } from "react-hot-toast"

import Login from "./pages/Login"
import ChangePassword from "./pages/auth/ChangePassword"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword from "./pages/auth/ResetPassword"

// --- COMPONENTES GLOBALES ---
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

/* ================= USUARIO (MERCADERISTA) ================= */
import UserDashboard from "./pages/user/UserDashboard"
import UserHome from "./pages/user/UserHome" // Este es el Timeline con calendario
import UserLocales from "./pages/user/UserLocales"
import UserForm from "./pages/user/UserForm" 

/* ================= QUESTIONS ================= */
import QuestionsManager from "./pages/admin/QuestionsManager"

import "./App.css"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

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
            <Route path="questions" element={<QuestionsManager />} />
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
            <Route path="questions" element={<QuestionsManager />} />
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
            {/* 🟢 MEJORA: Definimos UserHome como el index para cargar el Timeline de inmediato */}
            <Route index element={<UserHome />} />
            <Route path="home" element={<UserHome />} />
            
            {/* Si el usuario pincha 'Agenda' en el sidebar, también ve el Timeline con calendario */}
            <Route path="agenda" element={<UserHome />} /> 
            
            <Route path="locales" element={<UserLocales />} />
            <Route path="reporte" element={<UserForm />} />
          </Route>

          {/* FALLBACK SEGURIDAD */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>

      </BrowserRouter>
    </AuthProvider>
  )
}

export default App