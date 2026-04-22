import { useState, useEffect } from "react";
import { FiClock, FiCheck, FiLoader, FiSearch, FiMessageCircle } from "react-icons/fi";
import api from "../api/apiClient";
import toast from "react-hot-toast";

const AlertsHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications/traceability");
      setHistory(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error traceability:", err);
      toast.error("No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const filteredHistory = history.filter(item => 
    item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 font-[Outfit] space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
            Trazabilidad de Alertas
          </h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#87be00] animate-pulse"></span>
            Registro Histórico de Lectura
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="BUSCAR POR USUARIO O MENSAJE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* TABLA DE TRAZABILIDAD */}
      <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50 text-left">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Receptor</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Notificación</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Confirmación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                   <td colSpan="3" className="py-20 text-center">
                      <FiLoader className="animate-spin text-[#87be00] mx-auto mb-4" size={30} />
                      <p className="text-[10px] font-black uppercase text-gray-400">Cargando registros...</p>
                   </td>
                </tr>
              ) : filteredHistory.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white text-[10px] font-black">
                        {item.user_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-900 uppercase italic">{item.user_name}</span>
                        <span className="text-[9px] font-bold text-[#87be00] uppercase tracking-tighter">{item.user_role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col max-w-md">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs font-black text-gray-800 uppercase tracking-tighter">{item.title}</span>
                         <span className="text-[9px] font-bold text-gray-300">| {item.created_at_date}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed italic line-clamp-1">{item.message}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center gap-2">
                      {/* 🚩 EL DOBLE CHECK AZUL ESTILO WHATSAPP */}
                      <div className="flex items-center gap-1 text-[#34B7F1]">
                        <FiCheck size={14} strokeWidth={4} />
                        <FiCheck size={14} className="-ml-2" strokeWidth={4} />
                        <span className="text-[9px] font-black uppercase italic ml-1">Visto</span>
                      </div>

                      {/* 🚩 EL BADGE DE FECHA/HORA (Igual a tu foto) */}
                      <div className="bg-[#E0F6FF] text-[#34B7F1] px-4 py-1.5 rounded-full flex items-center gap-2 border border-[#BDE8FF]">
                         <FiClock size={10} strokeWidth={3} />
                         <span className="text-[9px] font-black uppercase tracking-tighter">
                            Leído a las {item.read_at_time || '00:00'}
                         </span>
                      </div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest italic">
                        {item.read_at_date}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlertsHistory;