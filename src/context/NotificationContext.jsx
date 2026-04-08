import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import * as service from '../services/notificationService';

const NotificationContext = createContext(null);
const processedIds = new Set(); // 🛡️ Escudo anti-duplicados para la sesión

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * 1. CARGAR NOTIFICACIONES (ROBUSTO)
   */
  const fetchNotifs = useCallback(async () => {
    const token = localStorage.getItem('token');
    // Si no hay usuario o token, no disparamos la petición para evitar el 401
    if (!user?.id || !token) return;

    try {
      setLoading(true);
      const res = await service.getMyNotifications();
      
      /**
       * 🚩 VALIDACIÓN MAESTRA DE DATOS
       * Tu apiClient ya devuelve la data procesada. 
       * Si el service devuelve 'res.data' de un array, será undefined.
       * Esta lógica intenta rescatar la información sea cual sea el formato.
       */
      const rawData = Array.isArray(res) ? res : (res?.data || res || []);
      
      // Debug en consola para que veas si realmente están llegando las 27 filas
      console.log(`📊 [Notificaciones] Registros detectados: ${Array.isArray(rawData) ? rawData.length : 0}`);

      if (Array.isArray(rawData)) {
        // Limpieza de duplicados por ID (seguridad extra)
        const unique = rawData.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setNotifications(unique);
        setUnreadCount(unique.filter(n => !n.is_read).length);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      // Silenciamos 401 (Unauthorized) para no ensuciar la consola en el login
      if (err.status !== 401) {
        console.error("❌ Error en fetchNotifs:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Carga inicial y cuando cambia el usuario
  useEffect(() => {
    if (user?.id) {
      fetchNotifs();
    }
  }, [user?.id, fetchNotifs]);

  /**
   * 2. SUSCRIPCIÓN REALTIME
   */
  useEffect(() => {
    if (!user?.id || !user?.company_id) return;

    const channelName = `saas-notifs-${user.id}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `tenant_id=eq.${user.company_id}` 
      }, (payload) => {
        const n = payload.new;

        if (processedIds.has(n.id)) return;
        processedIds.add(n.id);

        const isForMe = n.target_user_id === user.id || 
                        n.scope === 'global' || 
                        (n.scope === 'local' && n.target_local_id === user.local_id);

        if (isForMe) {
          toast.success(`🔔 ${n.title}`, { position: 'bottom-right' });
          setNotifications(prev => {
            if (prev.some(notif => notif.id === n.id)) return prev;
            return [n, ...prev];
          });
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.company_id]);

  /**
   * 3. ACCIONES
   */
  const onMarkRead = async (id) => {
    try {
      await service.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Deseas eliminar esta notificación permanentemente?")) return;
    try {
      await service.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const deleted = notifications.find(n => n.id === id);
        return (deleted && !deleted.is_read) ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      onMarkRead, 
      onDelete,
      refresh: fetchNotifs 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext debe ser usado dentro de un NotificationProvider");
  }
  return context;
};