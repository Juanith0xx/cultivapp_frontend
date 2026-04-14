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

  // --- ESTADOS DE FILTROS ---
  const [searchTerm, setSearchTerm] = useState(""); 
  const [debouncedSearch, setDebouncedSearch] = useState(""); 
  const [filters, setFilters] = useState({
    empresa_id: isRoot ? "" : user?.company_id,
    cadena: "",
    codigo: "",
    fecha: new Date().toISOString().split('T')[0], 
  });

  // --- LÓGICA DE DEBOUNCE ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- 1. CARGA DE LOCALES (Dinamismo para los Selects) ---
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

  // --- 2. FETCH DE FOTOS ---
  const { data: photos = [], isLoading: isLoadingPhotos, isFetching } = useQuery({
    queryKey: ["audit-photos", filters.fecha, filters.empresa_id, debouncedSearch], 
    queryFn: async () => {
      const params = {};
      if (filters.empresa_id) params.empresa_id = filters.empresa_id;
      
      /**
       * Si hay búsqueda global, el backend prioriza el texto sobre la fecha
       */
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

  // Filtros locales sobre el set de datos descargado
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
   * Limpia rutas corruptas (ej. default_tenant) para que el navegador las encuentre.
   */
  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x300?text=Sin+Imagen";
    if (path.startsWith('http')) return path;

    const baseUrl = import.meta.env.VITE_API_URL.split('/api')[0];
    const cleanPath = path.trim()
      .replace(/\\/g, "/") // Convierte barras Windows a Web
      .replace(/^uploads\//i, '') // Evita duplicar 'uploads/'
      .replace(/^\//, '');

    return `${baseUrl}/uploads/${cleanPath}`;
  };

  /**
   * 📥 FUNCIÓN DE DESCARGA (Forzada por Blob)
   */
  const handleDownload = async (imageUrl, fileName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Nombre limpio: evidencia_juan_perez_fachada.jpg
      link.download = fileName.replace(/\s+/g, '_').toLowerCase();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al descargar: La imagen no pudo ser procesada.");
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
              {debouncedSearch ? `Búsqueda Global: ${debouncedSearch}` : `Evidencias: ${filters.fecha}`}
            </p>
            {isFetching && <div className="w-2 h-2 bg-[#87be00] rounded-full animate-ping"></div>}
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
              {availableCadenas.map(cad => <option key={cad} value={cad}>{cad.toUpperCase()}</option>)}
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Si el usuario escribe, limpiamos los filtros de local para no bloquear resultados
                if(e.target.value) setFilters(prev => ({...prev, cadena: "", codigo: ""}));
              }}
            />
            {searchTerm && (
                <button 
                  onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"
                >
                  <FiX size={16} />
                </button>
            )}
          </div>
        </div>
      </section>

      {/* GRID DE RESULTADOS */}
      {isLoadingPhotos ? (
        <div className="py-20 text-center text-[10px] font-black uppercase italic animate-pulse">
            Localizando evidencias en servidor...
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[3.5rem] border border-dashed border-gray-100">
           <FiImage className="mx-auto text-gray-100 mb-6" size={60} />
           <p className="text-[10px] font-black text-gray-300 uppercase italic">Sin registros encontrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map((item) => {
            const currentUrl = getImageUrl(item.photo_url);
            return (
              <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50 group hover:shadow-xl transition-all">
                <div className="relative h-60 overflow-hidden bg-gray-50">
                  <img 
                    src={currentUrl} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt="Evidencia" 
                    onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Error+al+cargar"; }}
                  />
                  <div className="absolute top-4 left-4 bg-black/80 text-[#87be00] text-[8px] font-black px-3 py-1.5 rounded-full uppercase italic shadow-lg">
                    {item.photo_type || 'Visita'}
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-[#87be00] font-black text-xs italic">
                      {item.user_name ? item.user_name.substring(0,2).toUpperCase() : '??'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-gray-900 uppercase italic truncate">{item.user_name}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase truncate mt-1">
                        {item.cadena} • {item.local_nombre}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                      <a href={currentUrl} target="_blank" rel="noreferrer" 
                        className="py-3 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-black hover:text-[#87be00] transition-all">
                        <FiExternalLink size={18}/>
                      </a>
                      <button onClick={() => handleDownload(currentUrl, `evidencia_${item.user_name}_${item.photo_type}.jpg`)}
                        className="py-3 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-[#87be00] hover:text-white transition-all">
                        <FiDownload size={18}/>
                      </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PhotoValidation;