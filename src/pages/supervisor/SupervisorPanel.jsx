import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiUsers, FiMapPin, FiCheckCircle, FiAlertCircle, FiClock, FiShield, FiExternalLink, FiSearch, FiHash } from "react-icons/fi";
import { useState } from "react";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const SupervisorPanel = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filtrar locales por búsqueda (Cadena, Dirección o Código)
  const filteredLocales = stats?.locales_detalle?.filter(local => 
    local.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    local.cadena.toLowerCase().includes(searchTerm.toLowerCase()) ||
    local.codigo_local?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const cards = [
    { label: "Rutas Pendientes", value: stats?.no_atendido || 0, color: "bg-red-500", icon: <FiAlertCircle size={24} /> },
    { label: "Visitas en Curso", value: stats?.atendiendo || 0, color: "bg-yellow-400", icon: <FiClock size={24} /> },
    { label: "Visitas Finalizadas", value: stats?.atendido || 0, color: "bg-[#87be00]", icon: <FiCheckCircle size={24} /> },
    { label: "Locales fuera de Ruta", value: stats?.sin_asignacion || 0, color: "bg-gray-900", icon: <FiUsers size={24} /> },
  ];

  if (isLoading) return (
    <div className="py-20 text-center font-[Outfit] font-black uppercase italic animate-pulse text-gray-400 tracking-widest text-sm">
      Cargando Cartera de Supervisor...
    </div>
  );

  return (
    <div className="space-y-8 font-[Outfit] pb-20">
      {/* HEADER */}
      <div className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Panel de Supervisión</h2>
          <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-[#87be00] rounded-full animate-ping"></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Análisis de cobertura en tiempo real</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white px-5 py-3 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center text-[#87be00]">
                <FiShield size={16} />
            </div>
            <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Supervisor Activo</p>
                <p className="text-[10px] font-black text-gray-900 uppercase italic leading-none">{user?.first_name} {user?.last_name}</p>
            </div>
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
              <div className={`p-3 rounded-2xl ${card.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>{card.icon}</div>
              <span className="text-[8px] font-black text-gray-300 uppercase italic">Live update</span>
            </div>
            <h3 className="text-5xl font-black text-gray-900 mb-1 tracking-tighter">{card.value}</h3>
            <p className="text-[11px] font-black text-gray-800 uppercase italic leading-tight">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* LISTADO DE CARTERA (SIN ESTADOS) */}
      <div className="mx-2 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4">
            <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Mi Cartera</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Locales asignados bajo tu gestión</p>
            </div>
            <div className="relative w-full md:w-80">
                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="BUSCAR POR NOMBRE O CÓDIGO..." 
                    className="w-full bg-white border border-gray-100 rounded-[1.5rem] py-4 pl-12 pr-4 text-[10px] font-black uppercase shadow-sm focus:ring-2 focus:ring-[#87be00]/20 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      <div className="flex items-center gap-2"><FiHash /> Código</div>
                  </th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cadena / Enseña</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Dirección Completa</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Ver Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLocales.length > 0 ? (
                  filteredLocales.map((local, idx) => (
                    <motion.tr 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: idx * 0.03 }}
                        key={local.id} 
                        className="hover:bg-gray-50/50 transition-colors group cursor-default"
                    >
                      <td className="px-10 py-6">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-[10px] font-black text-gray-600 uppercase">
                            {local.codigo_local || 'S/N'}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <p className="text-sm font-black text-gray-900 uppercase italic tracking-tighter leading-none">{local.cadena}</p>
                        <p className="text-[9px] font-bold text-[#87be00] mt-1 uppercase tracking-widest">Punto de Venta Activo</p>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2 text-gray-500">
                            <FiMapPin size={12} className="shrink-0" />
                            <span className="text-[11px] font-bold uppercase italic leading-tight">{local.direccion}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="w-10 h-10 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto md:ml-auto group-hover:bg-gray-900 group-hover:text-[#87be00] transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
                          <FiExternalLink size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-24 text-center">
                        <div className="bg-gray-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-200">
                            <FiMapPin size={32} />
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase italic tracking-[0.3em]">No hay locales registrados en tu cartera</p>
                        <p className="text-[9px] font-bold text-gray-300 uppercase mt-2">Intenta ajustar los filtros de búsqueda</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorPanel;