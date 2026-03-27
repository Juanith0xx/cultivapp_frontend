import Dexie from 'dexie';

// 1. Configuración de la Base de Datos Local
export const db = new Dexie('CultivappDB');

db.version(2).stores({
  visits: 'id, cadena, direccion, status',
  questions: 'id, question, is_required',
  syncQueue: '++id, type, routeId, endpoint, method, status, createdAt'
});

// 🔥 SERIALIZADOR DEFENSIVO (NUNCA PASA FORMData)
const serializeIfNeeded = (payload) => {
  if (payload instanceof FormData) {
    const serialized = {};

    for (let [key, value] of payload.entries()) {
      serialized[key] = value; // File / Blob OK
    }

    return {
      __type: "FormData",
      data: serialized,
    };
  }

  return payload;
};

/**
 * 🚩 AGREGAR A LA COLA DE SINCRONIZACIÓN
 */
export const addToSyncQueue = async (item) => {
  try {
    const safePayload = serializeIfNeeded(item.payload);

    console.log("📦 Guardando en Dexie:", safePayload);

    const id = await db.syncQueue.add({
      ...item,
      payload: safePayload,
      status: 'pending',
    });

    console.log(`📍 Acción [${item.type}] guardada en cola local. ID: ${id}`);
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
  return await db.syncQueue
    .where('status')
    .equals('pending')
    .toArray();
};

/**
 * 🚩 ELIMINAR ACCIÓN PROCESADA
 */
export const removeFromSyncQueue = async (id) => {
  return await db.syncQueue.delete(id);
};