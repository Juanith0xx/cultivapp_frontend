import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkerRoutes } from '../hooks/useWorkerRoutes';
import { FiMapPin, FiClock, FiCheckCircle, FiPlay, FiNavigation, FiSend } from 'react-icons/fi';
import WeeklyStatus from './MiniCalendario'; 
import api from '../api/apiClient';
import toast from 'react-hot-toast';

const WorkerCalendar = ({ userId }) => {
  const navigate = useNavigate();
  
  // 🚩 LOG 1: Verificar carga del archivo
  console.log("%c--- VERSION NUEVA CARGADA (4:15 PM) ---", "background: blue; color: white; padding: 5px;");

  const { routes, loading, mutate } = useWorkerRoutes(userId);
  const [localRoutes, setLocalRoutes] = useState([]);

  useEffect(() => {
    if (routes) {
      // 🚩 LOG 2: Ver qué llega de la base de datos exactamente
      console.log("📡 DATA RECIBIDA:", routes);
      setLocalRoutes(routes);
    }
  }, [routes]);

  const handleRouteAction = async (route) => {
    const s = route.status?.trim().toUpperCase().replace(/[\s-]/g, '_');
    const enCurso = ['IN_PROGRESS', 'EN_CURSO', 'EN_PROCESO'].includes(s) || route.lat_in !== null;

    // 🚩 LOG 3: Ver qué pasa al hacer click
    console.log("🖱️ CLICK EN:", route.cadena);
    console.log("🔍 ESTADO DETECTADO:", s);
    console.log("❓ ¿ESTÁ EN CURSO?:", enCurso);

    if (enCurso) {
      console.log("✈️ NAVEGANDO A:", `/usuario/reporte/${route.id}`);
      navigate(`/usuario/reporte/${route.id}`);
      return;
    }

    // Lógica de inicio normal...
    try {
      toast.loading("Iniciando...", { id: 'gps' });
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await api.patch(`/routes/${route.id}/start`, {
          lat_in: pos.coords.latitude,
          lng_in: pos.coords.longitude
        });
        toast.success("Iniciado", { id: 'gps' });
        if (mutate) mutate();
        navigate(`/usuario/reporte/${route.id}`);
      });
    } catch (err) {
      toast.error("Error al iniciar");
    }
  };

  if (loading && localRoutes.length === 0) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto font-[Outfit]">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
        <WeeklyStatus activeDay={new Date().getDay()} />
      </div>

      <div className="relative border-l-2 border-dashed border-gray-100 ml-4 space-y-8 py-4">
        {localRoutes.map((route) => {
          const s = route.status?.trim().toUpperCase().replace(/[\s-]/g, '_');
          const terminado = ['COMPLETED', 'OK', 'FINALIZADO'].includes(s);
          
          // 🚩 LOG 4: Ver cómo se evalúa cada fila
          const enCurso = !terminado && (['IN_PROGRESS', 'EN_CURSO', 'EN_PROCESO'].includes(s) || route.lat_in !== null);

          return (
            <div key={route.id} className="relative pl-8 mb-8">
              <div 
                className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white transition-all ${
                  terminado ? 'bg-[#87be00]' : enCurso ? 'bg-blue-600 animate-pulse' : 'bg-orange-400'
                }`} 
              />
              
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-[#87be00] font-black text-[11px] uppercase bg-[#87be00]/5 px-3 py-1 rounded-full">{route.start_time?.slice(0, 5)} HRS</div>
                  <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase bg-gray-50">
                    {route.status}
                  </span>
                </div>

                <h3 className="font-black text-2xl uppercase italic text-gray-900 leading-none">{route.cadena}</h3>
                <p className="text-[10px] text-gray-400 uppercase font-bold mt-1 mb-6">{route.direccion}</p>

                <button 
                  onClick={() => handleRouteAction(route)}
                  disabled={terminado}
                  style={{
                    width: '100%', padding: '18px', borderRadius: '20px', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', border: 'none',
                    // 🚩 AQUÍ FORZAMOS EL COLOR AZUL SI ENCURSO ES TRUE
                    backgroundColor: terminado ? '#f3f4f6' : enCurso ? '#2563eb' : '#000000',
                    color: terminado ? '#d1d5db' : '#ffffff'
                  }}
                >
                  {terminado ? 'Visitado' : enCurso ? 'Ejecutar Reporte' : 'Iniciar Visita'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkerCalendar;