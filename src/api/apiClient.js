import { addToSyncQueue } from "../utils/db";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = BASE_URL.replace(/\/+$/, "") + (BASE_URL.includes("/api") ? "" : "/api");

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return token.startsWith("Bearer ") ? token.split(" ")[1] : token;
};

const extractRouteId = (endpoint) => {
  const match = endpoint.match(/\/routes\/([^/]+)/);
  return match ? match[1] : null;
};

// 🔥 SERIALIZAR BODY
const serializeBody = (body) => {
  if (body instanceof FormData) {
    const serialized = {};
    for (let [key, value] of body.entries()) {
      serialized[key] = value;
    }
    return { __type: "FormData", data: serialized };
  }

  return body;
};

// 🔥 PREPARAR BODY (FIX JSON DOBLE)
const prepareBody = (body) => {
  if (body instanceof FormData) return body;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
};

const isFormData = (val) => val instanceof FormData;

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const finalUrl = `${API_URL}${cleanEndpoint}`;
  const isFD = isFormData(options.body);

  const config = {
    ...options,
    headers: {
      ...(!isFD && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(finalUrl, config);

    if (response.status === 401) {
      throw new Error("Sesión expirada");
    }

    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) throw new Error(data?.message || `Error ${response.status}`);

    return data;

  } catch (error) {
    const isNetworkError =
      error.name === "TypeError" || error.message.includes("Failed to fetch");

    const isMutation =
      ["POST", "PUT", "PATCH"].includes(options.method);

    if (isNetworkError && isMutation) {
      console.warn("🌐 Offline → guardando en cola");

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

      return {
        offline: true,
        message: "Guardado localmente",
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
      url += `${url.includes("?") ? "&" : "?"}${query}`;
    }
    return request(url, { method: "GET" });
  },

  post: (endpoint, body) =>
    request(endpoint, {
      method: "POST",
      body: prepareBody(body),
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: "PUT",
      body: prepareBody(body),
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: "PATCH",
      body: prepareBody(body),
    }),

  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export default api;