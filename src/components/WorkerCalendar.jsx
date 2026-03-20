import React from 'react';
import { useWorkerRoutes } from '../hooks/useWorkerRoutes';
import { FiMapPin, FiClock, FiCheckCircle, FiPlay, FiNavigation } from 'react-icons/fi';
// 🚩 IMPORTANTE: Traemos el mini calendario
import WeeklyStatus from './MiniCalendario'; 

const WorkerCalendar = ({ userId }) => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const finalUserId = userId || storedUser?.id;

  const { routes, loading, error } = useWorkerRoutes(finalUserId);

  // Obtener el día de la semana actual (0-6) para marcarlo en el mini calendario
  const today = new Date().getDay();

  if (!finalUserId) {
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        Error: No se pudo identificar al usuario logueado.
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-10 h-10 border-4 border-[#87be00] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Sincronizando tu agenda...</p>
    </div>
  );

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto font-[Outfit]">
      
      {/* 🚩 CABECERA CON EL MINI CALENDARIO RECUPERADO */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 text-center space-y-4">
        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Tu Horario Semanal</h2>
        <WeeklyStatus activeDay={today} />
        <p className="text-[9px] font-bold text-[#87be00] uppercase tracking-widest">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* LISTADO DE RUTAS */}
      {!routes || routes.length === 0 ? (
        <div className="bg-white p-12 rounded-[3rem] text-center shadow-sm border border-gray-100 animate-in fade-in duration-500">
          <div className="text-5xl mb-4">☕</div>
          <p className="text-gray-400 font-black uppercase tracking-tight text-sm">
            Día libre o sin rutas asignadas
          </p>
          <p className="text-[10px] text-gray-300 mt-2 font-bold uppercase">Disfruta tu descanso</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-dashed border-gray-100 ml-4 space-y-8 py-4">
          {routes.map((route) => (
            <div key={route.id} className="relative pl-8 animate-in slide-in-from-left duration-500">
              {/* Indicador de estado en la línea de tiempo */}
              <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-md transition-colors ${
                route.status === 'COMPLETED' ? 'bg-[#87be00]' : 'bg-orange-400'
              }`} />
              
              <div className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-gray-100/50 transition-all ${!route.is_active && route.status !== 'COMPLETED' ? 'opacity-75' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-[#87be00] font-black text-[11px] uppercase tracking-tighter bg-[#87be00]/5 px-3 py-1 rounded-full">
                    <FiClock />
                    <span>{route.start_time?.slice(0, 5) || '09:00'}</span>
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    route.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {route.status === 'COMPLETED' ? 'Visitado' : 'Pendiente'}
                  </span>
                </div>

                <div className="mb-5">
                  <h3 className="text-gray-900 font-black text-2xl tracking-tighter leading-none mb-1 uppercase">
                    {route.cadena}
                  </h3>
                  <p className="text-[10px] font-black text-[#87be00] uppercase tracking-widest mb-2">
                    {route.comuna_name || 'Sin Comuna'}
                  </p>
                  <div className="flex items-start gap-1.5 text-gray-400 text-[11px] font-bold">
                    <FiMapPin className="shrink-0 mt-0.5 text-gray-300" />
                    <span className="leading-tight">{route.direccion}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                      route.status === 'COMPLETED' 
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100' 
                      : 'bg-[#87be00] text-white shadow-lg shadow-[#87be00]/20 active:scale-95 hover:bg-[#76a600]'
                    }`}
                    disabled={route.status === 'COMPLETED'}
                  >
                    {route.status === 'COMPLETED' ? (
                      <span className="flex items-center justify-center gap-2"><FiCheckCircle size={16}/> ¡Logrado!</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><FiPlay size={16}/> Iniciar Visita</span>
                    )}
                  </button>
                  
                  {/* 🚩 CORRECCIÓN: Enlace de Google Maps arreglado */}
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${route.local_lat},${route.local_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-900 text-white w-14 rounded-2xl hover:bg-black transition-colors flex items-center justify-center shadow-lg shadow-gray-200 active:scale-95"
                  >
                    <FiNavigation size={20} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerCalendar;