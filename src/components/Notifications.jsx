import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react'; // Añadí Check
import { useNotificationContext } from '../context/NotificationContext';

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, onMarkRead } = useNotificationContext();

  // Función para marcar como leído y mantener el menú abierto si quieres
  const handleMarkAsRead = async (id) => {
    await onMarkRead(id);
  };

  return (
    <div className="relative font-[Outfit]">
      {/* Botón Campana */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-500 hover:text-[#87be00] transition-all focus:outline-none"
      >
        <Bell size={22} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white"
          >
            {unreadCount > 9 ? '+9' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay transparente para cerrar al hacer clic fuera */}
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 bg-white shadow-2xl rounded-[2rem] border border-gray-100 z-[110] overflow-hidden p-2"
            >
              <div className="p-4 flex justify-between items-center border-b border-gray-50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                </span>
                <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-gray-900">
                  <X size={16}/>
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-gray-200 text-[10px] font-bold uppercase italic">
                    Bandeja Vacía
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-4 mb-2 rounded-2xl transition-all border ${
                        !n.is_read 
                        ? 'bg-green-50 border-green-100' 
                        : 'bg-white border-transparent opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className={`text-[11px] font-black uppercase leading-tight ${
                          !n.is_read ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {n.title}
                        </h4>
                        {!n.is_read && (
                          <button 
                            onClick={() => handleMarkAsRead(n.id)} 
                            className="bg-white p-1 rounded-full shadow-sm text-[#87be00] hover:bg-[#87be00] hover:text-white transition-colors"
                            title="Marcar como leído"
                          >
                            <Check size={10} strokeWidth={4} />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[8px] text-gray-400 uppercase mt-2 block font-bold">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #87be00;
        }
      `}</style>
    </div>
  );
};

export default Notifications;