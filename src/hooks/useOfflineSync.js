import { useEffect, useState, useRef } from "react";
import { getPendingSync, removeFromSyncQueue } from "../utils/db";
import api from "../api/apiClient";
import toast from "react-hot-toast";

// 🔥 FLAG GLOBAL (evita múltiples sync simultáneos)
let isSyncingGlobal = false;

// 🔥 RECONSTRUIR BODY
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

  // 🔥 evita múltiples listeners duplicados
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const handleOnline = () => {
      console.log("🌐 Evento ONLINE detectado");
      setIsOnline(true);
      toast.success("Conexión restablecida. Sincronizando...");
      startSync();
    };

    const handleOffline = () => {
      console.log("📴 Evento OFFLINE detectado");
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
    // 🔥 PROTECCIÓN GLOBAL
    if (isSyncingGlobal) {
      console.log("⛔ Sync ya en proceso, evitando duplicado");
      return;
    }

    isSyncingGlobal = true;
    setSyncing(true);

    try {
      const pending = await getPendingSync();

      console.log("📦 Pendientes:", pending.map((p) => p.id));

      if (!pending.length) {
        console.log("✅ No hay pendientes");
        return;
      }

      for (const item of pending) {
        try {
          console.log(`🔄 Sync item ${item.id} (${item.type})`);

          const body = rebuildBody(item.payload);

          await api[item.method.toLowerCase()](item.endpoint, body);

          await removeFromSyncQueue(item.id);

          console.log(`✅ Item ${item.id} eliminado`);

        } catch (error) {
          console.error(`❌ Error en item ${item.id}`, error);

          // 🔥 IMPORTANTE: detenemos para evitar spam si backend falla
          break;
        }
      }

    } catch (error) {
      console.error("❌ Error general en sync:", error);
    } finally {
      isSyncingGlobal = false;
      setSyncing(false);
      console.log("🏁 Sync finalizado");
    }
  };

  return { isOnline, syncing, startSync };
};