import React from 'react';
import { useWorkerRoutes } from '../hooks/useWorkerRoutes';
import { FiMapPin, FiClock, FiCheckCircle, FiPlay, FiNavigation } from 'react-icons/fi';

const WorkerCalendar = ({ userId }) => {
  // --- MEJORA: Obtener el ID del storage si no viene por prop ---
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const finalUserId = userId || storedUser?.id;

  const { routes, loading, error } = useWorkerRoutes(finalUserId);

  // Si no hay ID después de buscar en ambos lugares, mostramos error inmediato
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
      <p className="text-gray-500 font-bold animate-pulse">Sincronizando tu agenda...</p>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center space-y-4">
      <div className="text-red-500 bg-red-50 p-4 rounded-2xl inline-block font-medium">
        ⚠️ {error}
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="block mx-auto text-sm text-gray-400 underline"
      >
        Reintentar conexión
      </button>
    </div>
  );

  if (!routes || routes.length === 0) return (
    <div className="bg-white m-4 p-10 rounded-3xl text-center shadow-sm border border-gray-100">
      <div className="text-4xl mb-4">📅</div>
      <p className="text-gray-400 font-bold uppercase tracking-tight">
        No tienes rutas agendadas para hoy
      </p>
      <p className="text-xs text-gray-300 mt-1">Consulta con tu supervisor si esto es un error.</p>
    </div>
  );

  return (
    <div className="px-4 py-2 space-y-4 max-w-2xl mx-auto">
      <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-8 py-4">
        {routes.map((route) => (
          <div key={route.id} className="relative pl-8">
            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-gray-50 shadow-sm ${
              route.status === 'COMPLETED' ? 'bg-[#87be00]' : 'bg-orange-400'
            }`} />
            
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-1.5 text-[#87be00] font-black text-xs uppercase">
                  <FiClock />
                  <span>{route.start_time?.slice(0, 5) || 'Horario flexible'}</span>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                  route.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {route.status}
                </span>
              </div>

              <h3 className="text-gray-800 font-black text-xl leading-none mb-1">
                {route.cadena}
              </h3>
              
              <div className="flex items-center gap-1 text-gray-400 text-xs font-bold mb-5">
                <FiMapPin className="shrink-0" />
                <span className="truncate">{route.direccion}</span>
              </div>

              <div className="flex gap-2">
                <button 
                  className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    route.status === 'COMPLETED' 
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                    : 'bg-[#87be00] text-white shadow-lg shadow-[#87be00]/20 active:scale-95'
                  }`}
                  disabled={route.status === 'COMPLETED'}
                >
                  {route.status === 'COMPLETED' ? (
                    <span className="flex items-center justify-center gap-2"><FiCheckCircle size={16}/> Visitado</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><FiPlay size={16}/> Iniciar Visita</span>
                  )}
                </button>
                
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${route.lat},${route.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-black transition-colors flex items-center justify-center"
                >
                  <FiNavigation size={18} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkerCalendar;