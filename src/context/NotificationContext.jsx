import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import * as service from '../services/notificationService';

const NotificationContext = createContext(null);
const processedIds = new Set(); // 🛡️ ESCUDO ANTI-DUPLICADOS PARA LA SESIÓN

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1. Cargar notificaciones iniciales desde la API
  const fetchNotifs = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await service.getMyNotifications();
      // Si usas axios, la data suele venir en res.data o res dependiendo de tu apiClient
      const data = res.data || res || [];
      
      // Limpieza de duplicados por ID al cargar
      const unique = data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      
      setNotifications(unique);
      setUnreadCount(unique.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // 2. Suscripción ÚNICA Realtime (SaaS Mode)
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

        // 🛡️ REGLA 1: Evitar procesar el mismo ID dos veces
        if (processedIds.has(n.id)) return;
        processedIds.add(n.id);

        // 🛡️ REGLA 2: Lógica de Privacidad (Solo si es para mí, global o mi local)
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

  // Acciones: Marcar Leída
  const onMarkRead = async (id) => {
    try {
      await service.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Acciones: Eliminar (Solo ROOT/ADMIN)
  const onDelete = async (id) => {
    if (!window.confirm("¿Deseas eliminar esta notificación permanentemente?")) return;
    try {
      await service.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Recalcular conteo si la que eliminamos no estaba leída
      setUnreadCount(prev => notifications.find(n => n.id === id && !n.is_read) ? Math.max(0, prev - 1) : prev);
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

// 🛡️ HOOK SEGURO: Evita el error "undefined"
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext debe ser usado dentro de un NotificationProvider");
  }
  return context;
};