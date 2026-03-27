import { useEffect, useState } from "react";
import { getPendingSync, removeFromSyncQueue } from "../utils/db";
import api from "../api/apiClient";
import toast from "react-hot-toast";

const rebuildBody = (payload) => {
  if (payload?.__type === "FormData") {
    const formData = new FormData();

    Object.entries(payload.data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return formData;
  }

  return payload;
};

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 ONLINE");
      setIsOnline(true);
      toast.success("Conexión restablecida. Sincronizando...");
      startSync();
    };

    const handleOffline = () => {
      console.log("📴 OFFLINE");
      setIsOnline(false);
      toast.error("Modo Offline activado");
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

    console.log("📦 Pendientes:", pending.map(p => p.id));

    if (!pending.length) return;

    setSyncing(true);

    for (const item of pending) {
      try {
        console.log("🔄 Sync item", item.id);

        const body = rebuildBody(item.payload);

        // 🧠 FIX CRÍTICO
        if (item.method && item.endpoint) {
          console.log("🟢 Nuevo formato");
          await api[item.method.toLowerCase()](item.endpoint, body);
        } else {
          console.log("🟡 Formato antiguo");
          await processOldItem(item, body);
        }

        await removeFromSyncQueue(item.id);
        console.log(`✅ Item ${item.id} sincronizado`);

      } catch (error) {
        console.error(`❌ Error en item ${item.id}`, error);
        break;
      }
    }

    setSyncing(false);
    console.log("🏁 Sync finalizado");
  };

  // 🔥 SOPORTE FORMATO ANTIGUO (ESTE ES EL FIX REAL)
  const processOldItem = async (item, body) => {
    const { type, routeId } = item;

    if (!type || !routeId) {
      console.warn("⚠️ Item inválido:", item);
      return;
    }

    switch (type) {
      case "PHOTO":
        return await api.post(`/routes/${routeId}/photo`, body);

      case "SCAN":
        return await api.post(`/routes/${routeId}/scans`, body);

      case "FINISH":
        return await api.post(`/routes/${routeId}/finish`, body);

      case "CHECK_IN":
        return await api.post(`/routes/${routeId}/check-in`, body);

      default:
        console.warn("⚠️ Tipo no reconocido:", type);
    }
  };

  return { isOnline, syncing, startSync };
};