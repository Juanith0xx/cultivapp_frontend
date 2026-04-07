import React, { useState } from 'react';
import { FiBell, FiPlus, FiList, FiCheck, FiFilter } from 'react-icons/fi';
import NotificationManager from '../pages/root/NotificationManager'; // 👈 Importamos el gestor que ya tienes

const NotificationsLayout = ({ notifications, onMarkAsRead, onMarkAllRead, userRole }) => {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' o 'manage'

  // Solo Root y Admin pueden ver la pestaña de gestión
  const canManage = userRole === 'ROOT' || userRole === 'ADMIN';

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 px-4">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase italic leading-none mb-2">
            Centro de Alertas
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-[#87be00] px-2 py-0.5 rounded-md uppercase">
              {userRole}
            </span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Gestión y Comunicación Cultivapp
            </p>
          </div>
        </div>

        {/* SWITCH DE PESTAÑAS (Solo para Admin/Root) */}
        {canManage && (
          <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
            <button 
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                activeTab === 'inbox' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FiList size={14} /> Recibidas
            </button>
            <button 
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                activeTab === 'manage' ? 'bg-[#87be00] text-white shadow-lg shadow-[#87be00]/20' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FiPlus size={14} /> Nueva Alerta
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO VARIABLE */}
      <div className="transition-all duration-300">
        {activeTab === 'inbox' ? (
          /* --- VISTA DE LISTADO (Lo que ya teníamos) --- */
          <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
             {/* ... aquí va el map de tus notificaciones ... */}
             <div className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs">
                Bandeja de entrada de {userRole}
             </div>
          </div>
        ) : (
          /* --- VISTA DE CREACIÓN (Tu NotificationManager) --- */
          <div className="animate-in slide-in-from-right-4 duration-500">
            <NotificationManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsLayout;