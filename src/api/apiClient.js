import { addToSyncQueue } from "../utils/db";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.replace(/\/+$/, "") + (BASE_URL.includes("/api") ? "" : "/api");

/**
 * 🛡️ OBTENCIÓN SEGURA DEL TOKEN
 */
const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token || token === "null" || token === "undefined" || token.length < 10) return null;
  
  const cleanToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  return cleanToken.trim();
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const finalUrl = `${API_URL}${cleanEndpoint}`;
  
  if (!token && !cleanEndpoint.includes("/auth/login")) {
    console.warn(`⚠️ [API] Acceso denegado a ${cleanEndpoint}: No hay token de sesión.`);
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

    if (response.status === 401) {
      console.error("❌ Sesión expirada. Redirigiendo al login...");
      throw { status: 401, message: "Sesión no autorizada" };
    }

    if (response.status === 403) {
      console.error(`🚫 PERMISOS INSUFICIENTES: El rol de este usuario no puede acceder a ${cleanEndpoint}`);
      throw { status: 403, message: "Tu cuenta no tiene permisos para ver esta sección" };
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
  /**
   * ✅ MEJORA: Manejo inteligente de parámetros
   * Ahora detecta si pasas { params: { ... } } o directamente los filtros.
   */
  get: (endpoint, config = null) => {
    let url = endpoint;
    
    // Extraemos los parámetros reales: si config tiene .params, los usamos; si no, config es el parámetro.
    const actualParams = config?.params ? config.params : config;

    if (actualParams && typeof actualParams === "object" && !(actualParams instanceof FormData)) {
      // Limpiamos nulos, undefined o strings vacíos para una URL limpia
      const cleanParams = Object.fromEntries(
        Object.entries(actualParams).filter(([_, v]) => v != null && v !== "" && v !== "undefined")
      );

      const query = new URLSearchParams(cleanParams).toString();
      if (query) {
        url += `${url.includes("?") ? "&" : "?"}${query}`;
      }
    }
    
    // Pasamos el resto de la configuración (headers, etc.) al request
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