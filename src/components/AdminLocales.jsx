import { useEffect, useState, useMemo } from "react";
import { 
  FiPlus, FiUpload, FiTrash2, FiEdit, FiMapPin, 
  FiHash, FiEye, FiEyeOff, FiSearch 
} from "react-icons/fi"; 
import api from "../api/apiClient";
import toast from "react-hot-toast";

// Componentes
import CreateLocalModal from "../components/CreateLocalModal";
import UploadLocalesModal from "../components/UploadLocalesModal";
import EditLocalModal from "../components/EditLocalModal";
import LocalesMap from "../components/LocalesMap";

const AdminLocales = () => {
  const [locales, setLocales] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modales
  const [openCreate, setOpenCreate] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState(null);

  // Mapa
  const [mapSelectedId, setMapSelectedId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchLocales();
  }, []);

  const fetchLocales = async () => {
    try {
      // Filtramos directamente por la compañía del usuario logueado
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

  // LÓGICA DE FILTRADO (Igual a Root para consistencia)
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
    <div className="space-y-6 animate-in fade-in duration-500 font-[Outfit]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">
            Gestión de Locales
          </h2>
          <p className="text-xs font-bold text-[#87be00] uppercase tracking-widest">
            Administración de puntos y geocercas - {user.company_name}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setOpenUpload(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-sm"
          >
            <FiUpload size={16} className="text-gray-500" />
            Carga Masiva
          </button>
          <button
            onClick={() => setOpenCreate(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#87be00] transition shadow-xl shadow-gray-200"
          >
            <FiPlus size={16} />
            Crear Local
          </button>
        </div>
      </div>

      {/* FILTROS Y MAPA (IDÉNTICO A ROOT) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
             <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Buscar por cadena, comuna o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 transition"
                />
             </div>

             <button 
              onClick={() => setShowInactive(!showInactive)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                showInactive ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-gray-50 text-gray-400 border border-gray-100"
              }`}
             >
               {showInactive ? <FiEye size={14}/> : <FiEyeOff size={14}/>}
               {showInactive ? "MOSTRANDO INACTIVOS" : "OCULTANDO INACTIVOS"}
             </button>
          </div>

          <div className="h-[400px] w-full rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner bg-gray-50 relative">
             <LocalesMap locales={filteredLocales} selectedLocal={activeSelectedLocal} />
          </div>
        </div>
      </div>

      {/* TABLA DE LOCALES */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-5 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Código</th>
                <th className="p-5 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Cadena</th>
                <th className="p-5 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Ubicación</th>
                <th className="p-5 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Dirección</th>
                <th className="p-5 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">Contacto</th>
                <th className="p-5 text-center font-black text-gray-400 uppercase text-[9px] tracking-widest">Estado</th>
                <th className="p-5 text-center font-black text-gray-400 uppercase text-[9px] tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLocales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-20 text-center font-bold italic text-gray-300">
                    No se encontraron locales.
                  </td>
                </tr>
              ) : (
                filteredLocales.map(local => (
                  <tr 
                    key={local.id} 
                    className={`group hover:bg-gray-50/80 transition-colors cursor-pointer ${mapSelectedId === local.id ? 'bg-[#87be00]/5' : ''} ${!local.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    onClick={() => setMapSelectedId(local.id)}
                  >
                    <td className="p-5">
                      <span className="flex items-center gap-2 font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-lg w-fit text-[10px]">
                        <FiHash className="text-[#87be00]" />
                        {local.codigo_local || 'S/C'}
                      </span>
                    </td>
                    <td className="p-5 font-black text-gray-800 uppercase tracking-tight">{local.cadena}</td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{local.comuna_name || local.comuna}</span>
                        <span className="text-[9px] font-black text-[#87be00] uppercase tracking-tighter">
                          {local.region_name || local.region}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-[11px] text-gray-500 font-medium">
                      <div className="flex items-center gap-2">
                        <FiMapPin size={12} className="text-[#87be00] shrink-0" />
                        {local.direccion}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-gray-800 uppercase leading-none mb-1">
                          {local.gerente || 'No asignado'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">{local.telefono}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleLocal(local.id)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                          local.is_active ? "bg-[#87be00]" : "bg-gray-200"
                        }`}
                      >
                        <span className={`h-3 w-3 transform rounded-full bg-white transition-transform ${local.is_active ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="p-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(local)} className="p-2 text-gray-400 hover:text-[#87be00] hover:bg-[#87be00]/5 rounded-xl transition">
                          <FiEdit size={16} />
                        </button>
                        <button onClick={() => deleteLocal(local.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALES */}
      <CreateLocalModal 
        isOpen={openCreate} 
        onClose={() => setOpenCreate(false)} 
        onCreated={fetchLocales} 
        companies={[{ id: user.company_id }]} 
        autoCompanyId={user.company_id} 
      />
      <UploadLocalesModal 
        isOpen={openUpload} 
        onClose={() => setOpenUpload(false)} 
        onUploaded={fetchLocales} 
        companyId={user.company_id} 
      />
      {selectedLocal && (
        <EditLocalModal 
          isOpen={openEdit} 
          onClose={() => { setOpenEdit(false); setSelectedLocal(null); }} 
          onUpdated={fetchLocales} 
          local={selectedLocal}
          companies={[{ id: user.company_id, name: user.company_name }]}
        />
      )}
    </div>
  );
};

export default AdminLocales;