import { useNotificationContext } from '../context/NotificationContext';
import { Trash2, CheckCircle, BellOff } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationsLayout = ({ userRole }) => {
  const { notifications, onMarkRead, onDelete, loading } = useNotificationContext();
  const canDelete = userRole === 'ROOT' || userRole === 'ADMIN';

  if (loading) return <div className="p-20 text-center font-black text-gray-300 animate-pulse italic">Sincronizando Alertas Cultivapp...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 font-[Outfit]">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Alertas</h1>
          <p className="text-[#87be00] text-[10px] font-black uppercase tracking-[0.4em] mt-2">Centro de Comunicación SaaS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notifications.length === 0 ? (
          <div className="bg-gray-50 rounded-[3rem] p-20 text-center">
            <BellOff className="mx-auto text-gray-200 mb-4" size={40} />
            <p className="text-gray-300 font-black uppercase text-xs tracking-widest italic">No hay mensajes en el historial</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`group relative flex items-start gap-6 p-8 rounded-[3rem] border-2 transition-all duration-500 ${!n.is_read ? 'bg-white border-gray-100 shadow-xl shadow-gray-200/50' : 'bg-gray-50 border-transparent opacity-60'}`}>
              <div className={`p-4 rounded-2xl ${!n.is_read ? 'bg-[#87be00]/10 text-[#87be00]' : 'bg-gray-200 text-gray-400'}`}>
                {n.scope === 'global' ? '🌍' : '🔔'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">{n.title}</h3>
                  <span className="text-[10px] font-bold text-gray-300 uppercase">
                    {format(new Date(n.created_at), "HH:mm 'Hrs'", { locale: es })}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-2xl">{n.message}</p>
                <div className="mt-6 flex items-center gap-4">
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(n.created_at), "eeee dd 'de' MMMM", { locale: es })}</span>
                   {!n.is_read && <button onClick={() => onMarkRead(n.id)} className="text-[9px] font-black text-[#87be00] flex items-center gap-1 uppercase tracking-widest"><CheckCircle size={12}/> Marcar Leída</button>}
                </div>
              </div>
              {canDelete && (
                <button onClick={() => onDelete(n.id)} className="absolute top-8 right-8 p-3 rounded-full bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
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