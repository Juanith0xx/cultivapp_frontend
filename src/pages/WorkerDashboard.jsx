import React, { useState, useEffect, useCallback } from 'react';
import WorkerCalendar from '../components/WorkerCalendar';
import VisitFlow from '../components/VisitFlow'; 
import { useWorkerRoutes } from '../hooks/useWorkerRoutes'; 

const WorkerDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || { first_name: "Usuario", id: null };
  const { routes, mutate, loading } = useWorkerRoutes(user.id);

  const [showFlow, setShowFlow] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // 🚩 AUTO-DETECCIÓN: Si al cargar hay una ruta IN_PROGRESS, abrimos el flujo
  useEffect(() => {
    if (routes.length > 0 && !showFlow) {
      const active = routes.find(r => r.status?.toUpperCase().trim() === 'IN_PROGRESS' || r.status?.toUpperCase().trim() === 'EN PROCESO');
      if (active) {
        setSelectedRoute(active);
        setShowFlow(true);
      }
    }
  }, [routes, showFlow]);

  const handleOpenVisit = useCallback((route) => {
    setSelectedRoute(route);
    setShowFlow(true); 
  }, []);

  const handleCloseFlow = async () => {
    setShowFlow(false);
    setSelectedRoute(null);
    await mutate(); 
  };

  if (loading && !routes.length) return <div className="h-screen bg-[#0f172a] flex items-center justify-center text-white font-bold">CARGANDO AGENDA...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-[Outfit]">
      {showFlow && selectedRoute ? (
        <div className="fixed inset-0 z-[99999] bg-[#0f172a] overflow-y-auto">
          <VisitFlow 
            visitId={selectedRoute.id} 
            localName={selectedRoute.cadena || "Local"} 
            onBack={handleCloseFlow} 
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <div className="bg-[#87be00] pt-14 pb-28 px-8 rounded-b-[4rem] text-white shadow-xl">
            <h1 className="text-4xl font-black italic uppercase leading-none tracking-tighter">¡Hola, {user.first_name}!</h1>
            <p className="opacity-70 mt-2 text-[10px] font-black uppercase tracking-[0.3em]">Gestión de Terreno</p>
          </div>
          <div className="max-w-md mx-auto -mt-14 px-4 pb-20">
            <div className="bg-white rounded-[3rem] shadow-2xl p-2 border border-white">
              <WorkerCalendar 
                userId={user.id} 
                routes={routes} 
                onOpenScanner={handleOpenVisit} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;