import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiUsers, FiMapPin, FiCheckCircle, FiAlertCircle, FiClock, FiShield } from "react-icons/fi";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const SupervisorPanel = () => {
  const { user } = useAuth();

  // 1. FETCH DE DATOS REALES FILTRADOS POR CARTERA DE SUPERVISOR
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.company_id, user?.id],
    queryFn: async () => {
      const response = await api.get("/reports/dashboard-stats", {
        params: { 
          company_id: user?.company_id,
          supervisor_id: user?.id 
        }
      });
      return response.data || response;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, 
  });

  // 2. CONFIGURACIÓN DE TARJETAS (Textos optimizados para la nueva lógica del backend)
  const cards = [
    { 
      label: "Rutas Pendientes", 
      value: stats?.no_atendido || 0, 
      color: "bg-red-500", 
      icon: <FiAlertCircle size={24} />,
      desc: "Planificados hoy sin inicio"
    },
    { 
      label: "Visitas en Curso", 
      value: stats?.atendiendo || 0, 
      color: "bg-yellow-400", 
      icon: <FiClock size={24} />,
      desc: "Operación activa en vivo"
    },
    { 
      label: "Visitas Finalizadas", 
      value: stats?.atendido || 0, 
      color: "bg-[#87be00]", 
      icon: <FiCheckCircle size={24} />,
      desc: "Cobertura total de hoy"
    },
    { 
      label: "Locales fuera de Ruta", 
      value: stats?.sin_asignacion || 0, 
      color: "bg-gray-900", 
      icon: <FiUsers size={24} />,
      desc: "Tu cartera sin plan hoy"
    },
  ];

  if (isLoading) return (
    <div className="py-20 text-center font-[Outfit] font-black uppercase italic animate-pulse text-gray-400 tracking-widest">
      Sincronizando Semáforo de Cartera...
    </div>
  );

  return (
    <div className="space-y-8 font-[Outfit] pb-10">
      {/* HEADER DE LA VISTA */}
      <div className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
            Semáforo de Cartera
          </h2>
          <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-[#87be00] rounded-full animate-ping"></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Estado operativo de tus locales asignados
              </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-2xl border border-gray-200">
            <FiShield className="text-[#87be00]" size={14} />
            <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                Supervisor: {user?.first_name}
            </span>
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
              <span className="text-[8px] font-black text-gray-300 uppercase italic tracking-widest flex items-center gap-1">
                <FiClock size={10} /> Real Time
              </span>
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

      {/* LISTADO DETALLADO */}
      <div className="mx-2 bg-white rounded-[3rem] p-1 shadow-sm border border-gray-100 group transition-all duration-500 hover:shadow-lg">
        <div className="p-10 text-center">
            <FiMapPin className="mx-auto text-gray-200 mb-4 group-hover:text-[#87be00] transition-colors duration-500" size={40} />
            <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-[0.2em]">
                Desglose Detallado por Zona y Cadena
            </p>
            <div className="mt-4 flex justify-center gap-4">
                <div className="h-1 w-12 bg-gray-100 rounded-full group-hover:bg-[#87be00]/30 transition-colors"></div>
                <div className="h-1 w-12 bg-gray-100 rounded-full group-hover:bg-[#87be00]/60 transition-colors"></div>
                <div className="h-1 w-12 bg-gray-100 rounded-full group-hover:bg-[#87be00] transition-colors"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorPanel;