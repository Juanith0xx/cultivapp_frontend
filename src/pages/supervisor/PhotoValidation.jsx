import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FiSearch, FiFilter, FiCalendar, FiImage, FiHash, FiExternalLink, 
  FiCamera, FiX, FiDownload 
} from "react-icons/fi";
import api from "../../api/apiClient"; 
import { useAuth } from "../../context/AuthContext";

const PhotoValidation = () => {
  const { user } = useAuth(); 
  const isRoot = user?.role === 'ROOT';

  const [searchTerm, setSearchTerm] = useState(""); 
  const [debouncedSearch, setDebouncedSearch] = useState(""); 
  const [filters, setFilters] = useState({
    empresa_id: isRoot ? "" : user?.company_id,
    cadena: "",
    codigo: "",
    fecha: new Date().toISOString().split('T')[0], 
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: allLocales = [] } = useQuery({
    queryKey: ["all-locales-list", filters.empresa_id],
    queryFn: async () => {
      const response = await api.get("/locales", { 
        params: { company_id: filters.empresa_id || undefined } 
      });
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

  const { data: photos = [], isLoading: isLoadingPhotos, isFetching } = useQuery({
    queryKey: ["audit-photos", filters.fecha, filters.empresa_id, debouncedSearch], 
    queryFn: async () => {
      const params = {};
      if (filters.empresa_id) params.empresa_id = filters.empresa_id;
      if (debouncedSearch) {
        params.search = debouncedSearch;
      } else {
        params.fecha = filters.fecha;
      }
      const response = await api.get("/reports/photos", { params });
      return response.data || response || [];
    },
    enabled: !!filters.empresa_id
  });

  const filteredPhotos = useMemo(() => {
    if (!Array.isArray(photos)) return [];
    return photos.filter(p => {
      const matchesCadena = filters.cadena === "" || p.cadena === filters.cadena;
      const matchesCodigo = filters.codigo === "" || String(p.local_codigo) === String(filters.codigo);
      return matchesCadena && matchesCodigo;
    });
  }, [photos, filters.cadena, filters.codigo]);

  /**
   * 🖼️ GESTIÓN DE URL DE IMÁGENES
   */
  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x300?text=Sin+Imagen";
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    const cleanPath = path.trim().replace(/\\/g, "/").replace(/^uploads\//, '').replace(/^\//, '');
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  /**
   * 📥 FUNCIÓN PARA DESCARGAR IMAGEN
   */
  const handleDownload = async (imageUrl, fileName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'evidencia-cultiva.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar la imagen:", error);
    }
  };

  return (
    <div className="space-y-8 font-[Outfit]">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
            Validación de Ejecución
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {debouncedSearch ? `Resultados para: ${debouncedSearch}` : `Evidencias: ${filters.fecha}`}
            </p>
            {(isFetching || searchTerm !== debouncedSearch) && (
               <div className="w-2 h-2 bg-[#87be00] rounded-full animate-ping"></div>
            )}
          </div>
        </div>
        <div className="bg-black p-4 rounded-2xl shadow-xl hidden md:block border border-white/10">
            <FiCamera className="text-[#87be00]" size={24} />
        </div>
      </div>

      {/* FILTROS */}
      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50">
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
              onChange={(e) => {
                setSearchTerm(""); 
                setFilters({...filters, fecha: e.target.value});
              }}
            />
          </div>

          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input 
              type="text"
              placeholder="NOMBRE O RUT..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-[1.5rem] border-none text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <button 
                    onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"
                >
                    <FiX size={16}/>
                </button>
            )}
          </div>
        </div>
      </section>

      {/* GALERÍA */}
      {isLoadingPhotos ? (
        <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-[#87be00] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase italic">Sincronizando evidencias...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[3.5rem] border border-dashed border-gray-100">
           <FiImage className="mx-auto text-gray-100 mb-6" size={60} />
           <p className="text-[10px] font-black text-gray-300 uppercase italic tracking-[0.2em]">Sin registros para mostrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredPhotos.map((item) => (
            <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50 hover:shadow-2xl transition-all group">
              <div className="relative h-64 overflow-hidden bg-gray-50">
                <img 
                  src={getImageUrl(item.photo_url)} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt="Evidencia" 
                  loading="lazy"
                  onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Archivo+No+Encontrado"; }}
                />
                <div className="absolute top-5 left-5 bg-black/80 backdrop-blur-md text-[#87be00] text-[8px] font-black px-4 py-2 rounded-full uppercase italic border border-white/10 shadow-lg">
                  {item.photo_type || 'General'}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-11 h-11 bg-black rounded-2xl flex items-center justify-center text-[#87be00] font-black text-xs shadow-lg">
                    {item.user_name ? item.user_name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-gray-900 uppercase italic truncate">{item.user_name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase truncate mt-1">
                      {item.cadena} • {item.local_nombre}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <a 
                    href={getImageUrl(item.photo_url)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="py-4 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-black hover:text-[#87be00] transition-all"
                    title="Ver original"
                    >
                    <FiExternalLink size={20}/>
                    </a>
                    
                    <button 
                    onClick={() => handleDownload(getImageUrl(item.photo_url), `${item.user_name}-${item.photo_type}.jpg`)}
                    className="py-4 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-[#87be00] hover:text-white transition-all"
                    title="Descargar imagen"
                    >
                    <FiDownload size={20}/>
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoValidation;