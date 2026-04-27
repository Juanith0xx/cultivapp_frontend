import { useState, useEffect, useMemo } from "react";
import { 
  FiSend, FiUsers, FiInfo, FiAlertTriangle, 
  FiMapPin, FiLayers, FiCheckCircle, 
  FiSearch, FiTarget, FiLoader, FiShield, FiBriefcase, FiHash
} from "react-icons/fi";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const AlertManager = () => {
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocal, setSearchLocal] = useState(""); // Nuevo: búsqueda para locales

  const [users, setUsers] = useState([]);
  const [chains, setChains] = useState([]);
  const [allMyLocales, setAllMyLocales] = useState([]); 

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "OPERATIVA",
    scope: "TODOS",
    chainId: "",
    localId: "", // Se mantiene para compatibilidad con el envío
    selectedZone: "",
    selectedTargets: [] 
  });

  // 1. CARGA INICIAL: Usuarios y Cartera Completa del Supervisor
  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentUser?.company_id || !currentUser?.id) return;
      try {
        setFetchingData(true);
        const [uRes, cRes, lRes] = await Promise.all([
          api.get(`/users?company_id=${currentUser.company_id}`),
          api.get(`/chains?company_id=${currentUser.company_id}`),
          api.get(`/locales/supervisor/${currentUser.id}`)
        ]);

        const userData = uRes.data || uRes || [];
        const chainData = cRes.data || cRes || [];
        const localeData = lRes.data || lRes || [];

        setUsers(Array.isArray(userData) ? userData.filter(u => u.id !== currentUser.id && !u.deleted_at) : []);
        setChains(Array.isArray(chainData) ? chainData : []);
        setAllMyLocales(Array.isArray(localeData) ? localeData : []);
      } catch (error) {
        toast.error("Error al sincronizar datos");
      } finally {
        setFetchingData(false);
      }
    };
    loadInitialData();
  }, [currentUser]);

  // Filtro de Usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Filtro de Locales (Cartera)
  const filteredLocales = useMemo(() => {
    return allMyLocales.filter(l => 
      l.cadena?.toLowerCase().includes(searchLocal.toLowerCase()) || 
      l.codigo_local?.toLowerCase().includes(searchLocal.toLowerCase()) ||
      l.direccion?.toLowerCase().includes(searchLocal.toLowerCase())
    );
  }, [allMyLocales, searchLocal]);

  const toggleUserSelection = (userId) => {
    setForm(prev => ({
      ...prev,
      selectedTargets: prev.selectedTargets.includes(userId)
        ? prev.selectedTargets.filter(id => id !== userId)
        : [...prev.selectedTargets, userId]
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.message) return toast.error("El mensaje es obligatorio");
    if (form.scope === 'individual' && form.selectedTargets.length === 0) return toast.error("Selecciona destinatarios");
    if (form.scope === 'local' && !form.localId) return toast.error("Selecciona un Punto de Venta");

    setLoading(true);
    try {
      await api.post("/notifications/send-bulk", {
        ...form,
        company_id: currentUser.company_id,
        title: form.title || (form.type === "URGENTE" ? "ALERTA URGENTE" : "AVISO OPERATIVO"),
      });
      toast.success("Instrucción emitida con éxito");
      setForm(prev => ({ ...prev, title: "", message: "", selectedTargets: [], chainId: "", localId: "", selectedZone: "" }));
    } catch (error) {
      toast.error("Error al emitir notificación");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 font-[Outfit] max-w-7xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gray-900 rounded-[1.5rem] flex items-center justify-center text-[#87be00] shadow-xl">
                <FiShield size={28} />
            </div>
            <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">Centro de Notificaciones</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2 italic">
                    <span className="w-2 h-2 rounded-full bg-[#87be00] animate-pulse"></span>
                    Emisión de Instrucciones por Cartera
                </p>
            </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 italic">
            <FiBriefcase className="text-gray-400" size={14} />
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Supervisor: {currentUser?.first_name}
            </span>
        </div>
      </div>

      <form onSubmit={handleSend} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* IZQUIERDA: MENSAJE Y SELECCIÓN TIPO USUARIO/LOCAL */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            
            <div className="space-y-4">
              <input 
                type="text" placeholder="ASUNTO DE LA INSTRUCCIÓN..."
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white focus:border-[#87be00]/20 transition-all shadow-inner"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
              />
              <textarea 
                placeholder="DETALLE DE LA INSTRUCCIÓN PARA EL EQUIPO..."
                className="w-full h-48 bg-gray-50 border-2 border-transparent rounded-[2rem] p-6 text-sm font-medium outline-none focus:bg-white focus:border-[#87be00]/20 resize-none transition-all shadow-inner"
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                required
              />
            </div>

            {/* LISTADO DINÁMICO (USUARIOS O LOCALES) */}
            {(form.scope === 'individual' || form.scope === 'local') && (
              <div className="space-y-4 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center px-2">
                  <p className="text-[10px] font-black text-gray-900 uppercase italic tracking-widest flex items-center gap-2">
                    {form.scope === 'individual' ? <FiUsers className="text-[#87be00]" /> : <FiMapPin className="text-[#87be00]" />}
                    {form.scope === 'individual' ? `Personal Seleccionado: ${form.selectedTargets.length}` : `Punto de Venta Destino`}
                  </p>
                  <div className="relative w-40">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12}/>
                    <input 
                      type="text" placeholder="BUSCAR..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-[9px] font-black outline-none border border-transparent focus:border-[#87be00]/30 transition-all uppercase"
                      value={form.scope === 'individual' ? searchTerm : searchLocal}
                      onChange={(e) => form.scope === 'individual' ? setSearchTerm(e.target.value) : setSearchLocal(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-5 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner">
                  {fetchingData ? (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center"><FiLoader className="animate-spin text-[#87be00]" size={24}/></div>
                  ) : form.scope === 'individual' ? (
                    filteredUsers.map(u => (
                      <button key={u.id} type="button" onClick={() => toggleUserSelection(u.id)}
                        className={`p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between bg-white ${form.selectedTargets.includes(u.id) ? 'border-[#87be00] shadow-md' : 'border-transparent hover:border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black ${form.selectedTargets.includes(u.id) ? 'bg-[#87be00] text-white' : 'bg-gray-900 text-white'}`}>
                            {u.first_name?.[0]}{u.last_name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase truncate leading-none">{u.first_name} {u.last_name}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 italic">{u.role}</p>
                          </div>
                        </div>
                        {form.selectedTargets.includes(u.id) && <FiCheckCircle className="text-[#87be00]" size={16}/>}
                      </button>
                    ))
                  ) : (
                    filteredLocales.map(l => (
                      <button key={l.id} type="button" onClick={() => setForm({...form, localId: l.id})}
                        className={`p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between bg-white ${form.localId === l.id ? 'border-[#87be00] shadow-md' : 'border-transparent hover:border-gray-200'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] ${form.localId === l.id ? 'bg-[#87be00] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <FiMapPin />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase truncate leading-none italic">{l.cadena}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 truncate tracking-tighter">#{l.codigo_local} - {l.direccion}</p>
                          </div>
                        </div>
                        {form.localId === l.id && <FiCheckCircle className="text-[#87be00]" size={16}/>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full relative py-4 rounded-2xl bg-[#87be00] text-white text-[11px] font-black uppercase italic tracking-[0.2em] shadow-xl hover:bg-gray-900 transition-all flex items-center justify-center gap-3">
               {loading ? <FiLoader className="animate-spin" /> : <FiSend />}
               Emitir Instrucción
            </button>
          </div>
        </div>

        {/* DERECHA: CONFIGURACIÓN DE ALCANCE Y PRIORIDAD */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-7 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <p className="text-[9px] font-black uppercase text-[#87be00] tracking-[0.2em] italic text-center">Configuración de Alcance</p>
            <div className="grid grid-cols-2 gap-3">
               {[
                 { id: 'TODOS', label: 'Empresa', icon: <FiLayers size={18}/> },
                 { id: 'individual', label: 'Personal', icon: <FiUsers size={18}/> },
                 { id: 'local', label: 'Punto Venta', icon: <FiMapPin size={18}/> },
                 { id: 'ZONA', label: 'Zona', icon: <FiTarget size={18}/> }
               ].map(opt => (
                 <button key={opt.id} type="button" onClick={() => setForm({...form, scope: opt.id, selectedTargets: [], localId: "", chainId: "", selectedZone: ""})}
                    className={`p-4 rounded-[1.8rem] flex flex-col items-center gap-2 border-2 transition-all duration-300 ${form.scope === opt.id ? 'border-[#87be00] bg-[#87be00]/5 text-gray-900 shadow-sm' : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                 >
                    <div>{opt.icon}</div>
                    <span className="text-[9px] font-black uppercase tracking-tighter italic">{opt.label}</span>
                 </button>
               ))}
            </div>

            {form.scope === 'ZONA' && (
              <select className="w-full p-4 bg-gray-50 rounded-2xl text-[10px] font-black uppercase outline-none border-2 border-transparent focus:border-[#87be00]/30 transition-all animate-in slide-in-from-right-4"
                value={form.selectedZone} onChange={(e) => setForm({...form, selectedZone: e.target.value})}>
                <option value="">Seleccionar Zona</option>
                <option value="Metropolitana">Región Metropolitana</option>
                <option value="Norte">Zona Norte</option>
                <option value="Sur">Zona Sur</option>
              </select>
            )}
          </div>

          <div className="bg-white p-7 rounded-[3rem] border border-gray-100 shadow-sm space-y-5">
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest text-center italic">Prioridad del Sistema</p>
            <div className="flex bg-gray-50 p-2 rounded-[1.5rem] gap-2">
              {['OPERATIVA', 'URGENTE'].map(t => (
                <button key={t} type="button" onClick={() => setForm({...form, type: t})}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 ${form.type === t ? 'bg-gray-900 text-[#87be00] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                  {t === 'URGENTE' ? <FiAlertTriangle size={14} className="text-red-500" /> : <FiInfo size={14} />} 
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AlertManager;