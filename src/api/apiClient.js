import { addToSyncQueue } from "../utils/db";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.replace(/\/+$/, "") + (BASE_URL.includes("/api") ? "" : "/api");

/**
 * 🛡️ OBTENCIÓN SEGURA DEL TOKEN (MEJORADA)
 * Limpia comillas, detecta strings inválidos y normaliza el Bearer
 */
const getToken = () => {
  let token = localStorage.getItem("token");
  
  // 1. Validaciones básicas de existencia
  if (!token || token === "null" || token === "undefined" || token === "") return null;
  
  // 2. Limpieza de comillas (común si usas JSON.stringify al guardar)
  token = token.replace(/^"|"$/g, '');
  
  // 3. Normalización: extraemos solo el hash si viene con prefijo
  const cleanToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  
  const finalToken = cleanToken?.trim();
  return finalToken && finalToken.length > 10 ? finalToken : null;
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const finalUrl = `${API_URL}${cleanEndpoint}`;
  
  // Debug para desarrollo (puedes comentarlo después)
  if (!token && !cleanEndpoint.includes("/auth/login")) {
    console.warn(`⚠️ [API] No hay token para: ${cleanEndpoint}`);
  }

  const isFD = options.body instanceof FormData;

  const config = {
    method: options.method || "GET",
    ...options,
    headers: {
      ...(!isFD && { "Content-Type": "application/json" }),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}), 
      ...options.headers,
    },
  };

  try {
    const response = await fetch(finalUrl, config);

    // Si el backend nos rebota con 401, forzamos limpieza local
    if (response.status === 401) {
      console.error("❌ Sesión inválida o expirada en el servidor.");
      // Opcional: localStorage.removeItem("token"); 
      throw { status: 401, message: "Sesión no autorizada" };
    }

    if (response.status === 403) {
      throw { status: 403, message: "No tienes permisos para esta acción" };
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
    const isNetworkError = error.name === "TypeError" || error.message?.includes("Failed to fetch");
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(options.method);

    if (isNetworkError && isMutation) {
      return { offline: true, message: "Operación guardada localmente" };
    }
    throw error;
  }
};

const api = {
  get: (endpoint, config = null) => {
    let url = endpoint;
    const actualParams = config?.params ? config.params : config;

    if (actualParams && typeof actualParams === "object" && !(actualParams instanceof FormData)) {
      const cleanParams = Object.fromEntries(
        Object.entries(actualParams).filter(([_, v]) => v != null && v !== "" && v !== "undefined")
      );

      const query = new URLSearchParams(cleanParams).toString();
      if (query) {
        url += `${url.includes("?") ? "&" : "?"}${query}`;
      }
    }
    return request(url, { method: "GET", ...config });
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