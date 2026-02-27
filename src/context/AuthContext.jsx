import { createContext, useContext, useState, useEffect } from "react"

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user")
    return storedUser ? JSON.parse(storedUser) : null
  })

  const [mustChangePassword, setMustChangePassword] = useState(
    localStorage.getItem("mustChangePassword") === "true"
  )

  const [isAuthenticated, setIsAuthenticated] = useState(!!token)

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

    localStorage.setItem("mustChangePassword", mustChangePassword ? "true" : "false")
  }, [token, user, mustChangePassword])

  const login = (data) => {
    setToken(data.token)
    if (data.user) setUser(data.user)
    setMustChangePassword(!!data.mustChangePassword) // 👈 camelCase
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setMustChangePassword(false)
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
