import React from 'react';
import TaskValidationMap from "./TaskValidationMap"; // El que creamos recién
import { FiX, FiMapPin, FiClock, FiNavigation } from "react-icons/fi";

const RouteMapModal = ({ isOpen, onClose, routeData }) => {
  if (!isOpen || !routeData) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 font-[Outfit]">
        
        {/* HEADER */}
        <div className="p-6 flex justify-between items-center border-b border-gray-50">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
              <FiMapPin className="text-[#87be00]" /> Validación de Punto de Venta
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">
              {routeData.cadena} - {routeData.direccion}
            </p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all text-gray-400 hover:text-black">
            <FiX size={20} />
          </button>
        </div>

        {/* MAPA */}
        <div className="p-2">
          <TaskValidationMap routeData={routeData} />
        </div>

        {/* INFO FOOTER */}
        <div className="p-8 bg-gray-50/50 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reponedor</span>
            <span className="text-sm font-bold text-gray-800 uppercase">{routeData.first_name} {routeData.last_name}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hora de Check-in</span>
            <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <FiClock className="text-gray-300" /> 
              {routeData.check_in ? new Date(routeData.check_in).toLocaleTimeString() : 'No registrado'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Precisión GPS</span>
            <div className="flex items-center gap-2">
               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${routeData.is_valid_gps ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {routeData.is_valid_gps ? 'Dentro de Rango' : 'Fuera de Rango'}
              </span>
              <span className="text-xs font-bold text-gray-500 italic">({routeData.distance_meters}m)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMapModal;