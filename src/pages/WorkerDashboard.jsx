import React from 'react';
import WorkerCalendar from '../components/WorkerCalendar';
import VisitFlow from '../components/VisitFlow';
import { useWorkerRoutes } from '../hooks/useWorkerRoutes'; 

const WorkerDashboard = () => {
  // Obtenemos el usuario real del storage
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const user = storedUser || { first_name: "Usuario", id: null };
  
  // Obtenemos rutas y la función mutate
  const { routes, mutate, loading } = useWorkerRoutes(user.id);

  // 🚩 LÓGICA CLAVE: Buscamos si hay algo en proceso
  const activeRoute = routes?.find(r => r.status === 'IN_PROGRESS');

  if (loading && !routes.length) {
    return (
      <div className="h-screen flex items-center justify-center font-black uppercase text-gray-300 text-[10px] tracking-widest">
        Sincronizando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[Outfit]">
      {activeRoute ? (
        /* PANTALLA DE FOTOS (Se activa sola si hay IN_PROGRESS) */
        <div className="fixed inset-0 z-[999] bg-white overflow-y-auto">
          <VisitFlow 
            visitId={activeRoute.id} 
            onBack={async () => {
              await mutate(); // Al terminar o cancelar, refrescamos la lista
            }} 
          />
        </div>
      ) : (
        /* PANTALLA DE AGENDA */
        <div className="animate-in fade-in duration-500">
          <div className="bg-[#87be00] pt-12 pb-24 px-6 rounded-b-[4rem] shadow-2xl text-white">
            <h1 className="text-3xl font-black italic uppercase leading-none tracking-tighter">
              ¡Hola, {user.first_name}!
            </h1>
            <p className="opacity-70 mt-2 text-[10px] font-black uppercase tracking-[0.3em]">
              Tu Agenda de Hoy
            </p>
          </div>

          <div className="max-w-md mx-auto -mt-12 px-4 pb-20">
            <WorkerCalendar 
              userId={user.id} 
              // Pasamos mutate para que el calendario pueda avisar al dashboard
              onOpenScanner={() => mutate()} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;