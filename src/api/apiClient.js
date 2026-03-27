import { addToSyncQueue } from "../utils/db"; // 🚩 Importamos nuestra DB local

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.replace(/\/+$/, "") + (BASE_URL.includes("/api") ? "" : "/api");

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return token.startsWith("Bearer ") ? token.split(" ")[1] : token;
};

// 🚩 Función para identificar el RouteID desde el endpoint (ej: /routes/123/photo)
const extractRouteId = (endpoint) => {
  const match = endpoint.match(/\/routes\/([^/]+)/);
  return match ? match[1] : null;
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const finalUrl = `${API_URL}${cleanEndpoint}`;
  const isPostMethod = options.method === "POST" || options.method === "PUT";

  // --- 🚩 MEJORA PREVENTIVA OFFLINE 🚩 ---
  // Si el navegador reporta estar offline antes de disparar el fetch
  if (!navigator.onLine && isPostMethod) {
    console.warn("🌐 Navegador Offline detectado preventivamente. Guardando en Dexie...");
    const routeId = extractRouteId(endpoint);
    let type = "OTHER";

    if (endpoint.includes("/photo")) type = "PHOTO";
    if (endpoint.includes("/scans")) type = "SCAN";
    if (endpoint.includes("/finish")) type = "FINISH";
    if (endpoint.includes("/check-in")) type = "CHECK_IN";

    await addToSyncQueue(type, routeId, options.body);

    return { 
      offline: true, 
      message: "Guardado localmente (Preventivo)", 
      id: "offline_" + Date.now() 
    };
  }

  const isFormData = options.body instanceof FormData;

  const config = {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(finalUrl, config);
    
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/") window.location.href = "/?expired=true";
      throw new Error("Sesión expirada.");
    }

    const contentType = response.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) throw new Error(data?.message || `Error ${response.status}`);
    return data;

  } catch (error) {
    // --- 🚩 INTERCEPTOR DE ERROR DE RED 🚩 ---
    const isNetworkError = error.name === 'TypeError' || error.message.includes('fetch');

    if (isNetworkError && isPostMethod) {
      console.warn("🌐 Error de red detectado. Guardando en cola de sincronización...");
      
      const routeId = extractRouteId(endpoint);
      let type = "OTHER";

      if (endpoint.includes("/photo")) type = "PHOTO";
      if (endpoint.includes("/scans")) type = "SCAN";
      if (endpoint.includes("/finish")) type = "FINISH";
      if (endpoint.includes("/check-in")) type = "CHECK_IN";

      await addToSyncQueue(type, routeId, options.body);

      return { 
        offline: true, 
        message: "Guardado localmente (Fallback)", 
        id: "offline_" + Date.now() 
      };
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
  post: (endpoint, body) => request(endpoint, { method: "POST", body: isFormData(body) ? body : JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: "PATCH", body: isFormData(body) ? body : JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body: isFormData(body) ? body : JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

const isFormData = (val) => val instanceof FormData;

export default api;