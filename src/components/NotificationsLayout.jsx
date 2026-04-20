import React from 'react';
import { useNotificationContext } from '../context/NotificationContext';
// 🚩 Corregido: Importamos CheckCircle y Eye de lucide-react
import { Trash2, BellOff, RefreshCcw, CheckCheck, Eye, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
 
const NotificationsLayout = ({ userRole }) => {
  const { notifications, onMarkRead, onMarkAllRead, onDelete, loading, refresh } = useNotificationContext();
  const canDelete = userRole === 'ROOT' || userRole === 'ADMIN' || userRole === 'ADMIN_CLIENTE';
  const isSupervisor = userRole === 'SUPERVISOR' || canDelete;
 
  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center animate-pulse">
        <RefreshCcw className="animate-spin text-[#87be00] mb-4" size={32} />
        <div className="font-[Outfit] font-black text-gray-300 italic uppercase tracking-widest text-xs">
          Sincronizando Alertas Cultivapp...
        </div>
      </div>
    );
  }
 
  return (
    <div className="max-w-5xl mx-auto p-4 font-[Outfit] animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-gray-900">
            Notificaciones
          </h1>
          <p className="text-[#87be00] text-[10px] font-black uppercase tracking-[0.4em] mt-2">
            Centro de Comunicación Cultivapp
          </p>
        </div>
 
        <div className="flex items-center gap-3">
          <button
            onClick={() => refresh()}
            className="p-2.5 rounded-full bg-gray-100 text-gray-400 hover:text-[#87be00] transition-all"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>
 
      {/* LISTA */}
      <div className="grid grid-cols-1 gap-4">
        {notifications.length === 0 ? (
          <div className="bg-gray-50 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
            <BellOff className="mx-auto text-gray-200 mb-4" size={40} />
            <p className="text-gray-300 font-black uppercase text-xs tracking-widest italic">
              Sin mensajes
            </p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`group relative flex items-start gap-6 p-8 rounded-[3rem] border-2 transition-all duration-500 ${
                !n.is_read
                  ? 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'
                  : 'bg-gray-50/50 border-transparent opacity-80'
              }`}
            >
              <div className={`p-4 rounded-2xl shrink-0 text-xl shadow-sm ${
                !n.is_read ? 'bg-[#87be00] text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {n.scope === 'global' ? '🌍' : '🔔'}
              </div>
 
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h3 className={`text-xl font-black italic uppercase tracking-tighter truncate ${
                    !n.is_read ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {n.title}
                  </h3>
                  
                  {/* DOBLE CHECK ESTILO WHATSAPP */}
                  <div className="flex flex-col items-end gap-1">
                    {n.is_read ? (
                      <div className="flex items-center gap-1 text-[#34B7F1]"> 
                        <CheckCheck size={18} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Visto</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-300"> 
                        <CheckCheck size={18} strokeWidth={2} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Entregado</span>
                      </div>
                    )}
                  </div>
                </div>
 
                <p className={`text-sm font-medium leading-relaxed max-w-2xl ${!n.is_read ? 'text-gray-600' : 'text-gray-400'}`}>
                  {n.message}
                </p>
 
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      {n.created_at ? format(new Date(n.created_at), "eeee dd 'de' MMMM", { locale: es }) : '---'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {n.is_read && n.read_at && isSupervisor && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-[#34B7F1] uppercase italic bg-[#34B7F1]/10 px-3 py-1 rounded-full">
                        <Eye size={12} />
                        Leído a las {format(new Date(n.read_at), "HH:mm 'Hrs'", { locale: es })}
                      </div>
                    )}

                    {!n.is_read && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className="bg-[#87be00] text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[#87be00]/20"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              </div>
 
              {canDelete && (
                <button
                  onClick={() => onDelete(n.id)}
                  className="p-3 rounded-2xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
 
export default NotificationsLayout;