const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// Si la URL ya trae /api, la dejamos, si no, la agregamos asegurando un solo slash
const API_URL = BASE_URL.replace(/\/+$/, "") + (BASE_URL.includes("/api") ? "" : "/api");

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  // Normalización: Si el token ya tiene "Bearer ", lo devolvemos tal cual. 
  // Si no, lo devolvemos limpio para que el request le ponga el prefijo.
  return token.startsWith("Bearer ") ? token.split(" ")[1] : token;
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  // Limpiamos el endpoint para que no tenga slashes duplicados
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const finalUrl = `${API_URL}${cleanEndpoint}`;

  const isFormData = options.body instanceof FormData;

  const config = {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }), // Siempre enviamos un solo "Bearer "
      ...options.headers,
    },
  };

  try {
    const response = await fetch(finalUrl, config);
    
    // 🚩 Manejo de 401: Token inválido o expirado
    if (response.status === 401) {
      console.error("⚠️ No autorizado: Limpiando sesión...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      if (window.location.pathname !== "/") {
        window.location.href = "/?expired=true";
      }
      throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
    }

    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMsg = data?.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error("❌ Error de red: El servidor podría estar apagado.");
      throw new Error("No se pudo conectar con el servidor.");
    }
    
    console.error("❌ API Error:", error.message);
    throw error;
  }
};

const api = {
  get: (endpoint, params = null) => {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams(params).toString();
      url += `${url.includes('?') ? '&' : '?'}${query}`;
    }
    return request(url, { method: "GET" });
  },

  post: (endpoint, body) =>
    request(endpoint, {
      method: "POST",
      body: isFormData(body) ? body : JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: "PATCH",
      body: isFormData(body) ? body : (body ? JSON.stringify(body) : undefined),
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: "PUT",
      body: isFormData(body) ? body : (body ? JSON.stringify(body) : undefined),
    }),

  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

// Función auxiliar para detectar FormData
const isFormData = (val) => val instanceof FormData;

export default api;