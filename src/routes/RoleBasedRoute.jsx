import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, hasRole } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (!hasRole(allowedRoles)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default RoleBasedRoute