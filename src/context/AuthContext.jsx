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

  const [isAuthenticated, setIsAuthenticated] = useState(!!token)

  // 🔐 Mantener sincronizado auth state
  useEffect(() => {
    if (token && user) {
      setIsAuthenticated(true)
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
    } else {
      setIsAuthenticated(false)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  }, [token, user])

  // 🚀 Login
  const login = (data) => {
    setToken(data.token)
    setUser(data.user) 
    // data.user debería traer:
    // { id, email, role, companyId }
  }

  // 🚪 Logout limpio
  const logout = () => {
    setToken(null)
    setUser(null)
  }

  // 🛡 Verificar roles
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
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook profesional
export const useAuth = () => {
  return useContext(AuthContext)
}