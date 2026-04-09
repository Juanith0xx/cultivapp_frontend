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

  // 🔄 CARGA INICIAL
  const fetchNotifs = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await service.getMyNotifications();
      const rawData = Array.isArray(res) ? res : (res?.data || res || []);
      setNotifications(rawData);
      setUnreadCount(rawData.filter(n => !n.is_read).length);
      processedIds.current = new Set(rawData.map(n => n.id));
      console.log("📊 [API] Historial sincronizado.");
    } catch (err) { console.error("❌ Error API:", err); } 
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // 📡 REALTIME (Súper simplificado para debug)
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // 🔍 LOG DE AUDITORÍA: Queremos ver esto en tu consola
    console.log("🕵️ [Debug-RT] ¿Hay usuario?", !!user?.id, " ¿Hay token?", !!token);

    if (!user?.id || !token) {
      console.warn("🚫 [Debug-RT] El cable no se conectó porque falta el usuario o el token.");
      return;
    }

    const setup = async () => {
      try {
        console.log("🛰️ [Debug-RT] Intentando conectar a Supabase...");
        
        await supabase.auth.setSession({ access_token: token, refresh_token: token });

        const channel = supabase
          .channel('canal_prueba_final')
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'notifications' }, 
            (payload) => {
              console.log("⚡ [Debug-RT] ¡LLEGÓ ALGO POR EL AIRE!", payload.new);
              
              const n = payload.new;
              // Quitamos filtros por 1 minuto para ver si llega algo
              toast.success(`🔔 ¡NUEVA NOTIFICACIÓN!`, { position: 'top-center' });
              setNotifications(prev => [n, ...prev]);
              setUnreadCount(c => c + 1);
            }
          )
          .subscribe((status) => {
            console.log("📡 [Debug-RT] Estado de conexión:", status);
          });

        return channel;
      } catch (e) {
        console.error("❌ [Debug-RT] Error fatal en el setup:", e);
      }
    };

    let ch;
    setup().then(res => ch = res);
    return () => { if (ch) supabase.removeChannel(ch); };
  }, [user?.id]); // 🚩 Solo depende del ID del usuario

  return (
    <NotificationContext.Provider value={{ 
      notifications, unreadCount, loading, 
      onMarkRead: service.markAsRead, 
      refresh: fetchNotifs 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);