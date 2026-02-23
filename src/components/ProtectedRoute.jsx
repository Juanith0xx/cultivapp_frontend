import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

const ProtectedRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext)

  // Si no está logueado
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Si tiene rol pero no coincide
  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute