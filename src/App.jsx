import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"

import Login from "./pages/Login"
import RootDashboard from "./pages/root/RootDashboard"

import Analytics from "./pages/root/Analytics"
import Companies from "./pages/root/Companies"
import Users from "./pages/root/Users"
import Locales from "./pages/root/Locales"

import ProtectedRoute from "./components/ProtectedRoute"

import "./App.css"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ================= LOGIN ================= */}
          <Route path="/" element={<Login />} />

          {/* ================= ROOT LAYOUT ================= */}
          <Route
            path="/root"
            element={
              <ProtectedRoute role="ROOT">
                <RootDashboard />
              </ProtectedRoute>
            }
          >

            {/* Redirección automática a analytics */}
            <Route index element={<Navigate to="analytics" />} />

            {/* Rutas SaaS reales */}
            <Route path="analytics" element={<Analytics />} />
            <Route path="companies" element={<Companies />} />
            <Route path="users" element={<Users />} />
            <Route path="locales" element={<Locales />} />

          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App