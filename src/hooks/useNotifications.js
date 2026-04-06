import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const useNotifications = (user) => {
  useEffect(() => {
    // 🛡️ Seguridad: Si no hay usuario o empresa, no activamos el tiempo real
    if (!user?.id || !user?.company_id) return;

    // 1. Creamos el canal único para la empresa (Tenant Isolation)
    const channel = supabase
      .channel(`realtime-notifications-${user.company_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${user.company_id}`, // Solo lo de mi empresa
        },
        (payload) => {
          const newNotif = payload.new;

          // 2. Lógica de filtrado por Alcance (Scope)
          // Validamos contra null/undefined para evitar errores de sintaxis
          const isForMe =
            newNotif.scope === 'global' ||
            (newNotif.scope === 'individual' && newNotif.target_user_id === user.id) ||
            (newNotif.scope === 'local' && newNotif.target_local_id === user.local_id);

          if (isForMe) {
            // 3. ¡Disparar el aviso visual! 🚀
            toast.info(newNotif.title, { 
              description: newNotif.message,
              duration: 5000,
              icon: '🔔'
            });

            /**
             * 4. MEJORA CRÍTICA: Evento de sincronización
             * Esto permite que tu componente de la "campana" escuche este evento
             * y se actualice solo sin necesidad de recargar la página.
             */
            window.dispatchEvent(new CustomEvent('sync_notifications', { 
              detail: newNotif 
            }));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime: Conectado a notificaciones de la empresa:', user.company_id);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime: Error al conectar con Supabase');
        }
      });

    // Limpieza al desmontar el componente (importante para no duplicar listeners)
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Se re-ejecuta si el usuario cambia (ej. login/logout)
};