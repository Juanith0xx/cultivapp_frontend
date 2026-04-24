import { addToSyncQueue } from "../utils/db";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.replace(/\/+$/, "") + (BASE_URL.includes("/api") ? "" : "/api");

/**
 * 🔥 SERIALIZAR BODY (Garantiza que se guarde como OBJETO en la DB)
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
  
  // Si es un string (JSON), lo convertimos a Objeto para que IndexedDB lo guarde limpio
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (e) {
      return body; // Si no es JSON, lo pasamos tal cual
    }
  }
  return body;
};

const getToken = () => {
  let token = localStorage.getItem("token");
  if (!token || token === "null" || token === "undefined" || token === "") return null;
  token = token.replace(/^"|"$/g, '');
  const cleanToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  return cleanToken?.trim() || null;
};

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
      ...(token ? { "Authorization": `Bearer ${token}` } : {}), 
      ...options.headers,
    },
  };

  try {
    const response = await fetch(finalUrl, config);

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user"); 
      if (window.location.pathname !== "/") window.location.href = "/?error=session_expired";
      throw { status: 401, message: "Sesión expirada" };
    }

    const contentType = response.headers.get("content-type");
    let data = (contentType && contentType.includes("application/json")) 
               ? await response.json() 
               : await response.text();

    if (!response.ok) throw { status: response.status, message: data?.message || data };

    return data;

  } catch (error) {
    const isNetworkError = error.name === "TypeError" || error.message?.includes("Failed to fetch");
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(options.method);

    if (isNetworkError && isMutation) {
      console.warn("🌐 [Offline] Guardando en cola...");
      
      const routeMatch = endpoint.match(/\/routes\/([^/]+)/);
      const routeId = routeMatch ? routeMatch[1] : null;

      await addToSyncQueue({
        type: endpoint.includes("/finish") ? "FINISH" : (endpoint.includes("/photo") ? "PHOTO" : "OTHER"),
        endpoint: cleanEndpoint,
        method: options.method,
        routeId,
        payload: serializeBody(options.body), // 🚩 GUARDAR SIEMPRE COMO OBJETO
        createdAt: new Date().toISOString(),
      });

      return { offline: true, message: "Operación guardada localmente" };
    }
    throw error;
  }
};

const api = {
  get: (endpoint, config = null) => {
    let url = endpoint;
    const params = config?.params || config;
    if (params && typeof params === "object" && !(params instanceof FormData)) {
      const query = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null))).toString();
      if (query) url += `${url.includes("?") ? "&" : "?"}${query}`;
    }
    return request(url, { method: "GET", ...config });
  },

  // 🚩 REGLA DE ORO: Solo aquí se hace el stringify final
  post: (endpoint, body) => request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : (typeof body === "string" ? body : JSON.stringify(body)),
  }),
  
  put: (endpoint, body) => request(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : (typeof body === "string" ? body : JSON.stringify(body)),
  }),

  patch: (endpoint, body) => request(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : (typeof body === "string" ? body : JSON.stringify(body)),
  }),
  
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export default api;