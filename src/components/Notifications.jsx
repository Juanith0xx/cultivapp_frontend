import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, BellRing } from 'lucide-react';
import { useNotificationContext } from '../context/NotificationContext';

// 🚩 Importación del archivo desde tu carpeta de assets
import soundFile from '../assets/sound/notificacion.mp3';

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, onMarkRead } = useNotificationContext();
  
  // 🚩 Referencia para el reproductor usando el archivo importado
  const audioPlayer = useRef(new Audio(soundFile));
  // 🚩 Referencia para el conteo previo
  const prevCount = useRef(unreadCount);

  useEffect(() => {
    // Solo suena si el nuevo conteo es mayor (llegó una nueva notificación)
    if (unreadCount > prevCount.current) {
      playNotificationSound();
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  const playNotificationSound = () => {
    try {
      audioPlayer.current.currentTime = 0;
      audioPlayer.current.play();
    } catch (error) {
      // Los navegadores bloquean el audio automático hasta la primera interacción del usuario
      console.warn("Audio bloqueado por el navegador hasta interacción del usuario.");
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await onMarkRead(id);
    } catch (error) {
      console.error("No se pudo notificar la lectura al sistema");
    }
  };

  return (
    // 🚩 relative estricto aquí para que en Desktop el modal se ancle a esta campana
    <div className="relative font-[Outfit]">
      
      {/* 🔔 BOTÓN CAMPANA */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative p-2.5 md:p-3 rounded-2xl transition-all duration-300 group ${
          isOpen ? 'bg-[#87be00] text-white shadow-lg shadow-[#87be00]/30' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <Bell size={18} className={`md:w-5 md:h-5 ${isOpen ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'}`} />
        
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center border-2 md:border-[3px] border-white shadow-sm"
          >
            {unreadCount > 9 ? '+9' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* FONDO OSCURO (OVERLAY) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100]" 
              onClick={() => setIsOpen(false)}
            ></motion.div>
            
            {/* PANEL DE NOTIFICACIONES */}
            <motion.div 
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 100 }}
              className={`
                /* 📱 VISTA MÓVIL: Bottom Sheet (Fijado abajo, ancho total, esquinas redondas solo arriba) */
                fixed bottom-0 left-0 right-0 w-full z-[110] bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)]
                
                /* 💻 VISTA DESKTOP: Popover (Flotante bajo la campana, ancho limitado, todas las esquinas redondas) */
                md:absolute md:bottom-auto md:top-full md:left-auto md:right-0 md:mt-4 md:w-[22rem] md:rounded-[2.5rem] md:shadow-2xl
                
                overflow-hidden flex flex-col max-h-[85vh] md:max-h-[500px]
              `}
            >
              {/* Pillilla gris (Handle) en móviles para indicar arrastre/cierre */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 md:hidden"></div>

              {/* HEADER */}
              <div className="p-5 md:p-6 bg-gray-900 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#87be00]/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#87be00] italic">Centro de</span>
                  <h3 className="text-base md:text-lg font-black uppercase italic leading-none">Avisos</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors">
                  <X size={18} className="text-white"/>
                </button>
              </div>

              {/* LISTA */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC] custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 opacity-20">
                    <BellRing size={40} strokeWidth={1} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Bandeja Vacía</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-8 md:pb-0">
                    {notifications.map(n => (
                      <motion.div 
                        layout
                        key={n.id} 
                        className={`p-4 md:p-5 rounded-[1.5rem] md:rounded-[1.8rem] transition-all relative border ${
                          !n.is_read 
                          ? 'bg-white border-green-100 shadow-md shadow-green-900/5' 
                          : 'bg-white/40 border-transparent opacity-70'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <div className="flex flex-col pr-2">
                            {!n.is_read ? (
                                <span className="text-[8px] font-black text-[#87be00] uppercase tracking-tighter mb-1">Pendiente</span>
                            ) : (
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1 flex items-center gap-1">
                                    <Check size={10} strokeWidth={3} /> Visto
                                </span>
                            )}
                            <h4 className={`text-[10px] md:text-[11px] font-black uppercase leading-tight italic ${
                              !n.is_read ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {n.title}
                            </h4>
                          </div>
                          
                          {!n.is_read && (
                            <button 
                              onClick={() => handleMarkAsRead(n.id)} 
                              className="shrink-0 bg-[#87be00] p-2 md:p-2.5 rounded-xl text-white active:scale-95 transition-all shadow-lg shadow-[#87be00]/20 hover:bg-[#76a600]"
                            >
                              <Check size={14} strokeWidth={4} />
                            </button>
                          )}
                        </div>

                        <p className={`text-[10px] md:text-[11px] font-medium leading-relaxed mb-3 ${!n.is_read ? 'text-gray-600' : 'text-gray-400'}`}>
                          {n.message}
                        </p>

                        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                          <span className="text-[8px] font-black text-gray-300 uppercase italic">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Relleno visual en móviles para que los últimos avisos no queden debajo de las barras de navegación de iOS/Android */}
              <div className="h-6 md:hidden bg-[#F8FAFC]"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;