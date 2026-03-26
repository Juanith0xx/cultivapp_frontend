import { useEffect, useState } from 'react';
import { db, getPendingSync, removeFromSyncQueue } from '../utils/db';
import api from '../api/apiClient';
import toast from 'react-hot-toast';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  // 1. Escuchar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexión restablecida. Sincronizando...");
      startSync(); // Disparar sincronización automáticamente
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Modo Offline activado");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Motor de Sincronización
  const startSync = async () => {
    const pending = await getPendingSync();
    if (pending.length === 0) return;

    setSyncing(true);
    
    for (const item of pending) {
      try {
        console.log(`🔄 Sincronizando item tipo: ${item.type}`);
        
        // Ejecutar la petición según el tipo guardado
        await processSyncItem(item);

        // Si el backend responde 200 OK, borramos de la cola local
        await removeFromSyncQueue(item.id);
        console.log(`✅ Item ${item.id} sincronizado y borrado.`);
        
      } catch (error) {
        console.error(`❌ Error al sincronizar item ${item.id}:`, error);
        // Si hay error, no lo borramos de la cola para reintentar luego
        break; // Detenemos el loop para no saturar si el server sigue caído
      }
    }
    setSyncing(false);
  };

  // 3. Lógica de envío por tipo de acción
  const processSyncItem = async (item) => {
    const { type, routeId, payload } = item;

    switch (type) {
      case 'PHOTO':
        const formData = new FormData();
        formData.append('tipo_evidencia', payload.step);
        formData.append('foto', payload.file); // Dexie guardó el Blob/File
        return await api.post(`/routes/${routeId}/photo`, formData);

      case 'SCAN':
        return await api.post(`/routes/${routeId}/scans`, { barcode: payload.barcode });

      case 'FINISH':
        return await api.post(`/routes/${routeId}/finish`, payload);

      default:
        console.warn("Tipo de sincronización no reconocido:", type);
    }
  };

  return { isOnline, syncing, startSync };
};