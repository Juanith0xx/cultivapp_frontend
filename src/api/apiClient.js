// Si en tu .env dice "http://localhost:5000", aquí nos aseguramos que termine en /api
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;

const getToken = () => localStorage.getItem("token");

const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  // VERIFICACIÓN: ¿Es el cuerpo de la petición un FormData?
  const isFormData = options.body instanceof FormData;

  // IMPORTANTE: Aseguramos que el endpoint empiece con /
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const config = {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    // Aquí se construye la URL final: http://localhost:5000/api/routes/...
    const response = await fetch(`${API_URL}${cleanEndpoint}`, config);
    const contentType = response.headers.get("content-type");

    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/") window.location.href = "/";
      throw new Error("No autorizado");
    }

    if (!response.ok) {
      throw new Error(data?.message || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
};

const api = {
  get: (endpoint) => request(endpoint, { method: "GET" }),

  post: (endpoint, body) =>
    request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    }),

  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export default api;