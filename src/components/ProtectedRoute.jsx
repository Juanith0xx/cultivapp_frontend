import { useContext } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

const ProtectedRoute = ({ children, role }) => {

  const { user, mustChangePassword } = useContext(AuthContext)
  const location = useLocation()

  // ❌ No autenticado
  if (!user) {
    return <Navigate to="/" replace />
  }

  // 🔐 Si debe cambiar contraseña y no está en esa ruta
  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />
  }

  // 🔒 Si tiene rol requerido y no coincide
  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute