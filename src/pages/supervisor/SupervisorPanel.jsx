import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiUsers, FiMapPin, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";
import api from "../../api/apiClient"; // Ajusta la ruta a tu cliente API
import { useAuth } from "../../context/AuthContext";

const SupervisorPanel = () => {
  const { user } = useAuth();

  // 1. FETCH DE DATOS REALES DESDE LA API
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.company_id],
    queryFn: async () => {
      // El endpoint debe devolver: { no_atendido: X, atendiendo: X, atendido: X, sin_asignacion: X }
      const response = await api.get("/reports/dashboard-stats", {
        params: { company_id: user?.company_id }
      });
      return response.data || response;
    },
    refetchInterval: 30000, // Se actualiza solo cada 30 segundos (Tiempo Real)
  });

  // 2. CONFIGURACIÓN DE TARJETAS (Mapeo de la respuesta)
  const cards = [
    { 
      label: "Locales No Atendidos", 
      value: stats?.no_atendido || 0, 
      color: "bg-red-500", 
      icon: <FiAlertCircle size={24} />,
      desc: "Rojo: Urgencia alta"
    },
    { 
      label: "Locales Atendiendo", 
      value: stats?.atendiendo || 0, 
      color: "bg-yellow-400", 
      icon: <FiClock size={24} />,
      desc: "Amarillo: En proceso"
    },
    { 
      label: "Locales Atendidos", 
      value: stats?.atendido || 0, 
      color: "bg-[#87be00]", 
      icon: <FiCheckCircle size={24} />,
      desc: "Verde: Cobertura exitosa"
    },
    { 
      label: "Sin Mercaderista", 
      value: stats?.sin_asignacion || 0, 
      color: "bg-gray-900", 
      icon: <FiUsers size={24} />,
      desc: "Negro: Revisar contratos"
    },
  ];

  if (isLoading) return (
    <div className="py-20 text-center font-black uppercase italic animate-pulse text-gray-400 tracking-widest">
      Sincronizando Semáforo de Cobertura...
    </div>
  );

  return (
    <div className="space-y-8 font-[Outfit]">
      {/* HEADER DE LA VISTA */}
      <div className="px-2">
        <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
          Semáforo de Cobertura
        </h2>
        <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-[#87be00] rounded-full animate-ping"></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Estado de la operación en vivo
            </p>
        </div>
      </div>

      {/* GRID DE ESTADÍSTICAS (SEMÁFORO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {cards.map((card, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={card.label}
            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group hover:shadow-xl transition-all duration-500"
          >
            <div className={`absolute top-0 left-0 h-full w-2 ${card.color}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${card.color} text-white shadow-lg`}>
                {card.icon}
              </div>
              <span className="text-[8px] font-black text-gray-300 uppercase italic tracking-widest">Update: Now</span>
            </div>

            <h3 className="text-5xl font-black text-gray-900 mb-1 tracking-tighter">
              {card.value}
            </h3>
            <p className="text-[11px] font-black text-gray-800 uppercase italic leading-tight">
                {card.label}
            </p>
            <p className="text-[9px] font-bold text-gray-400 uppercase mt-2 tracking-tighter">
                {card.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* LISTADO DETALLADO (ESPACIO PARA TABLA) */}
      <div className="mx-2 bg-white rounded-[3rem] p-1 shadow-sm border border-gray-50">
        <div className="p-10 text-center">
            <FiMapPin className="mx-auto text-gray-200 mb-4" size={40} />
            <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-[0.2em]">
                Desglose Detallado por Zona y Cadena
            </p>
            <div className="mt-4 flex justify-center gap-4">
                <div className="h-1 w-12 bg-gray-100 rounded-full"></div>
                <div className="h-1 w-12 bg-gray-100 rounded-full"></div>
                <div className="h-1 w-12 bg-gray-100 rounded-full"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorPanel;