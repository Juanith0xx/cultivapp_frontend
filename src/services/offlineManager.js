import { addToSyncQueue } from "../utils/db";

/**
 * 🛠️ SERIALIZAR BODY
 * Mantenemos tu lógica de conversión aquí para que el Manager 
 * se encargue de preparar los datos para IndexedDB.
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
  
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (e) {
      return body;
    }
  }
  return body;
};

const OfflineManager = {
  /**
   * Guarda una operación en la cola de sincronización.
   * @param {string} endpoint - La URL de la API
   * @param {string} method - POST, PUT, PATCH, etc.
   * @param {any} body - Los datos de la petición
   */
  save: async (endpoint, method, body) => {
    console.warn(`🌐 [OfflineManager] Guardando en cola: ${method} ${endpoint}`);
    
    // Identificar el tipo de operación para la cola
    const type = endpoint.includes("/finish") ? "FINISH" : 
                 endpoint.includes("/photo") ? "PHOTO" : "OTHER";

    // Extraer ID de ruta si está presente en el endpoint
    const routeMatch = endpoint.match(/\/routes\/([^/]+)/);
    const routeId = routeMatch ? routeMatch[1] : null;

    // Guardar en la base de datos local (IndexedDB)
    await addToSyncQueue({
      type,
      endpoint,
      method,
      routeId,
      payload: serializeBody(body),
      createdAt: new Date().toISOString(),
    });

    return { 
      offline: true, 
      message: "Operación guardada localmente por OfflineManager" 
    };
  }
};

export default OfflineManager;