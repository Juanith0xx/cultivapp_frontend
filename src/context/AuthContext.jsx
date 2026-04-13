import { createContext, useContext, useState, useEffect } from "react"

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true) // 🚩 Mantenemos el estado de carga

  /* =====================================
     CARGAR SESIÓN DESDE LOCAL STORAGE
  ===================================== */
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem("token")
        const storedUser = localStorage.getItem("user")
        const storedPasswordFlag = localStorage.getItem("mustChangePassword")

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          setIsAuthenticated(true)
          
          if (storedPasswordFlag === "true") {
            setMustChangePassword(true)
          }
        }
      } catch (error) {
        console.error("❌ Error recuperando sesión:", error)
        // Si hay error de parsing, limpiamos para evitar bloqueos
        localStorage.clear()
      } finally {
        setLoading(false); // 🚩 IMPORTANTE: Solo aquí termina la carga
      }
    }

    initAuth()
  }, [])

  /* =====================================
     SINCRONIZAR LOCAL STORAGE
  ===================================== */
  useEffect(() => {
    if (token && user) {
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("mustChangePassword", mustChangePassword ? "true" : "false")
      setIsAuthenticated(true)
    }
  }, [token, user, mustChangePassword])

  /* =====================================
     LOGIN
  ===================================== */
  const login = (data) => {
    setToken(data.token)
    setUser(data.user)
    setMustChangePassword(!!data.mustChangePassword)
    setIsAuthenticated(true)
    
    // Guardado inmediato para evitar desincronización en el primer render
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    localStorage.setItem("mustChangePassword", !!data.mustChangePassword ? "true" : "false")
  }

  /* =====================================
     LOGOUT
  ===================================== */
  const logout = () => {
    setToken(null)
    setUser(null)
    setMustChangePassword(false)
    setIsAuthenticated(false)
    localStorage.clear()
  }

  const clearMustChangePassword = () => {
    setMustChangePassword(false)
    localStorage.setItem("mustChangePassword", "false")
  }

  const hasRole = (allowedRoles) => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading, // 🚩 Debemos usar esto en App.jsx o ProtectedRoute
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