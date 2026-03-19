const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;

const getToken = () => localStorage.getItem("token");

const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  // LOG PARA DEBUG (Puedes quitarlo después)
  console.log(`📡 Llamando a: ${endpoint} | Token: ${token ? "SI" : "NO"}`);

  const isFormData = options.body instanceof FormData;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const config = {
    ...options,
    headers: {
      // Si es FormData (fotos), el navegador pone el Content-Type solo con el boundary
      ...(!isFormData && { "Content-Type": "application/json" }),
      // IMPORTANTE: Aseguramos que el prefijo Bearer esté bien formado
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${cleanEndpoint}`, config);
    
    // Manejo de 401 (Sesión expirada o Token inválido)
    if (response.status === 401) {
      console.warn("⚠️ Sesión expirada o no autorizada. Limpiando...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Solo redirigir si no estamos ya en el login
      if (window.location.pathname !== "/") {
        window.location.href = "/?expired=true";
      }
      throw new Error("No autorizado");
    }

    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    // Si la respuesta no es OK (incluye el error 400 que mencionaste)
    if (!response.ok) {
      const errorMsg = data?.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // Si el error es de conexión (Servidor apagado)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error("❌ No se pudo conectar con el servidor de Render");
      throw new Error("Error de conexión con el servidor");
    }
    
    console.error("❌ API Error:", error.message);
    throw error;
  }
};

const api = {
  // Quitamos la necesidad de pasar el query de fecha manualmente si quieres
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