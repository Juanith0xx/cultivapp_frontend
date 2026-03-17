import React from 'react';
// Asegúrate de tener un hook de autenticación para sacar el nombre del usuario
// import { useAuth } from '../hooks/useAuth'; 
import WorkerCalendar from '../components/WorkerCalendar';

const WorkerDashboard = () => {
  // Simulación de usuario hasta que conectes tu hook de Auth
  const user = { first_name: "Juan", id: "f1f0c277-6e0b-4919-a329-ed5844e22038" };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header Estilo SaaS Moderno */}
      <div className="bg-[#87be00] pt-10 pb-16 px-6 rounded-b-[40px] shadow-lg mb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-white text-3xl font-bold">¡Hola, {user.first_name}!</h1>
          <p className="text-white/80 mt-1 text-sm font-medium">
            Tienes tareas pendientes para tu jornada de hoy.
          </p>
        </div>
      </div>

      {/* El Calendario Inteligente (Timeline) */}
      <div className="max-w-md mx-auto -mt-8">
        <WorkerCalendar userId={user.id} />
      </div>

      {/* Footer / Info de Versión */}
      <div className="text-center mt-10 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
        Cultivapp v1.0 • Field Operations
      </div>
    </div>
  );
};

export default WorkerDashboard;