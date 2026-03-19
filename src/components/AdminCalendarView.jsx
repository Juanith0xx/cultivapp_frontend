import { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import api from "../../api/apiClient";

const AdminCalendarView = ({ onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [routes, setRoutes] = useState([]);

  // Lógica para calcular días del mes
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Días en blanco para cuadrar el inicio de semana (Lunes a Domingo)
  const blanks = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    const fetchMonthRoutes = async () => {
      // Traemos todas las rutas para marcar el calendario
      const data = await api.get("routes");
      setRoutes(data);
    };
    fetchMonthRoutes();
  }, [currentDate]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 font-[Outfit]">
      {/* Header del Calendario */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">
          {currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"><FiChevronLeft/></button>
          <button onClick={nextMonth} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"><FiChevronRight/></button>
        </div>
      </div>

      {/* Grid de Días */}
      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase py-2">{d}</div>
        ))}
        
        {blanks.map((_, i) => <div key={`b-${i}`} className="h-24 bg-gray-50/30 rounded-2xl"></div>)}
        
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayRoutes = routes.filter(r => r.visit_date?.startsWith(dateStr));
          
          return (
            <div 
              key={day} 
              onClick={() => onSelectDate(dateStr)}
              className="h-24 p-3 bg-gray-50/50 rounded-2xl border border-transparent hover:border-[#87be00] hover:bg-white transition-all cursor-pointer group relative"
            >
              <span className="text-sm font-black text-gray-400 group-hover:text-black">{day}</span>
              
              {/* Indicadores de Rutas */}
              <div className="mt-1 space-y-1">
                {dayRoutes.slice(0, 2).map(r => (
                  <div key={r.id} className="text-[8px] bg-[#87be00] text-white p-1 rounded-md font-bold truncate">
                    {r.first_name}
                  </div>
                ))}
                {dayRoutes.length > 2 && (
                  <div className="text-[8px] text-gray-400 font-bold pl-1">+{dayRoutes.length - 2} más</div>
                )}
              </div>

              <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white p-1 rounded-lg">
                <FiPlus size={12}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCalendarView;