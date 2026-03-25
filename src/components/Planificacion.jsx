import { useState, useEffect } from "react";
import api from "../api/apiClient";
import ManageRoutesModal from "./ManageRoutesModal"; // Ajusta la ruta según tu carpeta
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiCalendar } from "react-icons/fi";

const Planificacion = () => {
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. CARGA INICIAL DE DATOS
  const fetchData = async () => {
    try {
      setLoading(true);
      // Ejecutamos todas las cargas en paralelo para mayor velocidad
      const [resRoutes, resUsers, resLocales, resCompanies] = await Promise.all([
        api.get("/routes"),
        api.get("/users"),
        api.get("/locales"),
        api.get("/companies") // 🚩 ESTO ES LO QUE NECESITA EL ROOT
      ]);

      setRoutes(resRoutes);
      setUsers(resUsers);
      setLocales(resLocales);
      setCompanies(resCompanies);
    } catch (error) {
      toast.error("Error al cargar datos de planificación");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. FUNCIONES DE APERTURA
  const handleCreate = () => {
    setSelectedRoute(null);
    setIsModalOpen(true);
  };

  const handleEdit = (route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-10 text-center font-black uppercase italic">Cargando Sistema...</div>;

  return (
    <div className="p-8 font-[Outfit]">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Planificación</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Gestión de rutas y reponedores</p>
        </div>
        
        <button 
          onClick={handleCreate}
          className="bg-[#87be00] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-[#87be00]/20 flex items-center gap-2 hover:scale-105 transition-all"
        >
          <FiPlus size={16} /> Nueva Planificación
        </button>
      </div>

      {/* TABLA DE RUTAS */}
      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Empresa / Cadena</th>
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Reponedor</th>
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Día / Hora</th>
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {routes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6">
                  <div className="font-black text-sm uppercase">{route.cadena}</div>
                  <div className="text-[10px] text-gray-400 font-bold">{route.direccion}</div>
                  <div className="text-[9px] text-[#87be00] font-black">{route.company_name}</div>
                </td>
                <td className="p-6 font-bold text-sm text-gray-600">
                  {route.first_name} {route.last_name}
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <FiCalendar className="text-[#87be00]" />
                    {route.day_of_week === 1 ? 'Lunes' : route.day_of_week === 2 ? 'Martes' : 'Miércoles...'}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{route.start_time?.slice(0,5)} hrs</div>
                </td>
                <td className="p-6 text-center">
                  <button 
                    onClick={() => handleEdit(route)}
                    className="p-3 bg-gray-100 rounded-xl text-gray-400 hover:bg-black hover:text-white transition-all"
                  >
                    <FiEdit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EL MODAL QUE YA TENEMOS */}
      <ManageRoutesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={users}
        locales={locales}
        companies={companies} // 🚩 AQUÍ LE PASAMOS LAS EMPRESAS AL MODAL
        initialData={selectedRoute}
        onCreated={fetchData}
      />
    </div>
  );
};

export default Planificacion;