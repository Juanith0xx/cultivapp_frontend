import { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import api from "../../api/apiClient";

const AdminCalendarView = ({ onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Configuración del calendario (Semana empieza en Lunes)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    const fetchMonthRoutes = async () => {
      try {
        setLoading(true);
        // 🟢 MEJORA: Llamamos a "/" porque el prefijo "/api/routes" ya lo pone el backend y el apiClient
        const data = await api.get("/routes"); 
        setRoutes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Error al cargar rutas del calendario:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMonthRoutes();
  }, [currentDate]);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 font-[Outfit] animate-in fade-in duration-500">
      
      {/* HEADER DEL CALENDARIO */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">
          {currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentDate(new Date(year, month - 1))} 
            className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-black"
          >
            <FiChevronLeft/>
          </button>
          <button 
            onClick={() => setCurrentDate(new Date(year, month + 1))} 
            className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-black"
          >
            <FiChevronRight/>
          </button>
        </div>
      </div>

      {/* GRID DE DÍAS */}
      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase py-2 tracking-widest">
            {d}
          </div>
        ))}
        
        {/* ESPACIOS EN BLANCO */}
        {blanks.map((_, i) => (
          <div key={`b-${i}`} className="h-24 bg-gray-50/10 rounded-2xl"></div>
        ))}
        
        {/* CELDAS DE DÍAS */}
        {days.map(day => {
          // Crear objeto fecha para esta celda
          const cellDate = new Date(year, month, day);
          
          // Formato YYYY-MM-DD local para comparar con visit_date
          const offset = cellDate.getTimezoneOffset();
          const localCellDate = new Date(cellDate.getTime() - (offset * 60 * 1000));
          const cellDateStr = localCellDate.toISOString().split('T')[0];
          
          const cellDayOfWeek = cellDate.getDay(); // 0=Dom, 1=Lun, etc.

          // 🟢 FILTRADO INTELIGENTE PARA AUTO-AGENDADO
          const dayRoutes = routes.filter(r => {
            // Caso A: Coincide la fecha exacta (Ruta Única)
            if (r.visit_date && r.visit_date.startsWith(cellDateStr)) return true;

            // Caso B: Es recurrente y el día de la semana coincide
            const activeDays = r.days_array?.map(Number) || [];
            if (r.is_recurring && activeDays.includes(cellDayOfWeek)) return true;

            return false;
          });
          
          return (
            <div 
              key={day} 
              onClick={() => onSelectDate(cellDateStr)}
              className="h-24 p-3 bg-gray-50/50 rounded-2xl border-2 border-transparent hover:border-[#87be00]/30 hover:bg-white transition-all cursor-pointer group relative overflow-hidden"
            >
              <span className={`text-xs font-black ${dayRoutes.length > 0 ? 'text-gray-900' : 'text-gray-300'} group-hover:text-black`}>
                {day}
              </span>
              
              {/* INDICADORES DE MERCADERISTAS */}
              <div className="mt-1 space-y-1">
                {dayRoutes.slice(0, 2).map((r, idx) => (
                  <div 
                    key={`${r.id}-${idx}`} 
                    className="text-[7px] bg-[#87be00] text-white px-1.5 py-0.5 rounded-md font-black uppercase truncate tracking-tighter shadow-sm"
                  >
                    {r.first_name} {r.last_name?.charAt(0)}.
                  </div>
                ))}
                {dayRoutes.length > 2 && (
                  <div className="text-[7px] text-gray-400 font-black pl-1 italic">
                    +{dayRoutes.length - 2} más
                  </div>
                )}
              </div>

              {/* BOTÓN RÁPIDO AGENDAR */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all bg-black text-white p-1 rounded-lg scale-75 group-hover:scale-100">
                <FiPlus size={10}/>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <span className="text-[9px] font-black text-gray-300 uppercase animate-pulse">Actualizando calendario...</span>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarView;