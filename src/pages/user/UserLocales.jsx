import { useEffect, useState } from "react";
import { FiMapPin, FiPhone, FiSearch, FiNavigation, FiInfo } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";

const UserLocales = () => {
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMyLocales = async () => {
    try {
      setLoading(true);
      // Este endpoint debe traer los locales únicos donde el usuario tiene rutas asignadas
      const data = await api.get("/locales/my-assigned");
      setLocales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error locales:", error);
      toast.error("No se pudieron cargar tus locales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLocales();
  }, []);

  // Filtrado en tiempo real
  const filteredLocales = locales.filter(l => 
    l.cadena?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center animate-pulse font-black text-gray-300">CARGANDO TUS PUNTOS DE VENTA...</div>;

  return (
    <div className="p-4 space-y-6 font-[Outfit] animate-in fade-in duration-500">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Mis Locales</h1>
          <p className="text-[#87be00] text-[10px] font-black uppercase tracking-widest mt-1">Puntos de venta asignados a tu ruta</p>
        </div>

        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por local o dirección..."
            className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTADO DE CARDS */}
      <div className="space-y-4">
        {filteredLocales.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-center">
            <p className="text-gray-300 font-black uppercase text-[10px] tracking-[0.2em]">No se encontraron locales asignados</p>
          </div>
        ) : (
          filteredLocales.map((local) => (
            <div key={local.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#87be00]/30 transition-all group">
              
              {/* BLOQUE 1: IDENTIFICACIÓN */}
              <div className="flex items-center gap-5 w-full md:w-1/3">
                <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center font-black text-[#87be00] text-xl shadow-inner group-hover:bg-[#87be00] group-hover:text-white transition-all duration-500">
                  {local.cadena?.charAt(0) || 'L'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase leading-none mb-1">{local.cadena}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-[9px] font-black text-gray-400 rounded-md uppercase">ID: {local.numero_local || 'N/A'}</span>
                    <span className="text-[10px] text-[#87be00] font-black uppercase tracking-wider italic">Activo</span>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: UBICACIÓN */}
              <div className="flex flex-col w-full md:w-1/3">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Dirección del Punto</span>
                <div className="flex items-start gap-2">
                  <FiMapPin className="text-[#87be00] mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs font-bold text-gray-600 leading-tight italic">
                    {local.direccion}, <span className="text-gray-400">{local.comuna_name || local.comuna}</span>
                  </span>
                </div>
              </div>

              {/* BLOQUE 3: ACCIONES */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                {local.lat && local.lng && (
                   <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-500 hover:text-white transition-all"
                    title="Cómo llegar"
                  >
                    <FiNavigation size={18} />
                  </a>
                )}
                
                {local.telefono && (
                  <a 
                    href={`tel:${local.telefono}`}
                    className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-[#87be00] hover:bg-[#87be00]/5 transition-all"
                  >
                    <FiPhone size={18} />
                  </a>
                )}
                
                <button 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  <FiInfo size={14} />
                  Detalle Local
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserLocales;