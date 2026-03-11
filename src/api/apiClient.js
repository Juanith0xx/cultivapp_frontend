const API_URL = import.meta.env.VITE_API_URL

const getToken = () => {
  return localStorage.getItem("token")
}

const request = async (endpoint, options = {}) => {
  const token = getToken()

  // 1. Verificación básica: Si no hay token, podrías evitar la petición (opcional)
  // if (!token) console.warn("No hay token disponible para la petición a:", endpoint);

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config)
    const contentType = response.headers.get("content-type")
    
    let data = null
    if (contentType && contentType.includes("application/json")) {
      data = await response.json()
    }

    // 2. Manejo específico del error 401 (No autorizado)
    if (response.status === 401) {
      console.error("Sesión expirada o token inválido. Redirigiendo...")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // Redirigir solo si estamos en el navegador
      if (window.location.pathname !== "/") {
        window.location.href = "/" 
      }
      throw new Error("No autorizado")
    }

    if (!response.ok) {
      throw new Error(data?.message || `Error ${response.status}: ${response.statusText}`)
    }

    return data

  } catch (error) {
    console.error("API Error:", error.message)
    throw error
  }
}

const api = {
  get: (endpoint) => request(endpoint, { method: "GET" }),

  post: (endpoint, body) => request(endpoint, {
    method: "POST",
    body: JSON.stringify(body)
  }),

  patch: (endpoint, body) => request(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined
  }),

  put: (endpoint, body) => request(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined
  }),

  delete: (endpoint) => request(endpoint, {
    method: "DELETE"
  })
}

export default api