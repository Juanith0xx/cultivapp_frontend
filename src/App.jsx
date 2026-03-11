import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { Toaster } from "react-hot-toast"

import Login from "./pages/Login"
import ChangePassword from "./pages/auth/ChangePassword"
import ForgotPassword from "./pages/auth/ForgotPassword"
import ResetPassword from "./pages/auth/ResetPassword"

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

/* ================= USUARIO ================= */
import UserDashboard from "./pages/user/UserDashboard"
import UserHome from "./pages/user/UserHome"
import UserLocales from "./pages/user/UserLocales"
import UserRoutes from "./pages/user/UserRoutes"
import UserForm from "./pages/user/UserForm"

/* ================= QUESTIONS ================= */
import QuestionsManager from "./pages/admin/QuestionsManager"

import ProtectedRoute from "./components/ProtectedRoute"

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

          {/* LOGIN */}
          <Route path="/" element={<Login />} />

          {/* RECUPERAR CONTRASEÑA */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* CAMBIO DE CONTRASEÑA */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* ================= ROOT ================= */}
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

          {/* ================= ADMIN CLIENTE ================= */}
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
            <Route path="questions" element={<QuestionsManager />} />
          </Route>

          {/* ================= USUARIO ================= */}
          <Route
            path="/usuario"
            element={
              <ProtectedRoute role="USUARIO">
                <UserDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserHome />} />
            <Route path="locales" element={<UserLocales />} />
            <Route path="routes" element={<UserRoutes />} />
            <Route path="form" element={<UserForm />} />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>

      </BrowserRouter>
    </AuthProvider>
  )
}

export default App