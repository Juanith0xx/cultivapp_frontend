import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiMapPin, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";

const SupervisorPanel = () => {
  // Datos de ejemplo (Luego vendrán de tu API)
  const [stats] = useState({
    no_atendido: 12,
    atendiendo: 5,
    atendido: 28,
    sin_asignacion: 3
  });

  const cards = [
    { 
      label: "Locales No Atendidos", 
      value: stats.no_atendido, 
      color: "bg-red-500", 
      icon: <FiAlertCircle size={24} />,
      desc: "Rojo: Urgencia alta"
    },
    { 
      label: "Locales Atendiendo", 
      value: stats.atendiendo, 
      color: "bg-yellow-400", 
      icon: <FiClock size={24} />,
      desc: "Amarillo: En proceso"
    },
    { 
      label: "Locales Atendidos", 
      value: stats.atendido, 
      color: "bg-[#87be00]", 
      icon: <FiCheckCircle size={24} />,
      desc: "Verde: Cobertura exitosa"
    },
    { 
      label: "Sin Mercaderista", 
      value: stats.sin_asignacion, 
      color: "bg-gray-900", 
      icon: <FiUsers size={24} />,
      desc: "Negro: Revisar contratos"
    },
  ];

  return (
    <div className="space-y-8 font-[Outfit]">
      {/* HEADER DE LA VISTA */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
          Semáforo de Cobertura
        </h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
          Estado de la operación en tiempo real
        </p>
      </div>

      {/* GRID DE ESTADÍSTICAS (SEMÁFORO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={card.label}
            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group hover:shadow-xl transition-all duration-500"
          >
            {/* Indicador de color lateral */}
            <div className={`absolute top-0 left-0 h-full w-2 ${card.color}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${card.color} text-white shadow-lg`}>
                {card.icon}
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest">Live</span>
            </div>

            <h3 className="text-4xl font-black text-gray-900 mb-1">{card.value}</h3>
            <p className="text-[11px] font-black text-gray-800 uppercase italic">{card.label}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase mt-2 tracking-tighter">{card.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* SECCIÓN INFERIOR: PRÓXIMAMENTE LISTADO DETALLADO */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[3rem] p-12 text-center">
        <FiMapPin className="mx-auto text-gray-300 mb-4" size={40} />
        <p className="text-gray-400 text-xs font-black uppercase italic tracking-widest">
          Aquí irá el listado detallado por Zonas y Locales
        </p>
      </div>
    </div>
  );
};

export default SupervisorPanel;