import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import * as service from '../services/notificationService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const processedIds = useRef(new Set());
  const broadcastRef = useRef(null);

  const fetchNotifs = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!user?.id || !token) return;
    try {
      setLoading(true);
      const res = await service.getMyNotifications();
      const rawData = Array.isArray(res) ? res : (res?.data || res || []);
      setNotifications(rawData);
      setUnreadCount(rawData.filter(n => !n.is_read).length);
      processedIds.current = new Set(rawData.map(n => n.id));
      console.log("📊 [Historial] Sincronizado para el usuario:", user.id);
    } catch (err) {
      console.error("❌ [API Error]:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // BroadcastChannel: coordina múltiples pestañas del mismo usuario
  useEffect(() => {
    if (!user?.id) return;
    const bc = new BroadcastChannel(`notif-lock-${user.id}`);
    broadcastRef.current = bc;
    bc.onmessage = (e) => {
      if (e.data?.type === 'CLAIM') {
        processedIds.current.add(e.data.id);
        console.log("📡 [BroadcastChannel] Reclamada por otra pestaña:", e.data.id);
      }
    };
    return () => {
      bc.close();
      broadcastRef.current = null;
    };
  }, [user?.id]);

  useEffect(() => {
    let channel;

    const startRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || localStorage.getItem("token");

      if (!user?.id || !token) return;

      try {
        await supabase.auth.setSession({ access_token: token, refresh_token: token });

        channel = supabase
          .channel('db-changes-notifications')
          .on('postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications'
            },
            (payload) => {
              const n = payload.new;

              console.log("📥 [REALTIME] payload.new completo:", JSON.stringify(n, null, 2));

              // Guardia: si no hay user.id válido, salir
              if (!user?.id) {
                console.log("⚠️ user.id no disponible, ignorando evento");
                return;
              }

              // Guardia: evitar reprocesamiento
              if (processedIds.current.has(n.id)) {
                console.log("⏭️ Ya procesada:", n.id);
                return;
              }

              // Normalización estricta
              const notifUserId = String(n.user_id ?? "").toLowerCase().trim();
              const currentUserId = String(user.id ?? "").toLowerCase().trim();

              console.log(`🧐 Comparando user_id: [${notifUserId}] con [${currentUserId}]`);

              // Guardia: si alguno está vacío, no hay match posible
              if (!notifUserId || !currentUserId) {
                console.log("⚠️ Uno de los IDs está vacío, ignorando");
                return;
              }

              const esParaMi = notifUserId === currentUserId;

              if (esParaMi) {
                console.log("✅ ¡Es para mí! Disparando Toast.");

                // Reclamar antes de procesar para bloquear otras pestañas
                processedIds.current.add(n.id);
                broadcastRef.current?.postMessage({ type: 'CLAIM', id: n.id });

                toast('¡Tienes una nueva notificación!', {
                  icon: '🔔',
                  duration: 5000,
                  position: 'top-right',
                  style: {
                    borderRadius: '1.2rem',
                    background: '#333',
                    color: '#fff',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderLeft: '5px solid #87be00'
                  },
                });

                setNotifications(prev => [n, ...prev]);
                setUnreadCount(c => c + 1);
              } else {
                console.log("⏭️ No es para este usuario, ignorando.");
              }
            }
          )
          .subscribe((status) => {
            console.log("📡 [Socket Status]:", status);
          });

      } catch (err) {
        console.error("❌ [Realtime Fatal]:", err);
      }
    };

    startRealtime();

    return () => {
      if (channel) {
        console.log("🔌 Cerrando canal de notificaciones");
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, user?.company_id]);

  const onMarkRead = async (id) => {
    try {
      await service.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error("❌ [Error al marcar leído]:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      onMarkRead,
      refresh: fetchNotifs
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotificationContext() {
  return useContext(NotificationContext);
}