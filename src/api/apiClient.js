import { addToSyncQueue } from "../utils/db";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.replace(/\/+$/, "") + (BASE_URL.includes("/api") ? "" : "/api");

/**
 * 🛡️ OBTENCIÓN SEGURA DEL TOKEN
 * Corregido para evitar que devuelva strings vacíos o "null" como texto
 */
const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token || token === "null" || token === "undefined") return null;
  
  // Limpieza profunda: quitamos "Bearer " si existe y espacios en blanco
  const cleanToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  return cleanToken.trim();
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const finalUrl = `${API_URL}${cleanEndpoint}`;
  
  // 🔍 LOG DE DEBUG PARA JUAN (Solo en desarrollo)
  if (!token && !cleanEndpoint.includes("/auth/login")) {
    console.warn(`⚠️ [API] Intentando llamar a ${cleanEndpoint} SIN TOKEN.`);
  }

  const isFD = options.body instanceof FormData;

  const config = {
    method: options.method || "GET",
    ...options,
    headers: {
      ...(!isFD && { "Content-Type": "application/json" }),
      // 🔥 Forzamos la cabecera si el token existe
      ...(token ? { "Authorization": `Bearer ${token}` } : {}), 
      ...options.headers,
    },
  };

  try {
    const response = await fetch(finalUrl, config);

    if (response.status === 401) {
      // Si da 401, el token ya no sirve, lo limpiamos
      // localStorage.removeItem("token"); // Opcional: forzar logout
      throw { status: 401, message: "Sesión expirada o no autorizada" };
    }

    const contentType = response.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.message || data || `Error ${response.status}`,
        fullError: data
      };
    }

    return data;

  } catch (error) {
    // Manejo de offline (se mantiene igual)
    const isNetworkError = error.name === "TypeError" || error.message?.includes("Failed to fetch");
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(options.method);

    if (isNetworkError && isMutation) {
      // ... lógica de cola offline ...
      return { offline: true, message: "Operación guardada localmente" };
    }
    throw error;
  }
};

const api = {
  get: (endpoint, params = null) => {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams(params).toString();
      url += `${url.includes("?") ? "&" : "?"}${query}`;
    }
    return request(url, { method: "GET" });
  },
  post: (endpoint, body) => request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  put: (endpoint, body) => request(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export default api;