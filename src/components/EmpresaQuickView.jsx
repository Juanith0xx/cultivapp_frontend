import { motion, AnimatePresence } from "framer-motion";
import { FiBriefcase, FiMapPin, FiUser, FiMail, FiHash, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa"; // Para el icono de WhatsApp

/**
 * 🏢 COMPONENTE: EMPRESA QUICK VIEW
 * @param {Object} company - Datos de la empresa (rut, address, manager, phone, email, name)
 * @param {Boolean} isActive - Estado de apertura
 * @param {Function} onToggle - Switch de visualización
 */
const EmpresaQuickView = ({ company, isActive, onToggle }) => {
  
  // Sub-componente para filas de datos
  const InfoRow = ({ icon, label, value, isLink = false, href = "#" }) => (
    <div className="flex items-start gap-3 group/row">
      <div className="text-[#87be00] mt-0.5 group-hover/row:scale-110 transition-transform">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[7px] font-black text-gray-300 uppercase tracking-[0.2em] leading-none mb-1">
          {label}
        </p>
        {isLink ? (
          <a 
            href={href} 
            target="_blank" 
            rel="noreferrer"
            className="text-[10px] font-bold text-gray-600 hover:text-[#87be00] transition-colors truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-[10px] font-bold text-gray-600 truncate uppercase">
            {value || '—'}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Trigger: Icono de Empresa */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-sm active:scale-95
          ${isActive 
            ? "bg-gray-900 text-[#87be00] border-gray-900 scale-110" 
            : "bg-gray-50 border-gray-100 text-gray-400 hover:border-[#87be00] hover:text-[#87be00]"}`}
      >
        <FiBriefcase size={20} />
      </button>

      {/* Tarjeta Popover */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -10 }}
            className="absolute left-full ml-4 top-0 z-[110] w-80 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-7 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Nombre de Empresa */}
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-50">
              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#87be00] shadow-lg shadow-gray-200">
                <FiBriefcase size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-gray-900 uppercase italic leading-none truncate">
                  {company.name || 'Empresa'}
                </p>
                <span className="text-[8px] font-black text-[#87be00] uppercase tracking-[0.3em] mt-2 block">
                  Ficha Corporativa
                </span>
              </div>
            </div>

            {/* Grid de Información */}
            <div className="space-y-5">
              <InfoRow 
                icon={<FiHash />} 
                label="RUT de Empresa" 
                value={company.rut || 'No disponible'} 
              />
              
              <InfoRow 
                icon={<FiMapPin />} 
                label="Dirección Casa Matriz" 
                value={company.address || company.direccion || 'Dirección no registrada'} 
              />

              <InfoRow 
                icon={<FiUser />} 
                label="Responsable de Cuenta" 
                value={company.manager || company.nombre_responsable || 'Sin asignar'} 
              />

              <div className="grid grid-cols-2 gap-4 pt-2">
                <InfoRow 
                  icon={<FiMail />} 
                  label="Correo" 
                  value={company.email} 
                  isLink={true}
                  href={`mailto:${company.email}`}
                />
                
                <div className="flex items-start gap-3 group/wa">
                  <div className="text-[#25D366] mt-0.5">
                    <FaWhatsapp size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7px] font-black text-gray-300 uppercase tracking-[0.2em] leading-none mb-1">
                      WhatsApp
                    </p>
                    <a 
                      href={`https://wa.me/${company.phone?.replace(/\+/g, '').replace(/\s/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black text-gray-600 hover:text-[#25D366] transition-colors"
                    >
                      {company.phone || 'Sin número'}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Decoración inferior */}
            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-center">
              <p className="text-[7px] font-black text-gray-300 uppercase tracking-[0.5em]">
                Master Core System
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmpresaQuickView;