import { useContext } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

const ProtectedRoute = ({ children, role, roles }) => {

  const { user, mustChangePassword } = useContext(AuthContext)
  const location = useLocation()

  /* ===============================
     ❌ NO AUTENTICADO
  =============================== */
  if (!user) {
    return <Navigate to="/" replace />
  }

  /* ===============================
     🔐 FORZAR CAMBIO DE CONTRASEÑA
  =============================== */
  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />
  }

  /* ===============================
     🔒 VALIDACIÓN DE ROLES
  =============================== */

  const allowedRoles = roles || (role ? [role] : null)

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return redirectByRole(user.role)
  }

  return children
}

/* =====================================
   🔁 REDIRECCIÓN INTELIGENTE POR ROL
===================================== */

const redirectByRole = (role) => {

  switch (role) {
    case "ROOT":
      return <Navigate to="/root" replace />
    case "ADMIN_CLIENTE":
      return <Navigate to="/admin" replace />
    case "SUPERVISOR": // 🚀 NUEVO ROL SUPERVISOR
      return <Navigate to="/supervisor" replace />
    case "USUARIO":
      return <Navigate to="/usuario" replace />
    default:
      return <Navigate to="/" replace />
  }

}

export default ProtectedRoute