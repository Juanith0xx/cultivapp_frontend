import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FiSearch, FiFilter, FiCalendar, FiMapPin, 
  FiImage, FiBriefcase, FiHash, FiExternalLink, FiCamera 
} from "react-icons/fi";
import api from "../../api/apiClient"; 
import { useAuth } from "../../context/AuthContext";

const PhotoValidation = () => {
  const { user } = useAuth(); 
  const isRoot = user?.role === 'ROOT';

  // --- ESTADOS DE FILTROS ---
  // Si no es ROOT, ya viene pre-filtrado por la empresa del supervisor
  const [filters, setFilters] = useState({
    empresa_id: isRoot ? "" : user?.company_id,
    cadena: "",
    codigo: "",
    fecha: new Date().toISOString().split('T')[0], 
    search: ""
  });

  // --- 1. CARGA DE LOCALES (Para selectores) ---
  const { data: allLocales = [] } = useQuery({
    queryKey: ["all-locales-list", filters.empresa_id],
    queryFn: async () => {
      const response = await api.get(`/locales?company_id=${filters.empresa_id}`);
      return response.data || response || [];
    },
    enabled: !!filters.empresa_id 
  });

  const availableCadenas = useMemo(() => {
    if (!Array.isArray(allLocales)) return [];
    return [...new Set(allLocales.map(l => l.cadena).filter(Boolean))].sort();
  }, [allLocales]);

  const availableCodigos = useMemo(() => {
    if (!Array.isArray(allLocales)) return [];
    const filteredByChain = filters.cadena ? allLocales.filter(l => l.cadena === filters.cadena) : allLocales;
    return [...new Set(filteredByChain.map(l => l.codigo_local || l.codigo_pos).filter(Boolean))].sort();
  }, [allLocales, filters.cadena]);

  // --- 2. FETCH DE FOTOS ---
  const { data: photos = [], isLoading: isLoadingPhotos } = useQuery({
    queryKey: ["audit-photos", filters.fecha, filters.empresa_id], 
    queryFn: async () => {
      const response = await api.get("/reports/photos", { 
        params: { fecha: filters.fecha, empresa_id: filters.empresa_id } 
      });
      return response.data || [];
    },
    enabled: !!filters.empresa_id
  });

  const filteredPhotos = useMemo(() => {
    if (!Array.isArray(photos)) return [];
    const searchTerm = filters.search.toLowerCase().trim();

    return photos.filter(p => {
      const matchesCadena = filters.cadena === "" || p.cadena === filters.cadena;
      const matchesCodigo = filters.codigo === "" || String(p.local_codigo) === String(filters.codigo);
      const matchesSearch = searchTerm === "" || 
        p.user_name?.toLowerCase().includes(searchTerm) ||
        p.local_nombre?.toLowerCase().includes(searchTerm);
      
      return matchesCadena && matchesCodigo && matchesSearch;
    });
  }, [photos, filters.cadena, filters.codigo, filters.search]);

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x300?text=Sin+Imagen";
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    return `${baseUrl}/uploads${path.startsWith('/') ? path : `/${path}`}`;
  };

  return (
    <div className="space-y-8 font-[Outfit]">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
            Validación de Ejecución
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
            Evidencias fotográficas en sala
          </p>
        </div>
        <div className="bg-[#87be00]/10 p-4 rounded-2xl border border-[#87be00]/20 hidden md:block">
            <FiCamera className="text-[#87be00]" size={24} />
        </div>
      </div>

      {/* FILTROS CULTIVA STYLE */}
      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87be00] z-10" />
            <select 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-[1.5rem] border-none text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20 cursor-pointer"
              value={filters.cadena}
              onChange={(e) => setFilters({...filters, cadena: e.target.value, codigo: ""})}
            >
              <option value="">TODAS LAS CADENAS</option>
              {availableCadenas.map(cad => <option key={cad} value={cad}>{cad}</option>)}
            </select>
          </div>

          <div className="relative">
            <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87be00] z-10" />
            <select 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-[1.5rem] border-none text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20 cursor-pointer"
              value={filters.codigo}
              onChange={(e) => setFilters({...filters, codigo: e.target.value})}
            >
              <option value="">TODOS LOS CÓDIGOS</option>
              {availableCodigos.map(cod => <option key={cod} value={cod}>{cod}</option>)}
            </select>
          </div>

          <div className="relative">
            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87be00] z-10" />
            <input 
              type="date"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-[1.5rem] border-none text-[10px] font-black outline-none focus:ring-2 focus:ring-[#87be00]/20"
              value={filters.fecha}
              onChange={(e) => setFilters({...filters, fecha: e.target.value})}
            />
          </div>

          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input 
              type="text"
              placeholder="BUSCAR COLABORADOR..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-[1.5rem] border-none text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>
      </section>

      {/* GRID DE FOTOS */}
      {isLoadingPhotos ? (
        <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-[#87be00] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">Sincronizando Galería...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
           <FiImage className="mx-auto text-gray-200 mb-4" size={50} />
           <p className="text-[10px] font-black text-gray-400 uppercase italic">No se encontraron evidencias para los filtros seleccionados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map((item) => (
            <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50 hover:shadow-xl transition-all group relative">
              <div className="relative h-60 overflow-hidden">
                <img 
                  src={getImageUrl(item.photo_url)} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt="Evidencia" 
                />
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-[#87be00] text-[8px] font-black px-3 py-1.5 rounded-full uppercase italic tracking-widest border border-white/10">
                  {item.photo_type}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-[#87be00] font-black text-xs italic">
                    {item.user_name?.substring(0,1).toUpperCase()}{item.user_name?.split(' ')[1]?.substring(0,1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-gray-900 uppercase italic truncate">{item.user_name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter truncate leading-none mt-1">
                      {item.cadena} - {item.local_nombre}
                    </p>
                  </div>
                </div>

                <a 
                  href={getImageUrl(item.photo_url)} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-full py-3 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-[#87be00] transition-all group-hover:bg-[#87be00]/10"
                >
                  <FiExternalLink size={18}/>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoValidation;