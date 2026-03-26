import Dexie from 'dexie';

// 1. Configuración de la Base de Datos Local
export const db = new Dexie('CultivappDB');

/**
 * Definición de tablas:
 * - visits: Cache de la agenda del día (nombres de locales, direcciones, etc).
 * - questions: Cache de los formularios dinámicos.
 * - syncQueue: Cola de acciones pendientes (fotos, formularios, escaneos).
 */
db.version(1).stores({
  visits: 'id, cadena, direccion, status', 
  questions: 'id, question, is_required',
  syncQueue: '++id, type, routeId, status, timestamp' 
});

/**
 * 🚩 AGREGAR A LA COLA DE SINCRONIZACIÓN
 * Guarda cualquier acción que falle por falta de internet.
 * @param {string} type - Tipo de acción ('PHOTO', 'CHECK_IN', 'ANSWERS', 'SCAN', 'FINISH')
 * @param {string} routeId - ID de la visita/ruta actual
 * @param {object} payload - Datos de la petición (incluyendo Blobs de fotos)
 */
export const addToSyncQueue = async (type, routeId, payload) => {
  try {
    const id = await db.syncQueue.add({
      type,
      routeId,
      payload,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    console.log(`📍 Acción [${type}] guardada en cola local. ID: ${id}`);
    return id;
  } catch (error) {
    console.error("❌ Error al guardar en IndexedDB:", error);
    throw error;
  }
};

/**
 * 🚩 OBTENER TODA LA COLA PENDIENTE
 */
export const getPendingSync = async () => {
  return await db.syncQueue.where('status').equals('pending').toArray();
};

/**
 * 🚩 ELIMINAR ACCIÓN PROCESADA
 */
export const removeFromSyncQueue = async (id) => {
  return await db.syncQueue.delete(id);
};