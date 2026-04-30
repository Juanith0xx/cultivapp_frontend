import { motion, AnimatePresence } from "framer-motion";
import { FiPhone, FiMail, FiShield } from "react-icons/fi";

/**
 * 🚀 COMPONENTE REUTILIZABLE: USER QUICK VIEW
 * @param {Object} user - Datos del usuario a mostrar
 * @param {Boolean} isActive - Estado controlado desde el padre
 * @param {Function} onToggle - Función para abrir/cerrar
 */
const UserQuickView = ({ user, isActive, onToggle }) => {
  
  // Sub-componente interno para limpiar el diseño de las filas
  const DetailRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="text-[#87be00] mt-0.5">{icon}</div>
      <div>
        <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-[10px] font-bold text-gray-600 truncate max-w-[180px]">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Botón/Avatar disparador */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-sm transition-all shadow-sm active:scale-95
          ${isActive 
            ? "bg-gray-900 text-[#87be00] border-gray-900 scale-110" 
            : "bg-gray-50 border-gray-100 text-gray-400 hover:border-[#87be00] hover:text-[#87be00]"}`}
      >
        {user.first_name?.charAt(0)}
      </button>

      {/* Tarjeta Flotante */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -10 }}
            className="absolute left-full ml-4 top-0 z-[100] w-72 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-6 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header de la tarjeta */}
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-50">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-[#87be00] font-black text-xs">
                {user.first_name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-gray-900 uppercase italic leading-none truncate">
                  {user.first_name} {user.last_name}
                </p>
                <span className="text-[8px] font-black text-[#87be00] uppercase tracking-widest">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Contenido de detalles */}
            <div className="space-y-4">
              <DetailRow icon={<FiPhone/>} label="Teléfono Personal" value={user.phone || 'No registrado'} />
              <DetailRow icon={<FiMail/>} label="Correo Electrónico" value={user.email} />
              
              {/* Bloque de Supervisor */}
              <div className="mt-6 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100/50">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <FiShield className="text-[#87be00]"/> Responsable Directo
                </p>
                <p className="text-[10px] font-black text-gray-800 uppercase italic leading-tight">
                  {user.supervisor_nombre || 'Sin asignar'}
                </p>
                <p className="text-[9px] font-bold text-gray-400 mt-1">
                  {user.supervisor_telefono || '—'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserQuickView;