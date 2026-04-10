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

  // 🔄 CARGA DE HISTORIAL (Para que la campana tenga datos al iniciar)
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
    } catch (err) { 
      console.error("❌ [API Error]:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [user?.id]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // 📡 CONFIGURACIÓN REALTIME
  useEffect(() => {
    let channel;
    
    const startRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || localStorage.getItem("token");

      if (!user?.id || !token) return;

      try {
        // Autenticar el socket con el token actual
        await supabase.auth.setSession({ access_token: token, refresh_token: token });

        channel = supabase
          .channel('notifications-live')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public',
              table: 'notifications' 
            }, 
            (payload) => {
              const n = payload.new;
              
              // 1. Evitar duplicados por seguridad
              if (processedIds.current.has(n.id)) return;

              // 2. Filtro de pertenencia (Tenant o Usuario específico)
              const cleanNotifTenant = String(n.tenant_id || "").toLowerCase().trim();
              const cleanUserTenant = String(user.company_id || "").toLowerCase().trim();
              const cleanTargetUser = String(n.target_user_id || "").toLowerCase().trim();
              const cleanUserId = String(user.id || "").toLowerCase().trim();

              const esParaMi = cleanNotifTenant === cleanUserTenant || cleanTargetUser === cleanUserId;

              if (esParaMi) {
                processedIds.current.add(n.id);
                
                // 🔔 TOAST GENÉRICO: Solo avisa que hay algo nuevo (sin el detalle)
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

                // 📈 Actualizar estados para la campana y la lista
                setNotifications(prev => [n, ...prev]);
                setUnreadCount(c => c + 1);
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
      if (channel) supabase.removeChannel(channel); 
    };
  }, [user?.id, user?.company_id]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      // Función para marcar como leído desde cualquier componente
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