const API_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("token");

const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  // VERIFICACIÓN: ¿Es el cuerpo de la petición un FormData (trae archivos)?
  const isFormData = options.body instanceof FormData;

  const config = {
    ...options,
    headers: {
      // Si NO es FormData, forzamos JSON. Si ES FormData, el navegador pone el Content-Type solo.
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
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

  // Modificado para no hacer stringify si es FormData
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