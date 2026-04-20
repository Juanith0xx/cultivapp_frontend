import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom"; 
import { FiMapPin, FiClock, FiSend, FiLoader, FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Calendar from 'react-calendar';
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

import 'react-calendar/dist/Calendar.css';

const UserAgenda = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allTasks, setAllTasks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.get(`/routes/my-tasks`); 
      const rawData = Array.isArray(data) ? data : (data?.data || []);
      setAllTasks(rawData);
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getSafeDateString = (dateInput) => {
    if (!dateInput) return null;
    try {
      if (dateInput instanceof Date) return format(dateInput, 'yyyy-MM-dd');
      return dateInput.substring(0, 10); 
    } catch (e) { return null; }
  };

  const displayTasks = useMemo(() => {
    const selectedStr = getSafeDateString(selectedDate);
    return allTasks.filter(t => 
      getSafeDateString(t.visit_date) === selectedStr || getSafeDateString(t.date) === selectedStr
    );
  }, [selectedDate, allTasks]);

  const tileContent = ({ date, view }) => {
    if (view === 'month' && allTasks.length > 0) {
      const tileStr = getSafeDateString(date);
      const hasRoute = allTasks.some(t => 
        getSafeDateString(t.visit_date) === tileStr || getSafeDateString(t.date) === tileStr
      );
      if (hasRoute) return <div className="h-1 w-1 bg-[#87be00] rounded-full mx-auto mt-0.5 md:h-1.5 md:w-1.5"></div>;
    }
    return null;
  };

  return (
    <div className="p-3 md:p-10 space-y-6 md:space-y-8 font-[Outfit] pb-24 md:pb-10">
      
      {/* HEADER: Ajustado para móviles */}
      <header className="flex flex-row justify-between items-center gap-2 px-1">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Mi Agenda</h1>
          <p className="text-[#87be00] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1">Calendario Cultivapp</p>
        </div>
        {loading && <FiLoader className="animate-spin text-[#87be00]" size={20} />}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
        
        {/* CALENDARIO: Más compacto en móvil */}
        <section className="lg:col-span-7 bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-100">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="es-CL"
            tileContent={tileContent}
            className="cultiva-calendar-ui"
            prevLabel={<FiChevronLeft />}
            nextLabel={<FiChevronRight />}
            formatShortWeekday={(locale, date) => format(date, 'EEEEE', { locale: es })} // M, T, W...
          />
        </section>

        {/* LISTADO: Tarjetas optimizadas */}
        <section className="lg:col-span-5 space-y-4">
          <div className="bg-gray-900 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] text-white shadow-lg flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-[#87be00] uppercase tracking-widest mb-1 italic">Día seleccionado</p>
              <h3 className="text-lg md:text-2xl font-black uppercase italic leading-none">
                {format(selectedDate, "eeee dd", { locale: es })}
              </h3>
            </div>
            <div className="text-right">
               <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full font-black uppercase">{displayTasks.length} Rutas</span>
            </div>
          </div>

          <div className="space-y-3">
            {displayTasks.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2rem] py-16 text-center opacity-40">
                 <FiCalendar size={32} className="mx-auto mb-2 text-gray-400"/>
                 <p className="text-[9px] font-black uppercase italic tracking-widest">Sin visitas programadas</p>
              </div>
            ) : (
              displayTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer shadow-sm" 
                  onClick={() => navigate(`/usuario/reporte/${task.id}`)}
                >
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-[#87be00] shrink-0">
                      <FiMapPin size={18} className="md:size-5"/>
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 mb-0.5">
                        <FiClock className="text-[#87be00]" size={10}/>
                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                          {task.start_time?.slice(0, 5) || "00:00"} HRS
                        </span>
                      </div>
                      <h4 className="text-sm md:text-lg font-black text-gray-800 uppercase italic leading-none truncate tracking-tight">
                        {task.cadena}
                      </h4>
                    </div>
                  </div>
                  <div className="bg-[#87be00]/10 text-[#87be00] p-2.5 rounded-lg md:rounded-xl">
                    <FiSend size={16}/>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style jsx global>{`
        /* Reset de bordes y anchos */
        .cultiva-calendar-ui { 
          width: 100% !important; 
          border: none !important; 
          font-family: 'Outfit', sans-serif !important;
        }

        /* Estilo de los números del día */
        .react-calendar__tile {
          padding: 0.75em 0.5em !important;
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          border-radius: 0.75rem !important;
          aspect-ratio: 1/1 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
        }

        @media (min-width: 768px) {
          .react-calendar__tile {
            font-size: 1rem !important;
            border-radius: 1.2rem !important;
          }
        }

        /* Día seleccionado */
        .react-calendar__tile--active { 
          background: #87be00 !important; 
          color: white !important; 
          box-shadow: 0 4px 12px rgba(135, 190, 0, 0.3) !important;
        }

        /* Día actual */
        .react-calendar__tile--now { 
          background: #f0fdf4 !important; 
          color: #87be00 !important; 
        }

        /* Navegación (mes/flechas) */
        .react-calendar__navigation {
          margin-bottom: 1rem !important;
          height: 40px !important;
        }

        .react-calendar__navigation button {
          font-weight: 800 !important;
          text-transform: uppercase !important;
          font-size: 0.9rem !important;
        }

        /* Días de la semana (L M M J...) */
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none !important;
          font-weight: 900 !important;
          color: #cbd5e1 !important;
          font-size: 0.7rem !important;
        }
      `}</style>
    </div>
  );
};

export default UserAgenda;