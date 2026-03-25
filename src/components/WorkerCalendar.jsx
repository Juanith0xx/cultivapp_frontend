import React from 'react';
import { useWorkerRoutes } from '../hooks/useWorkerRoutes';
import { FiMapPin, FiClock, FiCheckCircle, FiPlay, FiNavigation, FiPackage } from 'react-icons/fi';
import WeeklyStatus from './MiniCalendario'; 
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const WorkerCalendar = ({ userId, onOpenScanner }) => {
  const { routes, loading, mutate } = useWorkerRoutes(userId);
  const today = new Date().getDay();

  const handleStartVisit = async (route) => {
    const toastId = toast.loading("Validando GPS...");

    if (!navigator.geolocation) {
      return toast.error("GPS no soportado", { id: toastId });
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await api.post(`/api/routes/${route.id}/check-in`, {
          lat_in: pos.coords.latitude,
          lng_in: pos.coords.longitude
        });

        toast.success("¡Check-in exitoso!", { id: toastId });
        
        // 🚩 PASO CRÍTICO:
        // 1. Actualizamos los datos del hook localmente
        await mutate();
        // 2. Ejecutamos la función que dispara el cambio en el Dashboard
        onOpenScanner(); 

      } catch (error) {
        const errorMsg = error.response?.data?.message || "Error en Check-in";
        toast.error(errorMsg, { id: toastId });
      }
    }, () => toast.error("Por favor, activa el GPS", { id: toastId }));
  };

  if (loading && !routes.length) return <div className="p-20 text-center text-[10px] font-bold uppercase text-gray-400">Cargando rutas...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
        <WeeklyStatus activeDay={today} />
      </div>

      <div className="relative border-l-2 border-dashed border-gray-100 ml-4 space-y-8 py-4">
        {routes.map((route) => (
          <div key={route.id} className="relative pl-8">
            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-md ${
              route.status === 'COMPLETED' ? 'bg-[#87be00]' : 
              route.status === 'IN_PROGRESS' ? 'bg-blue-500 animate-pulse' : 'bg-orange-400'
            }`} />
            
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div className="text-[#87be00] font-black text-[11px] uppercase bg-[#87be00]/5 px-3 py-1 rounded-full">
                  <FiClock className="inline mr-1"/> {route.start_time?.slice(0, 5)}
                </div>
                <span className="text-[9px] font-black uppercase text-gray-400">{route.status}</span>
              </div>

              <h3 className="text-gray-900 font-black text-xl leading-none mb-1 uppercase italic">{route.cadena}</h3>
              <p className="text-gray-400 text-[10px] font-bold mb-5 flex items-start gap-1">
                <FiMapPin className="text-[#87be00]" /> {route.direccion}
              </p>

              <div className="flex gap-2">
                {route.status === 'PENDING' ? (
                  <button onClick={() => handleStartVisit(route)} className="flex-1 py-4 bg-[#87be00] text-white rounded-2xl font-black text-[10px] uppercase">
                    Iniciar Visita
                  </button>
                ) : route.status === 'IN_PROGRESS' ? (
                  <button onClick={onOpenScanner} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase">
                    Continuar Gestión
                  </button>
                ) : (
                  <button disabled className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase">
                    Completado
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkerCalendar;