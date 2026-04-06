import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const useNotifications = (user) => {
  useEffect(() => {
    if (!user?.id || !user?.company_id) return;

    // Crear un nombre de canal único para este usuario/sesión
    const channelName = `admin-notifs-${user.id}`;
    const channel = supabase.channel(channelName);

    // Configurar la escucha ANTES de suscribir
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${user.company_id}`,
        },
        (payload) => {
          const newNotif = payload.new;

          // Lógica de filtrado de Cultivapp
          const isForMe =
            newNotif.scope === 'global' ||
            (newNotif.scope === 'individual' && newNotif.target_user_id === user.id) ||
            (newNotif.scope === 'local' && newNotif.target_local_id === user.local_id);

          if (isForMe) {
            toast.info(newNotif.title, { 
              description: newNotif.message,
              icon: '🔔',
              duration: 5000 
            });

            // Avisar a la campana (Notifications.jsx) que hay data nueva
            window.dispatchEvent(new CustomEvent('sync_notifications', { 
              detail: newNotif 
            }));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`🚀 Cultivapp Realtime: Conectado como ${user.role}`);
        }
      });

    // LIMPIEZA: Esto evita el error de "cannot add callbacks after subscribe"
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.company_id]); // Solo se reinicia si cambia el ID o la Empresa
};