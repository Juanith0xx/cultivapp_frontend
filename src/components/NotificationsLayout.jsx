import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiBell, FiPlus, FiList, FiCheckCircle, FiInfo, FiClock } from 'react-icons/fi';
import NotificationManager from '../pages/root/NotificationManager'; 
import { format } from "date-fns";
import { es } from "date-fns/locale";

const NotificationsLayout = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('inbox'); 

  // 🚩 FIX: Extraemos del contexto con valores por defecto para evitar el error de "undefined"
  const context = useOutletContext() || {};
  const { 
    notifications = [], 
    handleMarkAsRead = () => {}, 
    loading = false 
  } = context;

  const canManage = userRole === 'ROOT' || userRole === 'ADMIN';

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700 font-[Outfit]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 px-4">
        <div>
          <h1 className="text-5xl font-black text-gray-800 tracking-tighter uppercase italic leading-none mb-2">
            Centro de Alertas
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-white bg-[#87be00] px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-[#87be00]/20">
              {userRole || 'SISTEMA'}
            </span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
              Gestión y Comunicación Cultivapp
            </p>
          </div>
        </div>

        {/* TABS */}
        {canManage && (
          <div className="bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-[2rem] flex gap-1 border border-gray-200/50">
            <button 
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'inbox' ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FiList size={16} /> Recibidas
            </button>
            <button 
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'manage' ? 'bg-[#87be00] text-white shadow-xl shadow-[#87be00]/30' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FiPlus size={16} /> Nueva Alerta
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="transition-all duration-500">
        {activeTab === 'inbox' ? (
          <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden min-h-[600px]">
             
             {/* HEADER BANDEJA */}
             <div className="p-10 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-3">
                    <FiBell size={18} className="text-[#87be00]"/> Bandeja de Entrada
                </span>
                <span className="text-[10px] font-black text-[#87be00] uppercase bg-[#87be00]/10 px-4 py-1.5 rounded-full">
                    {notifications.length} Mensajes Totales
                </span>
             </div>

             <div className="p-8 space-y-4">
                {loading ? (
                    <div className="py-24 text-center">
                        <div className="w-12 h-12 border-4 border-[#87be00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest italic">Sincronizando alertas...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-24 text-center">
                        <FiBell size={60} className="mx-auto text-gray-100 mb-6" />
                        <p className="text-gray-300 font-black uppercase text-sm tracking-widest italic">Sin notificaciones activas</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                                className={`group relative flex items-start gap-8 p-8 rounded-[3rem] border-2 transition-all duration-300 cursor-pointer ${
                                    n.is_read 
                                    ? "bg-gray-50/40 border-transparent opacity-60 grayscale-[0.5]" 
                                    : "bg-white border-gray-50 shadow-xl shadow-gray-200/40 hover:border-[#87be00] hover:translate-x-2"
                                }`}
                            >
                                <div className={`shrink-0 p-5 rounded-[1.5rem] ${n.is_read ? "bg-gray-100 text-gray-300" : "bg-[#87be00]/10 text-[#87be00]"}`}>
                                    <FiInfo size={24} />
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`text-lg font-black uppercase tracking-tighter italic leading-none ${n.is_read ? "text-gray-400" : "text-gray-800"}`}>
                                            {n.title}
                                        </h4>
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1">
                                            <FiClock /> {format(new Date(n.created_at), "HH:mm 'Hrs'", { locale: es })}
                                        </span>
                                    </div>
                                    <p className={`text-sm font-medium leading-relaxed max-w-2xl ${n.is_read ? "text-gray-400" : "text-gray-500"}`}>
                                        {n.message}
                                    </p>
                                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-6">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                                            {format(new Date(n.created_at), "eeee dd 'de' MMMM", { locale: es })}
                                        </span>
                                        {n.is_read && (
                                            <span className="text-[9px] font-black text-[#87be00] uppercase tracking-widest flex items-center gap-1">
                                                <FiCheckCircle /> Leída
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-8 duration-700">
            <NotificationManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsLayout;