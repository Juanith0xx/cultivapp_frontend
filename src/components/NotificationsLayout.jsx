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
      <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center animate-pulse">
        <RefreshCcw className="animate-spin text-[#87be00] mb-4" size={32} />
        <div className="font-[Outfit] font-black text-gray-300 italic uppercase tracking-widest text-[10px] md:text-xs">
          Sincronizando Alertas Cultivapp...
        </div>
      </div>
    );
  }
 
  return (
    // 🚩 Ajustamos el padding general para móviles (p-3 sm:p-4 md:p-6)
    <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6 font-[Outfit] animate-in fade-in duration-700 pb-10">
      
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 md:mb-10 gap-4 sm:gap-0 px-1 md:px-0">
        <div>
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-gray-900">
            Notificaciones
          </h1>
          <p className="text-[#87be00] text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] mt-1.5 md:mt-2">
            Centro de Comunicación Cultivapp
          </p>
        </div>
 
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => refresh()}
            className="p-2 md:p-2.5 rounded-full bg-gray-100 text-gray-400 hover:text-[#87be00] transition-all shadow-sm"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>
 
      {/* LISTA RESPONSIVA */}
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {notifications.length === 0 ? (
          <div className="bg-gray-50 rounded-[2rem] md:rounded-[3rem] p-12 md:p-20 text-center border-2 border-dashed border-gray-100 mx-1 md:mx-0">
            <BellOff className="mx-auto text-gray-200 mb-3 md:mb-4" size={32} />
            <p className="text-gray-300 font-black uppercase text-[10px] md:text-xs tracking-widest italic">
              Sin mensajes
            </p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              // 🚩 Paddings reducidos en móvil y flex ajustado
              className={`group relative flex items-start gap-3 md:gap-6 p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border-2 transition-all duration-500 overflow-hidden sm:overflow-visible ${
                !n.is_read
                  ? 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'
                  : 'bg-gray-50/50 border-transparent opacity-80'
              }`}
            >
              {/* ÍCONO */}
              <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0 text-base md:text-xl shadow-sm ${
                !n.is_read ? 'bg-[#87be00] text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {n.scope === 'global' ? '🌍' : '🔔'}
              </div>
 
              <div className="flex-1 min-w-0">
                {/* 🚩 pr-10 en móvil evita que el título choque con el botón de borrar (que es position absolute) */}
                <div className="flex justify-between items-start mb-1.5 md:mb-2 gap-2 md:gap-4 pr-10 sm:pr-0">
                  <h3 className={`text-base md:text-xl font-black italic uppercase tracking-tighter truncate leading-tight ${
                    !n.is_read ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {n.title}
                  </h3>
                  
                  {/* DOBLE CHECK ESTILO WHATSAPP (Ajustado para móvil) */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {n.is_read ? (
                      <div className="flex items-center gap-1 text-[#34B7F1]"> 
                        <CheckCheck className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} />
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden xs:inline">Visto</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-300"> 
                        <CheckCheck className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2} />
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden xs:inline">Entregado</span>
                      </div>
                    )}
                  </div>
                </div>
 
                {/* MENSAJE */}
                <p className={`text-xs md:text-sm font-medium leading-relaxed max-w-full md:max-w-2xl mt-1 md:mt-0 ${!n.is_read ? 'text-gray-600' : 'text-gray-400'}`}>
                  {n.message}
                </p>
 
                {/* BOTTOM ROW (Apilado en móvil, en línea en desktop) */}
                <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      {n.created_at ? format(new Date(n.created_at), "eeee dd 'de' MMMM", { locale: es }) : '---'}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {n.is_read && n.read_at && isSupervisor && (
                      <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-[#34B7F1] uppercase italic bg-[#34B7F1]/10 px-2.5 md:px-3 py-1 rounded-full">
                        <Eye className="w-3 h-3 md:w-3 md:h-3 shrink-0" />
                        <span className="truncate">
                           Leído {format(new Date(n.read_at), "HH:mm 'Hrs'", { locale: es })}
                        </span>
                      </div>
                    )}

                    {!n.is_read && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className="bg-[#87be00] text-white px-4 py-2 md:px-5 md:py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[#87be00]/20 w-full sm:w-auto text-center"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              </div>
 
              {/* BOTÓN ELIMINAR (Flotante en móvil, estático en desktop) */}
              {canDelete && (
                <button
                  onClick={() => onDelete(n.id)}
                  className="absolute top-4 right-4 sm:static p-2 md:p-3 rounded-xl md:rounded-2xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm shrink-0"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
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