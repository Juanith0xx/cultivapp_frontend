import { createContext, useContext, useState, useEffect } from "react"

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  )

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user")
    return storedUser ? JSON.parse(storedUser) : null
  })

  const [mustChangePassword, setMustChangePassword] = useState(() =>
    localStorage.getItem("mustChangePassword") === "true"
  )

  const [isAuthenticated, setIsAuthenticated] = useState(!!token)

  /* =========================================
     SINCRONIZAR ESTADO CON LOCALSTORAGE
  ========================================= */
  useEffect(() => {

    if (token && user) {
      setIsAuthenticated(true)

      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem(
        "mustChangePassword",
        mustChangePassword ? "true" : "false"
      )

    } else {
      setIsAuthenticated(false)

      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("mustChangePassword")
    }

  }, [token, user, mustChangePassword])

  /* =========================================
     LOGIN
  ========================================= */
  const login = (data) => {

    setToken(data.token)
    setUser(data.user)
    setMustChangePassword(!!data.must_change_password)
  }

  /* =========================================
     LOGOUT
  ========================================= */
  const logout = () => {
    setToken(null)
    setUser(null)
    setMustChangePassword(false)
  }

  /* =========================================
     DESPUÉS DE CAMBIAR PASSWORD
  ========================================= */
  const clearMustChangePassword = () => {
    setMustChangePassword(false)
  }

  /* =========================================
     VALIDAR ROLES
  ========================================= */
  const hasRole = (allowedRoles) => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        mustChangePassword,
        login,
        logout,
        hasRole,
        clearMustChangePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/* =========================================
   CUSTOM HOOK
========================================= */
export const useAuth = () => {
  return useContext(AuthContext)
}