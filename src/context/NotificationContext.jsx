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
      console.log("📊 [Historial] Sincronizado.");
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  useEffect(() => {
    let channel;
    
    const startRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || localStorage.getItem("token");

      if (!user?.id || !token) return;

      try {
        await supabase.auth.setSession({ access_token: token, refresh_token: token });

        // 🚩 ESTRATEGIA DE ESCUCHA TOTAL
        // Escuchamos CUALQUIER cambio en el esquema public
        channel = supabase
          .channel('schema-db-changes')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public' 
              // Quitamos el filtro 'table' para que no haya errores de nombre
            }, 
            (payload) => {
              // 🕵️ ESTE LOG DEBE APARECER SIEMPRE QUE SE INSERTE ALGO EN LA DB
              console.log("🔥 [SUPER-DEBUG] ¡CAMBIO DETECTADO EN DB!", payload);
              
              // Solo procesamos si la tabla es 'notifications'
              if (payload.table !== 'notifications') return;
              
              const n = payload.new;
              if (processedIds.current.has(n.id)) return;

              // Comparación manual y segura
              const esParaMi = String(n.tenant_id).toLowerCase() === String(user.company_id).toLowerCase() || 
                               String(n.target_user_id).toLowerCase() === String(user.id).toLowerCase();

              if (esParaMi) {
                processedIds.current.add(n.id);
                toast.success(`🔔 ${n.title}`, { position: 'top-right' });
                setNotifications(prev => [n, ...prev]);
                setUnreadCount(c => c + 1);
              }
            }
          )
          .subscribe((status) => {
            console.log("📡 [Realtime Status]:", status);
          });

      } catch (err) { console.error("❌ Error Realtime:", err); }
    };

    startRealtime();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user?.id, user?.company_id]);

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