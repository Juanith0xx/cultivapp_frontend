import { addToSyncQueue } from "../utils/db";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.replace(/\/+$/, "") + (BASE_URL.includes("/api") ? "" : "/api");

/**
 * 🛡️ OBTENCIÓN SEGURA DEL TOKEN
 */
const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  // Limpieza: Si por error se guardó con "Bearer ", lo limpiamos para no duplicar
  return token.startsWith("Bearer ") ? token.split(" ")[1] : token;
};

const extractRouteId = (endpoint) => {
  const match = endpoint.match(/\/routes\/([^/]+)/);
  return match ? match[1] : null;
};

/**
 * 🔥 SERIALIZAR PARA COLA OFFLINE
 */
const serializeBody = (body) => {
  if (!body) return null;
  if (body instanceof FormData) {
    const serialized = {};
    for (let [key, value] of body.entries()) {
      serialized[key] = value;
    }
    return { __type: "FormData", data: serialized };
  }
  return typeof body === "string" ? JSON.parse(body) : body;
};

/**
 * 🚀 FUNCIÓN MAESTRA DE PETICIÓN
 */
const request = async (endpoint, options = {}) => {
  const token = getToken();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const finalUrl = `${API_URL}${cleanEndpoint}`;
  
  const isFD = options.body instanceof FormData;

  const config = {
    method: options.method || "GET",
    ...options,
    headers: {
      ...(!isFD && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }), // Solo agrega si existe
      ...options.headers,
    },
  };

  try {
    const response = await fetch(finalUrl, config);

    // 🚩 MANEJO DE SESIÓN EXPIRADA O INEXISTENTE
    if (response.status === 401) {
      // No lanzamos un alert molesto, solo el error para que el Context lo maneje
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
      // Log detallado para desarrollo
      console.error(`❌ Server Error ${response.status} en [${endpoint}]:`, data);
      throw {
        status: response.status,
        message: data?.message || data || `Error ${response.status}`,
        fullError: data
      };
    }

    return data;

  } catch (error) {
    // 🌐 MANEJO DE OFFLINE
    const isNetworkError = 
      error.name === "TypeError" || 
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError");

    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(options.method);

    if (isNetworkError && isMutation) {
      console.warn("🌐 Cultivapp Offline → Guardando en cola:", endpoint);

      const routeId = extractRouteId(endpoint);
      let type = "OTHER";
      if (endpoint.includes("/photo")) type = "PHOTO";
      if (endpoint.includes("/finish")) type = "FINISH";
      if (endpoint.includes("/scans")) type = "SCAN";

      await addToSyncQueue({
        type,
        endpoint: cleanEndpoint,
        method: options.method,
        routeId,
        payload: serializeBody(options.body),
        createdAt: new Date().toISOString(),
      });

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

  post: (endpoint, body) => 
    request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: (endpoint, body) => 
    request(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: (endpoint, body) => 
    request(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export default api;