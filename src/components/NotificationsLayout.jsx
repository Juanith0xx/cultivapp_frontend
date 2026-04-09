import React from 'react';
import { useNotificationContext } from '../context/NotificationContext';
import { Trash2, CheckCircle, BellOff, RefreshCcw, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
 
const NotificationsLayout = ({ userRole }) => {
  const { notifications, onMarkRead, onMarkAllRead, onDelete, loading, refresh } = useNotificationContext();
  const canDelete = userRole === 'ROOT' || userRole === 'ADMIN' || userRole === 'ADMIN_CLIENTE';
  const hasUnread = notifications.some(n => !n.is_read);
 
  // ✅ No forzamos refresh aquí — el Realtime ya mantiene el estado actualizado.
  // El fetch inicial lo hace el contexto al montar.
 
  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center animate-pulse">
        <RefreshCcw className="animate-spin text-[#87be00] mb-4" size={32} />
        <div className="font-[Outfit] font-black text-gray-300 italic uppercase tracking-widest">
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
          {/* Marcar todas como leídas */}
          {hasUnread && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-2 text-[9px] font-black text-[#87be00] uppercase tracking-widest bg-[#87be00]/10 px-4 py-2 rounded-full hover:bg-[#87be00]/20 transition-all"
            >
              <CheckCheck size={12} />
              Marcar todas
            </button>
          )}
 
          {/* Contador total */}
          {notifications.length > 0 && (
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-full">
              Total: {notifications.length}
            </div>
          )}
 
          {/* Refresh manual */}
          <button
            onClick={() => refresh()}
            className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-[#87be00] hover:bg-[#87be00]/10 transition-all"
            title="Actualizar"
          >
            <RefreshCcw size={14} />
          </button>
        </div>
      </div>
 
      {/* LISTA */}
      <div className="grid grid-cols-1 gap-4">
        {notifications.length === 0 ? (
          <div className="bg-gray-50 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
            <BellOff className="mx-auto text-gray-200 mb-4" size={40} />
            <p className="text-gray-300 font-black uppercase text-xs tracking-widest italic">
              No hay mensajes en el historial
            </p>
            <button
              onClick={() => refresh()}
              className="mt-4 text-[9px] font-black text-[#87be00] uppercase hover:underline"
            >
              Reintentar conexión
            </button>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`group relative flex items-start gap-6 p-8 rounded-[3rem] border-2 transition-all duration-500 ${
                !n.is_read
                  ? 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'
                  : 'bg-gray-50/50 border-transparent opacity-70'
              }`}
            >
              {/* Icono scope */}
              <div className={`p-4 rounded-2xl shrink-0 text-xl ${
                !n.is_read ? 'bg-[#87be00]/10' : 'bg-gray-200'
              }`}>
                {n.scope === 'global' ? '🌍' : n.scope === 'local' ? '🏢' : '🔔'}
              </div>
 
              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h3 className={`text-xl font-black italic uppercase tracking-tighter truncate ${
                    !n.is_read ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {n.title}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-300 uppercase shrink-0 mt-1">
                    {n.created_at
                      ? format(new Date(n.created_at), "HH:mm 'Hrs'", { locale: es })
                      : '--:--'}
                  </span>
                </div>
 
                <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-2xl">
                  {n.message}
                </p>
 
                <div className="mt-6 flex items-center gap-6">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {n.created_at
                      ? format(new Date(n.created_at), "eeee dd 'de' MMMM", { locale: es })
                      : 'Sin fecha'}
                  </span>
 
                  {/* Badge de scope */}
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-gray-100 text-gray-400">
                    {n.scope}
                  </span>
 
                  {!n.is_read && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="text-[9px] font-black text-[#87be00] flex items-center gap-1 uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      <CheckCircle size={12} /> Marcar Leída
                    </button>
                  )}
                </div>
              </div>
 
              {/* Botón eliminar */}
              {canDelete && (
                <button
                  onClick={() => onDelete(n.id)}
                  className="absolute top-8 right-8 p-3 rounded-full bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-lg"
                  title="Eliminar notificación"
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