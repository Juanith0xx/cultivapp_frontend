import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiCalendar, FiMapPin, FiUser, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import toast from "react-hot-toast";

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setAuthError(false);

      // Usamos tu api.get que ya maneja los tokens
      const [routesData, usersData, localesData] = await Promise.all([
        api.get("/routes"),
        api.get("/users"), // El backend ahora filtra por empresa y el front por rol
        api.get("/locales")
      ]);

      // 🔍 DEBUG IMPORTANTE: Revisa qué llega al componente
      console.log("🟢 DATOS CARGADOS EXITOSAMENTE:", {
        rutas: routesData,
        usuarios: usersData,
        locales: localesData
      });

      setRoutes(Array.isArray(routesData) ? routesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLocales(Array.isArray(localesData) ? localesData : []);
      
    } catch (error) {
      console.error("❌ ERROR AL CARGAR DATOS:", error.message);
      
      if (error.message.includes("401") || error.message.includes("No autorizado")) {
        setAuthError(true);
        toast.error("Sesión expirada. Por favor reingresa.");
      } else {
        toast.error("Error al conectar con el servidor de Render");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4 space-y-6 font-[Outfit] animate-in fade-in duration-500">
      
      {/* ALERTA DE ERROR DE SESIÓN */}
      {authError && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 animate-bounce">
          <FiAlertCircle size={20} />
          <span className="text-xs font-black uppercase tracking-widest">Error de autenticación: Por favor cierra sesión y vuelve a entrar.</span>
        </div>
      )}

      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Planificación de Rutas</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#87be00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#87be00]"></span>
            </span>
            <p className="text-[#87be00] text-[10px] font-black uppercase tracking-widest">
              {routes.length} Rutas en sistema
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-gray-600 transition-all disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-2"
          >
            <FiPlus size={16} />
            Agendar Ruta
          </button>
        </div>
      </div>

      {/* TABLA DE RUTAS PLANIFICADAS */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Mercaderista</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Local</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Fecha</th>
                <th className="p-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-[#87be00] rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Sincronizando con Render...</span>
                  </td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-gray-300 font-bold italic text-sm">
                    {authError ? "No se pudieron cargar datos (Sesión inválida)" : "No hay rutas agendadas."}
                  </td>
                </tr>
              ) : (
                routes.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-black text-[10px]">
                          {r.first_name?.charAt(0)}{r.last_name?.charAt(0)}
                        </div>
                        <span className="text-xs font-black text-gray-800 uppercase tracking-tight">{r.first_name} {r.last_name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{r.cadena}</span>
                        <span className="text-[9px] text-gray-400 uppercase">{r.direccion}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-black text-gray-800">
                        {new Date(r.visit_date).toLocaleDateString('es-CL')}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-400">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ManageRoutesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        users={users} 
        locales={locales} 
        onCreated={fetchData} 
      />
    </div>
  );
};

export default AdminRoutes;