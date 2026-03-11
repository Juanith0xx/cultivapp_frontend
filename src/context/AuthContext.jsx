import { createContext, useContext, useState, useEffect } from "react"

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  /* =====================================
     CARGAR SESIÓN DESDE LOCAL STORAGE
  ===================================== */

  useEffect(() => {

    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    const storedPasswordFlag = localStorage.getItem("mustChangePassword")

    if (storedToken) {
      setToken(storedToken)
      setIsAuthenticated(true)
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    if (storedPasswordFlag === "true") {
      setMustChangePassword(true)
    }

    setLoading(false)

  }, [])

  /* =====================================
     SINCRONIZAR LOCAL STORAGE
  ===================================== */

  useEffect(() => {

    if (token) {
      localStorage.setItem("token", token)
      setIsAuthenticated(true)
    } else {
      localStorage.removeItem("token")
      setIsAuthenticated(false)
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
    } else {
      localStorage.removeItem("user")
    }

    localStorage.setItem(
      "mustChangePassword",
      mustChangePassword ? "true" : "false"
    )

  }, [token, user, mustChangePassword])

  /* =====================================
     LOGIN
  ===================================== */

  const login = (data) => {

    setToken(data.token)

    if (data.user) {
      setUser(data.user)
    }

    setMustChangePassword(!!data.mustChangePassword)

  }

  /* =====================================
     LOGOUT
  ===================================== */

  const logout = () => {

    setToken(null)
    setUser(null)
    setMustChangePassword(false)

  }

  /* =====================================
     LIMPIAR FLAG PASSWORD
  ===================================== */

  const clearMustChangePassword = () => {

    setMustChangePassword(false)
    localStorage.setItem("mustChangePassword", "false")

  }

  /* =====================================
     VALIDAR ROLES
  ===================================== */

  const hasRole = (allowedRoles) => {

    if (!user) return false

    return allowedRoles.includes(user.role)

  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
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

export const useAuth = () => useContext(AuthContext)