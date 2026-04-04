import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FiSearch, FiFilter, FiCalendar, FiMapPin, 
  FiDownload, FiExternalLink, FiImage, FiBriefcase, FiUser, FiHash 
} from "react-icons/fi";
import api from "../api/apiClient"; 
import { useAuth } from "../context/AuthContext";

const PhotoAuditDashboard = () => {
  const { user } = useAuth(); 
  const isRoot = user?.role === 'ROOT';

  // --- ESTADOS DE FILTROS ---
  const [filters, setFilters] = useState({
    empresa_id: "",
    cadena: "",
    codigo: "", // 🚩 Nuevo estado para el código
    fecha: new Date().toISOString().split('T')[0], 
    search: ""
  });

  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- 1. CARGA DE EMPRESAS ---
  const { data: companies = [] } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const response = await api.get("/companies");
      const rawData = response.data?.companies || response.data || response || [];
      return Array.isArray(rawData) ? rawData : [];
    },
    enabled: isRoot
  });

  // --- 2. CARGA DE LOCALES (PARA SELECTORES DE CADENA Y CÓDIGO) ---
  const { data: allLocales = [] } = useQuery({
    queryKey: ["all-locales-list", filters.empresa_id],
    queryFn: async () => {
      const response = await api.get(`/locales?company_id=${filters.empresa_id}`);
      return response.data || response || [];
    },
    enabled: !!filters.empresa_id 
  });

  // Memorizamos las cadenas únicas
  const availableCadenas = useMemo(() => {
    if (!filters.empresa_id || !Array.isArray(allLocales)) return [];
    const unique = [...new Set(allLocales.map(l => l.cadena).filter(Boolean))];
    return unique.sort();
  }, [allLocales, filters.empresa_id]);

  // 🚩 Memorizamos los códigos únicos (se filtran si hay una cadena seleccionada)
  const availableCodigos = useMemo(() => {
    if (!filters.empresa_id || !Array.isArray(allLocales)) return [];
    
    const filteredByChain = filters.cadena 
      ? allLocales.filter(l => l.cadena === filters.cadena)
      : allLocales;

    const unique = [...new Set(filteredByChain.map(l => l.codigo_local || l.codigo_pos).filter(Boolean))];
    return unique.sort();
  }, [allLocales, filters.empresa_id, filters.cadena]);

  // --- 3. FETCH DE FOTOS ---
  const { data: photos = [], isLoading: isLoadingPhotos } = useQuery({
    queryKey: ["audit-photos", filters.fecha, filters.empresa_id], 
    queryFn: async () => {
      if (!filters.empresa_id) return [];
      
      const response = await api.get("/reports/photos", { 
        params: { 
          fecha: filters.fecha, 
          empresa_id: filters.empresa_id
        } 
      });
      return response.data || [];
    },
    enabled: !!filters.empresa_id
  });

  // --- 4. FILTRADO FINAL EN CLIENTE (CADENA + CÓDIGO + BÚSQUEDA) ---
  const filteredPhotos = useMemo(() => {
    if (!Array.isArray(photos)) return [];
    const searchTerm = filters.search.toLowerCase().trim();

    return photos.filter(p => {
      const matchesCadena = filters.cadena === "" || p.cadena === filters.cadena;
      // 🚩 Filtro de código (compara contra local_codigo que viene del backend)
      const matchesCodigo = filters.codigo === "" || String(p.local_codigo) === String(filters.codigo);
      
      const matchesSearch = searchTerm === "" || 
        (p.user_name?.toLowerCase().includes(searchTerm)) ||
        (p.user_rut?.toLowerCase().includes(searchTerm)) ||
        (p.local_nombre?.toLowerCase().includes(searchTerm));
      
      return matchesCadena && matchesCodigo && matchesSearch;
    });
  }, [photos, filters.cadena, filters.codigo, filters.search]);

  // --- 5. LÓGICA DE AUTOCOMPLETADO ---
  const suggestions = useMemo(() => {
    if (filters.search.length < 2 || !Array.isArray(photos)) return [];
    
    const uniqueUsers = photos.reduce((acc, p) => {
      if (!acc.find(u => u.rut === p.user_rut)) {
        acc.push({ name: p.user_name, rut: p.user_rut });
      }
      return acc;
    }, []);

    const term = filters.search.toLowerCase();
    return uniqueUsers.filter(u => 
      u.name?.toLowerCase().includes(term) || u.rut?.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [photos, filters.search]);

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x300?text=Sin+Imagen";
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}/uploads${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 font-[Outfit]">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Auditoría Fotográfica</h1>
        <p className="text-[#87be00] text-[10px] font-black uppercase tracking-widest italic">Cultivapp Business Intelligence</p>
      </header>

      {/* --- BARRA DE FILTROS --- */}
      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Selector Empresa */}
          {isRoot && (
            <div className="relative">
              <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87be00] z-10 pointer-events-none" />
              <select 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20 cursor-pointer"
                value={filters.empresa_id}
                onChange={(e) => setFilters({...filters, empresa_id: e.target.value, cadena: "", codigo: "", search: ""})}
              >
                <option value="">SELECCIONAR EMPRESA</option>
                {companies.map(emp => (
                  <option key={emp.id} value={emp.id}>{(emp.name || emp.nombre).toUpperCase()}</option>
                ))}
              </select>
            </div>
          )}

          {/* Selector Cadena */}
          <div className="relative">
            <FiFilter className={`absolute left-4 top-1/2 -translate-y-1/2 ${filters.empresa_id ? 'text-[#87be00]' : 'text-gray-300'} z-10 pointer-events-none`} />
            <select 
              disabled={!filters.empresa_id}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20 cursor-pointer disabled:opacity-50"
              value={filters.cadena}
              onChange={(e) => setFilters({...filters, cadena: e.target.value, codigo: ""})}
            >
              <option value="">{filters.empresa_id ? "TODAS LAS CADENAS" : "BLOQUEADO"}</option>
              {availableCadenas.map(cad => <option key={cad} value={cad}>{cad.toUpperCase()}</option>)}
            </select>
          </div>

          {/* 🚩 Selector Código */}
          <div className="relative">
            <FiHash className={`absolute left-4 top-1/2 -translate-y-1/2 ${filters.empresa_id ? 'text-[#87be00]' : 'text-gray-300'} z-10 pointer-events-none`} />
            <select 
              disabled={!filters.empresa_id}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20 cursor-pointer disabled:opacity-50"
              value={filters.codigo}
              onChange={(e) => setFilters({...filters, codigo: e.target.value})}
            >
              <option value="">{filters.empresa_id ? "TODOS LOS CÓDIGOS" : "BLOQUEADO"}</option>
              {availableCodigos.map(cod => <option key={cod} value={cod}>{cod}</option>)}
            </select>
          </div>

          {/* Selector Fecha */}
          <div className="relative">
            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87be00] z-10 pointer-events-none" />
            <input 
              type="date"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-[11px] font-black outline-none focus:ring-2 focus:ring-[#87be00]/20 cursor-pointer"
              value={filters.fecha}
              onChange={(e) => setFilters({...filters, fecha: e.target.value})}
            />
          </div>

          {/* Buscador Dinámico */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10 pointer-events-none" />
            <input 
              type="text"
              placeholder="BUSCAR..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20"
              value={filters.search}
              onChange={(e) => {
                setFilters({...filters, search: e.target.value});
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          </div>
        </div>
      </section>

      {/* --- GRID DE RESULTADOS --- */}
      {!filters.empresa_id ? (
        <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
           <FiBriefcase className="mx-auto text-gray-200 mb-4" size={50} />
           <p className="text-[12px] font-black text-gray-400 uppercase italic">Seleccione una empresa para cargar la auditoría</p>
        </div>
      ) : isLoadingPhotos ? (
        <div className="py-20 text-center">
          <FiImage className="animate-spin mx-auto text-[#87be00]" size={40} />
          <p className="mt-4 text-[10px] font-black uppercase text-gray-400 italic">Sincronizando Galería...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPhotos.map((item) => (
            <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="relative h-64 bg-gray-100 overflow-hidden">
                <img 
                  src={getImageUrl(item.photo_url)} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt="Evidencia" 
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/400x300?text=Error+Archivo"; }}
                />
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-[#87be00] text-[8px] font-black px-3 py-1 rounded-full uppercase">
                  {item.photo_type}
                </div>
                {item.local_codigo && (
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black px-2 py-1 rounded-md">
                    CÓD: {item.local_codigo}
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-[#87be00] font-black text-[10px]">
                    {item.user_name?.substring(0,2).toUpperCase() || '??'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-900 uppercase truncate">{item.user_name || 'Sin Nombre'}</p>
                    <p className="text-[8px] font-bold text-[#87be00] uppercase truncate">{item.cadena} - {item.local_nombre}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a 
                    href={getImageUrl(item.photo_url)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex-1 py-3 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-black hover:text-[#87be00] transition-all"
                  >
                    <FiExternalLink size={16}/>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoAuditDashboard;