import { useEffect, useRef, useState, useMemo } from "react";
import { 
  FiPlus, FiUpload, FiTrash2, FiEdit, FiMapPin, 
  FiHash, FiEye, FiEyeOff, FiSearch, FiPhone, FiUser 
} from "react-icons/fi"; 
import api from "../api/apiClient";
import toast from "react-hot-toast";

// Componentes
import CreateLocalModal from "../components/CreateLocalModal";
import UploadLocalesModal from "../components/UploadLocalesModal";
import EditLocalModal from "../components/EditLocalModal";
import LocalesMap from "../components/LocalesMap";
import { motion } from "framer-motion";

const AdminLocales = () => {
  const [locales, setLocales] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [openCreate, setOpenCreate] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [mapSelectedId, setMapSelectedId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchLocales();
  }, []);

  const fetchLocales = async () => {
    try {
      const data = await api.get(`/locales?company_id=${user.company_id}`);
      setLocales(data || []);
    } catch (error) {
      toast.error("Error al cargar locales");
    }
  };

  const handleEdit = (local) => {
    setSelectedLocal(local);
    setOpenEdit(true);
  };

  const toggleLocal = async (id) => {
    try {
      await api.patch(`/locales/${id}/toggle`);
      setLocales(prev => prev.map(l => 
        l.id === id ? { ...l, is_active: !l.is_active } : l
      ));
      toast.success("Estado actualizado");
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const deleteLocal = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este local?")) return;
    try {
      await api.delete(`/locales/${id}`);
      setLocales(prev => prev.filter(l => l.id !== id));
      toast.success("Local eliminado");
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  const filteredLocales = useMemo(() => {
    return locales.filter(l => {
      const matchesActive = showInactive || l.is_active;
      const matchesSearch = 
        l.cadena?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.comuna?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.codigo_local?.toString().includes(searchTerm);
      return matchesActive && matchesSearch;
    });
  }, [locales, showInactive, searchTerm]);

  const activeSelectedLocal = useMemo(() => {
    return filteredLocales.find(l => l.id === mapSelectedId);
  }, [mapSelectedId, filteredLocales]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-[Outfit] pb-10 px-2 sm:px-4 md:px-0">
      
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 px-1">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight uppercase leading-none italic">
            Gestión de Locales
          </h2>
          <p className="text-[10px] md:text-xs font-bold text-[#87be00] uppercase tracking-widest mt-2 md:mt-3">
            Administración de puntos y geocercas • {user.company_name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3 w-full lg:w-auto">
          <button
            onClick={() => setOpenUpload(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition shadow-sm"
          >
            <FiUpload size={16} className="text-gray-500" />
            Carga Masiva
          </button>
          <button
            onClick={() => setOpenCreate(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-[#87be00] transition shadow-xl shadow-gray-200 active:scale-95"
          >
            <FiPlus size={16} />
            Crear Local
          </button>
        </div>
      </div>

      {/* FILTROS Y MAPA */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm">
             <div className="relative w-full md:max-w-md">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Buscar por cadena, comuna o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 transition shadow-inner"
                />
             </div>

             <button 
              onClick={() => setShowInactive(!showInactive)}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[9px] md:text-[10px] font-black tracking-widest transition-all ${
                showInactive ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-gray-50 text-gray-400 border border-gray-100"
              }`}
             >
               {showInactive ? <FiEye size={14}/> : <FiEyeOff size={14}/>}
               {showInactive ? "MOSTRANDO INACTIVOS" : "OCULTANDO INACTIVOS"}
             </button>
          </div>

          <div className="h-[300px] md:h-[400px] w-full rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-gray-100 shadow-inner bg-gray-50 relative">
             <LocalesMap locales={filteredLocales} selectedLocal={activeSelectedLocal} />
          </div>
        </div>
      </div>

      {/* 🚩 VISTA MÓVIL: CARDS (Oculta en md) */}
      <div className="md:hidden space-y-4 px-1">
        {filteredLocales.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200 text-gray-300 font-bold uppercase text-[10px]">Sin resultados</div>
        ) : (
          filteredLocales.map((local, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              key={local.id}
              onClick={() => setMapSelectedId(local.id)}
              className={`bg-white p-5 rounded-[1.8rem] border-2 transition-all relative overflow-hidden ${mapSelectedId === local.id ? 'border-[#87be00] shadow-md' : 'border-transparent shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="flex items-center gap-1.5 font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg text-[9px]">
                  <FiHash className="text-[#87be00]" /> {local.codigo_local || 'S/C'}
                </span>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                   <button onClick={() => handleEdit(local)} className="p-2 bg-gray-50 text-gray-400 rounded-lg"><FiEdit size={14}/></button>
                   <button onClick={() => deleteLocal(local.id)} className="p-2 bg-red-50 text-red-400 rounded-lg"><FiTrash2 size={14}/></button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase italic">{local.cadena}</h3>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-[#87be00] uppercase mt-0.5">
                    {local.comuna_name || local.comuna} <span className="text-gray-300">•</span> {local.region_name || local.region}
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl">
                  <FiMapPin size={12} className="text-[#87be00] shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-gray-500 leading-tight">{local.direccion}</p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><FiUser size={12}/></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-800 uppercase leading-none">{local.gerente || 'S/N'}</span>
                      <span className="text-[8px] font-bold text-gray-400">{local.telefono || 'Sin tel'}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLocal(local.id); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${local.is_active ? "bg-[#87be00]" : "bg-gray-200"}`}
                  >
                    <span className={`h-3 w-3 transform rounded-full bg-white transition-transform ${local.is_active ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 🚩 VISTA DESKTOP: TABLA (Oculta en móvil) */}
      <div className="hidden md:block bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-6 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Código</th>
                <th className="p-6 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Cadena</th>
                <th className="p-6 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Ubicación</th>
                <th className="p-6 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Dirección</th>
                <th className="p-6 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Contacto</th>
                <th className="p-6 text-center font-black text-gray-400 uppercase text-[9px] tracking-widest">Estado</th>
                <th className="p-6 text-center font-black text-gray-400 uppercase text-[9px] tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLocales.length === 0 ? (
                <tr><td colSpan="7" className="p-20 text-center font-bold italic text-gray-300">No se encontraron locales.</td></tr>
              ) : (
                filteredLocales.map(local => (
                  <tr 
                    key={local.id} 
                    className={`group hover:bg-gray-50/80 transition-colors cursor-pointer ${mapSelectedId === local.id ? 'bg-[#87be00]/5' : ''} ${!local.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    onClick={() => setMapSelectedId(local.id)}
                  >
                    <td className="p-6"><span className="flex items-center gap-2 font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-lg w-fit text-[10px]"><FiHash className="text-[#87be00]" /> {local.codigo_local || 'S/C'}</span></td>
                    <td className="p-6 font-black text-gray-800 uppercase tracking-tight">{local.cadena}</td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{local.comuna_name || local.comuna}</span>
                        <span className="text-[9px] font-black text-[#87be00] uppercase tracking-tighter">{local.region_name || local.region}</span>
                      </div>
                    </td>
                    <td className="p-6 text-[11px] text-gray-500 font-medium">
                      <div className="flex items-center gap-2"><FiMapPin size={12} className="text-[#87be00] shrink-0" /> {local.direccion}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-gray-800 uppercase leading-none mb-1">{local.gerente || 'No asignado'}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{local.telefono}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleLocal(local.id)} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${local.is_active ? "bg-[#87be00]" : "bg-gray-200"}`}>
                        <span className={`h-3 w-3 transform rounded-full bg-white transition-transform ${local.is_active ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="p-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(local)} className="p-2 text-gray-400 hover:text-[#87be00] hover:bg-[#87be00]/5 rounded-xl transition"><FiEdit size={16} /></button>
                        <button onClick={() => deleteLocal(local.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateLocalModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onCreated={fetchLocales} companies={[{ id: user.company_id ,  name: user.company_name  }]} autoCompanyId={user.company_id} />
      <UploadLocalesModal isOpen={openUpload} onClose={() => setOpenUpload(false)} onUploaded={fetchLocales} companyId={user.company_id} />
      {selectedLocal && (
        <EditLocalModal isOpen={openEdit} onClose={() => { setOpenEdit(false); setSelectedLocal(null); }} onUpdated={fetchLocales} local={selectedLocal} companies={[{ id: user.company_id, name: user.company_name }]} />
      )}
    </div>
  );
};

export default AdminLocales;