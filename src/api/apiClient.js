const API_URL = import.meta.env.VITE_API_URL

const getToken = () => {
  return localStorage.getItem("token")
}

const request = async (endpoint, options = {}) => {

  const token = getToken()

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  }

  try {

    const response = await fetch(`${API_URL}${endpoint}`, config)

    const contentType = response.headers.get("content-type")

    let data = null

    if (contentType && contentType.includes("application/json")) {
      data = await response.json()
    }

    if (!response.ok) {
      throw new Error(data?.message || "Error en la petición")
    }

    return data

  } catch (error) {
    console.error("API Error:", error.message)
    throw error
  }

}

const api = {
  get: (endpoint) => request(endpoint),

  post: (endpoint, body) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(body)
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body)
    }),

  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE"
    })
}

export default api