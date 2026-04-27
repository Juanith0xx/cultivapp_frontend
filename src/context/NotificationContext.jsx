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

  // ✅ BroadcastChannel para sincronizar pestañas del mismo usuario
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

  // ✅ BroadcastChannel: inicializar y escuchar claims de otras pestañas
  useEffect(() => {
    if (!user?.id) return;

    const bc = new BroadcastChannel(`notif-lock-${user.id}`);
    broadcastRef.current = bc;

    bc.onmessage = (e) => {
      if (e.data?.type === 'CLAIM') {
        // Otra pestaña ya procesó esta notificación → la marcamos localmente para bloquear el toast
        processedIds.current.add(e.data.id);
        console.log("📡 [BroadcastChannel] Notificación reclamada por otra pestaña:", e.data.id);
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

        // ✅ Sin filter en el canal (evita problema de RLS/índices en Supabase)
        // El filtrado por usuario se hace manualmente dentro del handler
        channel = supabase
          .channel('db-changes-notifications')
          .on('postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications'
            },
            (payload) => {
              console.log("📥 [REALTIME] ¡Algo llegó a la DB!", payload);

              const n = payload.new;

              // ✅ Verificar si esta pestaña (u otra) ya procesó la notificación
              if (processedIds.current.has(n.id)) {
                console.log("⏭️ Notificación ya procesada (duplicado o reclamada por otra pestaña):", n.id);
                return;
              }

              // NORMALIZACIÓN DE IDs (Muy importante)
              const cleanNotifUser = String(n.target_user_id || n.user_id || "").toLowerCase().trim();
              const cleanUserId = String(user.id || "").toLowerCase().trim();
              const cleanNotifTenant = String(n.tenant_id || "").toLowerCase().trim();
              const cleanUserTenant = String(user.company_id || "").toLowerCase().trim();

              // DEBUG EN CONSOLA (Para que veas por qué no entra el IF)
              console.log(`🧐 Comparando Usuario: [${cleanNotifUser}] con [${cleanUserId}]`);
              console.log(`🧐 Comparando Empresa: [${cleanNotifTenant}] con [${cleanUserTenant}]`);

              const esParaMi = cleanNotifUser === cleanUserId;

              if (esParaMi) {
                console.log("✅ ¡Es para mí! Disparando Toast.");

                // ✅ Reclamar ANTES de procesar para bloquear otras pestañas
                processedIds.current.add(n.id);
                if (broadcastRef.current) {
                  broadcastRef.current.postMessage({ type: 'CLAIM', id: n.id });
                }

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
                console.log("⏭️ Notificación ignorada (no es para este usuario/empresa)");
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

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      onMarkRead: async (id) => {
        try {
          await service.markAsRead(id);
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
          setUnreadCount(c => Math.max(0, c - 1));
        } catch (err) {
          console.error("❌ [Error al marcar leído]:", err);
        }
      },
      refresh: fetchNotifs
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);