import { useEffect, useState } from "react";
import { getPendingSync, removeFromSyncQueue } from "../utils/db";
import api from "../api/apiClient";
import toast from "react-hot-toast";

/**
 * 🛠️ RECONSTRUIR BODY
 * Ahora incluye una limpieza para evitar el "Doble JSON Stringify"
 */
const rebuildBody = (payload) => {
  if (!payload) return null;

  // 1. Manejo de FormData
  if (payload?.__type === "FormData") {
    const formData = new FormData();
    Object.entries(payload.data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  }

  // 🚩 FIX CRÍTICO: Si el payload es un string que parece JSON, lo parseamos.
  // Esto evita que enviemos ""{\\"key\\": \\"value\\"}" al servidor.
  if (typeof payload === "string") {
    try {
      // Intentamos parsear. Si funciona, devolvemos el objeto limpio.
      return JSON.parse(payload);
    } catch (e) {
      // Si no es un JSON válido, lo devolvemos como string original
      return payload;
    }
  }

  return payload;
};

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 ONLINE - Iniciando Sincronización...");
      setIsOnline(true);
      toast.success("Conexión restablecida. Sincronizando datos pendientes...");
      startSync();
    };

    const handleOffline = () => {
      console.log("📴 OFFLINE - Modo local activado");
      setIsOnline(false);
      toast.error("Sin conexión. Las acciones se guardarán localmente.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const startSync = async () => {
    const pending = await getPendingSync();

    if (!pending.length) return;
    
    console.log("📦 Items en cola:", pending.length);
    setSyncing(true);

    for (const item of pending) {
      try {
        console.log(`🔄 Sincronizando item ${item.id} (${item.type || 'OTHER'})`);

        // 🚩 Aquí aplicamos la limpieza de datos
        const body = rebuildBody(item.payload);

        if (item.method && item.endpoint) {
          // Usamos el método dinámico (post, put, patch)
          const method = item.method.toLowerCase();
          await api[method](item.endpoint, body);
        } else {
          // Soporte para items con formato antiguo
          await processOldItem(item, body);
        }

        await removeFromSyncQueue(item.id);
        console.log(`✅ Item ${item.id} sincronizado con éxito`);

      } catch (error) {
        console.error(`❌ Error al sincronizar item ${item.id}:`, error.message);
        
        // Si el error es 400 (Bad Request), el dato está corrupto y no sirve reintentar
        if (error.status === 400) {
           console.warn(`🗑️ Eliminando item ${item.id} por datos inválidos.`);
           await removeFromSyncQueue(item.id);
        } else {
           // Si es error de red de nuevo, paramos el bucle para reintentar después
           break; 
        }
      }
    }

    setSyncing(false);
    console.log("🏁 Proceso de sincronización finalizado");
  };

  const processOldItem = async (item, body) => {
    const { type, routeId } = item;
    if (!type || !routeId) return;

    switch (type) {
      case "PHOTO": return await api.post(`/routes/${routeId}/photo`, body);
      case "SCAN": return await api.post(`/routes/${routeId}/scans`, body);
      case "FINISH": return await api.post(`/routes/${routeId}/finish`, body);
      case "CHECK_IN": return await api.post(`/routes/${routeId}/check-in`, body);
      default: console.warn("⚠️ Tipo desconocido:", type);
    }
  };

  return { isOnline, syncing, startSync };
};