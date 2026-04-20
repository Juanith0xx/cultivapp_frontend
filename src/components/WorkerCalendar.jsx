import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import { useWorkerRoutes } from '../hooks/useWorkerRoutes';
import { FiMapPin, FiClock, FiCheckCircle, FiPlay, FiNavigation, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../api/apiClient';
import toast from 'react-hot-toast';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Importante instalar: npm install react-calendar date-fns
import 'react-calendar/dist/Calendar.css';

const WorkerCalendar = ({ userId }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  console.log("%c--- CALENDARIO MENSUAL CARGADO ---", "background: #87be00; color: white; padding: 5px;");

  const { routes, loading, mutate } = useWorkerRoutes(userId);

  // 🚩 Filtrar rutas según el día seleccionado en el calendario
  const routesOfDay = useMemo(() => {
    if (!routes) return [];
    return routes.filter(route => {
      const routeDate = new Date(route.visit_date);
      // Ajuste de zona horaria para evitar desfases al comparar
      routeDate.setMinutes(routeDate.getMinutes() + routeDate.getTimezoneOffset());
      return isSameDay(routeDate, selectedDate);
    });
  }, [routes, selectedDate]);

  // Contenido para poner puntos verdes en días con rutas
  const tileContent = ({ date, view }) => {
    if (view === 'month' && routes) {
      const hasRoute = routes.some(r => {
        const rDate = new Date(r.visit_date);
        rDate.setMinutes(rDate.getMinutes() + rDate.getTimezoneOffset());
        return isSameDay(rDate, date);
      });
      return hasRoute ? <div className="h-1.5 w-1.5 bg-[#87be00] rounded-full mx-auto mt-1" /> : null;
    }
  };

  const handleRouteAction = async (route) => {
    const s = route.status?.trim().toUpperCase().replace(/[\s-]/g, '_');
    const enCurso = ['IN_PROGRESS', 'EN_CURSO', 'EN_PROCESO'].includes(s) || route.lat_in !== null;

    if (enCurso) {
      navigate(`/usuario/reporte/${route.id}`);
      return;
    }

    try {
      const toastId = toast.loading("Validando GPS...", { id: 'gps' });
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await api.patch(`/routes/${route.id}/start`, {
          lat_in: pos.coords.latitude,
          lng_in: pos.coords.longitude
        });
        toast.success("Visita Iniciada", { id: 'gps' });
        if (mutate) mutate();
        navigate(`/usuario/reporte/${route.id}`);
      }, (err) => {
        toast.error("Debes activar el GPS", { id: 'gps' });
      });
    } catch (err) {
      toast.error("Error al iniciar");
    }
  };

  if (loading && !routes) return <div className="p-10 text-center font-black animate-pulse">CARGANDO AGENDA...</div>;

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto font-[Outfit]">
      
      {/* 📅 CALENDARIO MENSUAL PREMIUM */}
      <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          locale="es-CL"
          tileContent={tileContent}
          className="border-none w-full"
          prevLabel={<FiChevronLeft className="mx-auto" />}
          nextLabel={<FiChevronRight className="mx-auto" />}
        />
      </div>

      {/* 📋 LISTADO DE RUTAS DEL DÍA SELECCIONADO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase italic text-gray-800">
                {isSameDay(selectedDate, new Date()) ? 'Rutas de Hoy' : format(selectedDate, "EEEE dd 'de' MMMM", { locale: es })}
            </h2>
            <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-400">
                {routesOfDay.length} VISITA(S)
            </span>
        </div>

        {routesOfDay.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2.5rem] p-12 text-center">
                <FiCalendar className="mx-auto text-gray-200 mb-2" size={30} />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No hay rutas programadas</p>
            </div>
        ) : (
            <div className="relative border-l-2 border-dashed border-gray-100 ml-4 space-y-6 py-2">
                {routesOfDay.map((route) => {
                    const s = route.status?.trim().toUpperCase().replace(/[\s-]/g, '_');
                    const terminado = ['COMPLETED', 'OK', 'FINALIZADO'].includes(s);
                    const enCurso = !terminado && (['IN_PROGRESS', 'EN_CURSO', 'EN_PROCESO'].includes(s) || route.lat_in !== null);

                    return (
                        <div key={route.id} className="relative pl-8">
                            <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white transition-all ${
                                terminado ? 'bg-[#87be00]' : enCurso ? 'bg-blue-600 animate-pulse' : 'bg-orange-400'
                            }`} />
                            
                            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 hover:border-[#87be00] transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-[#87be00] font-black text-[11px] uppercase bg-[#87be00]/5 px-3 py-1 rounded-full flex items-center gap-2">
                                        <FiClock /> {route.start_time?.slice(0, 5)} HRS
                                    </div>
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${terminado ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                                        {route.status}
                                    </span>
                                </div>

                                <h3 className="font-black text-xl uppercase italic text-gray-900 leading-none">{route.cadena}</h3>
                                <p className="text-[10px] text-gray-400 uppercase font-bold mt-1 mb-6">{route.direccion}</p>

                                <button 
                                    onClick={() => handleRouteAction(route)}
                                    disabled={terminado}
                                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${
                                        terminado ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
                                        enCurso ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 
                                        'bg-black text-white hover:bg-[#87be00]'
                                    }`}
                                >
                                    {terminado ? 'Visita Finalizada' : enCurso ? 'Continuar Reporte' : 'Iniciar Visita'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Estilos para que el calendario se vea como CultivaApp */}
      <style jsx global>{`
        .react-calendar { border: none !important; font-family: 'Outfit', sans-serif !important; }
        .react-calendar__navigation button { font-weight: 900 !important; color: #111 !important; text-transform: uppercase !important; }
        .react-calendar__month-view__weekdays { font-size: 10px !important; font-weight: 900 !important; text-transform: uppercase !important; color: #ccc !important; }
        .react-calendar__tile--active { background: #87be00 !important; border-radius: 15px !important; color: white !important; }
        .react-calendar__tile--now { background: #f0fdf4 !important; color: #87be00 !important; border-radius: 15px !important; }
        .react-calendar__tile:hover { border-radius: 15px !important; }
      `}</style>
    </div>
  );
};

export default WorkerCalendar;