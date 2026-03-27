import Dexie from 'dexie';

export const db = new Dexie('CultivappDB');

db.version(2).stores({
  visits: 'id, cadena, direccion, status',
  questions: 'id, question, is_required',
  syncQueue: '++id, type, routeId, endpoint, method, status, createdAt'
});

// 🔥 SERIALIZADOR SEGURO
const serializeIfNeeded = (payload) => {
  if (payload instanceof FormData) {
    const serialized = {};

    for (let [key, value] of payload.entries()) {
      serialized[key] = value;
    }

    return {
      __type: "FormData",
      data: serialized,
    };
  }

  return payload;
};

export const addToSyncQueue = async (item) => {
  try {
    const safePayload = serializeIfNeeded(item.payload);

    const id = await db.syncQueue.add({
      ...item,
      payload: safePayload,
      status: 'pending',
    });

    console.log(`📍 Guardado en cola ID: ${id}`);
    return id;

  } catch (error) {
    console.error("❌ Dexie error:", error);
    throw error;
  }
};

export const getPendingSync = async () => {
  return await db.syncQueue.where('status').equals('pending').toArray();
};

export const removeFromSyncQueue = async (id) => {
  return await db.syncQueue.delete(id);
};