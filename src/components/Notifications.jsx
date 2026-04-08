import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useNotificationContext } from '../context/NotificationContext';

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, onMarkRead } = useNotificationContext();

  return (
    <div className="relative font-[Outfit]">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-500 hover:text-[#87be00] transition-all">
        <Bell size={22} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-white shadow-2xl rounded-[2rem] border border-gray-100 z-[110] overflow-hidden p-2"
            >
              <div className="p-4 flex justify-between items-center border-b border-gray-50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Notificaciones</span>
                <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-gray-900"><X size={16}/></button>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-gray-200 text-[10px] font-bold uppercase italic">Bandeja Vacía</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 mb-1 rounded-2xl transition-all ${!n.is_read ? 'bg-green-50' : 'bg-white opacity-50'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-[11px] font-black uppercase text-gray-800 leading-tight">{n.title}</h4>
                        {!n.is_read && <button onClick={() => onMarkRead(n.id)} className="text-[8px] font-black text-[#87be00] uppercase">OK</button>}
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2 font-medium">{n.message}</p>
                    </div>
                  ))
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