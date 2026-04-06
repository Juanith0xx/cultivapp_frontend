import { useState, useEffect } from 'react'; // 👈 Añadimos useEffect
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

const panelVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 } 
  },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }
};

const itemVariants = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -10 }
};

const Notifications = ({ notifications, unreadCount, onMarkAsRead, setNotifications, setUnreadCount }) => {
  const [isOpen, setIsOpen] = useState(false);

  // --- 🔔 LÓGICA DE ACTUALIZACIÓN EN TIEMPO REAL ---
  useEffect(() => {
    const handleNewNotification = (event) => {
      const freshNotif = event.detail;

      // 1. Actualizamos el estado de la lista (inyectamos al principio)
      if (setNotifications) {
        setNotifications((prev) => {
          // Evitar duplicados por si acaso
          const exists = prev.find(n => n.id === freshNotif.id);
          if (exists) return prev;
          return [freshNotif, ...prev];
        });
      }

      // 2. Incrementamos el contador de no leídas
      if (setUnreadCount) {
        setUnreadCount(prev => prev + 1);
      }
    };

    // Escuchamos el evento que dispara el Hook useNotifications
    window.addEventListener('sync_notifications', handleNewNotification);
    
    return () => window.removeEventListener('sync_notifications', handleNewNotification);
  }, [setNotifications, setUnreadCount]);

  return (
    <div className="relative">
      {/* --- BOTÓN DE LA CAMPANA --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-600 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors duration-200"
      >
        <BellIcon className="h-6 w-6" />
        
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              key="badge"
              initial={{ scale: 0 }}
              animate={{ 
                scale: [1, 1.4, 1],
                transition: { repeat: Infinity, repeatDelay: 3, duration: 0.6 }
              }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm pointer-events-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* --- PANEL DESPLEGABLE --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 mt-3 z-20 w-80 md:w-96 rounded-lg bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 origin-top-right"
            >
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm italic">No hay mensajes aún</div>
                ) : (
                  <ul className="space-y-3">
                    <AnimatePresence initial={false}>
                      {notifications.map((notif) => (
                        <motion.li 
                          key={notif.id}
                          layout // 👈 Animación suave cuando se añaden nuevas
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`flex gap-3 p-3 rounded-md transition-all border ${
                            notif.is_read 
                              ? 'bg-gray-50 border-transparent opacity-80' 
                              : 'bg-green-50 border-green-100 shadow-sm'
                          }`}
                        >
                          <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center shadow-inner ${
                            notif.scope === 'global' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                             {notif.scope === 'global' ? '🌍' : '🔔'}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className={`text-sm leading-tight ${notif.is_read ? 'text-gray-600' : 'font-bold text-gray-900'}`}>
                                {notif.title}
                              </p>
                              {!notif.is_read && (
                                <button 
                                  onClick={() => onMarkAsRead(notif.id)} 
                                  className="text-[10px] text-green-700 font-bold bg-green-200/50 px-2 py-0.5 rounded-full hover:bg-green-200 transition-colors"
                                >
                                  Leída
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-[9px] font-mono text-gray-400 mt-2 uppercase tracking-tighter">
                              {new Date(notif.created_at).toLocaleString('es-CL')}
                            </p>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;