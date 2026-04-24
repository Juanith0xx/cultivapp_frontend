import { useState, useEffect, useMemo } from "react";
import { 
  FiSend, FiUsers, FiInfo, FiAlertTriangle, 
  FiMapPin, FiLayers, FiCheckCircle, 
  FiSearch, FiTarget, FiLoader, FiShield, FiBriefcase
} from "react-icons/fi";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const AlertManager = () => {
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [users, setUsers] = useState([]);
  const [chains, setChains] = useState([]);
  const [locales, setLocales] = useState([]);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "OPERATIVA",
    scope: "TODOS",
    chainId: "",
    localId: "",
    selectedZone: "",
    selectedTargets: [] 
  });

  // 1. CARGA INICIAL: Usuarios de la empresa y Cadenas
  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentUser?.company_id) return;
      try {
        setFetchingData(true);
        const [uRes, cRes] = await Promise.all([
          api.get(`/users?company_id=${currentUser.company_id}`),
          api.get(`/chains?company_id=${currentUser.company_id}`)
        ]);
        const userData = uRes.data || uRes || [];
        const chainData = cRes.data || cRes || [];
        setUsers(Array.isArray(userData) ? userData.filter(u => u.id !== currentUser.id && !u.deleted_at) : []);
        setChains(Array.isArray(chainData) ? chainData : []);
      } catch (error) {
        toast.error("Error al sincronizar datos");
      } finally {
        setFetchingData(false);
      }
    };
    loadInitialData();
  }, [currentUser]);

  // 🚩 MEJORA: Filtrar locales por Cadena Y por Cartera del Supervisor (Usa tabla supervisor_locales)
  useEffect(() => {
    const loadLocales = async () => {
      if (form.chainId && currentUser?.id) {
        try {
          setFetchingData(true);
          // Consultamos el endpoint específico de la cartera del supervisor
          const res = await api.get(`/locales/supervisor/${currentUser.id}`);
          const data = Array.isArray(res) ? res : res.data || [];

          // Filtramos los locales de la cartera que corresponden a la cadena seleccionada
          // Se valida tanto chain_id como el campo 'cadena' según devuelva tu SQL
          const localesFiltrados = data.filter(local => 
            String(local.chain_id || local.cadena_id) === String(form.chainId)
          );

          setLocales(localesFiltrados);
        } catch (error) {
          console.error("Error cargando locales del supervisor:", error);
          setLocales([]);
          toast.error("No se pudo cargar tu cartera de locales");
        } finally {
          setFetchingData(false);
        }
      } else {
        setLocales([]);
      }
    };
    
    loadLocales();
    setForm(prev => ({ ...prev, localId: "" }));
  }, [form.chainId, currentUser?.id]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

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
    if (form.scope === 'individual' && form.selectedTargets.length === 0) {
      return toast.error("Selecciona destinatarios");
    }
    setLoading(true);
    try {
      await api.post("/notifications/send-bulk", {
        ...form,
        company_id: currentUser.company_id,
        title: form.title || (form.type === "URGENTE" ? "ALERTA URGENTE" : "AVISO OPERATIVO"),
      });
      toast.success("Notificación emitida");
      setForm(prev => ({ ...prev, title: "", message: "", selectedTargets: [], chainId: "", localId: "", selectedZone: "" }));
    } catch (error) {
      toast.error("Error al emitir notificación");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 font-[Outfit] max-w-7xl mx-auto animate-in fade-in duration-700 pb-10">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gray-900 rounded-[1.5rem] flex items-center justify-center text-[#87be00] shadow-xl">
                <FiShield size={28} />
            </div>
            <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">Centro de Notificaciones</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#87be00] animate-pulse"></span>
                    Gestión de Instrucciones por Cartera
                </p>
            </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
            <FiBriefcase className="text-gray-400" size={14} />
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic">
                Supervisor: {currentUser?.first_name}
            </span>
        </div>
      </div>

      <form onSubmit={handleSend} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2 italic">Asunto / Referencia</label>
                <input 
                  type="text" placeholder="EJ: INSTRUCCIÓN DE REPOSICIÓN..."
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white focus:border-[#87be00]/20 transition-all shadow-inner"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2 italic">Cuerpo del Mensaje</label>
                <textarea 
                  placeholder="ESCRIBE AQUÍ LAS INSTRUCCIONES PARA TU EQUIPO..."
                  className="w-full h-48 bg-gray-50 border-2 border-transparent rounded-[2rem] p-6 text-sm font-medium outline-none focus:bg-white focus:border-[#87be00]/20 resize-none transition-all shadow-inner"
                  value={form.message}
                  onChange={(e) => setForm({...form, message: e.target.value})}
                  required
                />
              </div>
            </div>

            {form.scope === 'individual' && (
              <div className="space-y-4 pt-6 border-t border-gray-50 animate-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center px-2">
                  <p className="text-[10px] font-black text-gray-900 uppercase italic tracking-widest flex items-center gap-2">
                    <FiUsers className="text-[#87be00]" /> Seleccionados: <span className="text-[#87be00] font-black">{form.selectedTargets.length}</span>
                  </p>
                  <div className="relative w-40">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12}/>
                    <input 
                      type="text" placeholder="FILTRAR..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-[9px] font-black outline-none border border-transparent focus:border-[#87be00]/30 transition-all uppercase"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-5 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner">
                  {fetchingData ? (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center">
                        <FiLoader className="animate-spin text-[#87be00] mb-3" size={24}/>
                    </div>
                  ) : (
                    filteredUsers.map(u => {
                      const isSelected = form.selectedTargets.includes(u.id);
                      return (
                        <button
                          key={u.id} type="button" onClick={() => toggleUserSelection(u.id)}
                          className={`p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between group ${isSelected ? 'bg-white border-[#87be00] shadow-md' : 'bg-white/40 border-transparent hover:border-gray-200'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black ${isSelected ? 'bg-[#87be00] text-white' : 'bg-gray-900 text-white'}`}>
                                {u.first_name?.[0]}{u.last_name?.[0]}
                            </div>
                            <div className="min-w-0">
                                <p className={`text-[10px] font-black uppercase truncate leading-none ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{u.first_name} {u.last_name}</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-tighter italic">{u.role}</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#87be00] border-[#87be00]' : 'border-gray-200'}`}>
                            {isSelected && <FiCheckCircle className="text-white" size={12} strokeWidth={3}/>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={loading} className="w-full relative overflow-hidden group disabled:opacity-50 transition-all duration-500">
                <div className={`relative z-10 w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase italic tracking-[0.25em] transition-all duration-500 ${form.type === 'URGENTE' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-[#87be00] text-white shadow-xl shadow-[#87be00]/20 hover:bg-gray-900'}`}>
                  {loading ? <FiLoader className="animate-spin text-white" size={18} /> : <FiSend className="text-white" size={16} />}
                  <span>{loading ? "Sincronizando..." : `Emitir notificación ${form.scope === 'TODOS' ? 'global' : 'específica'}`}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              <p className="text-center text-[7px] font-black text-gray-300 uppercase tracking-[0.4em] mt-4 italic">
                Sincronización de trazabilidad en tiempo real habilitada
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
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
                 <button key={opt.id} type="button" onClick={() => setForm({...form, scope: opt.id, selectedTargets: [], chainId: "", localId: "", selectedZone: ""})}
                    className={`p-4 rounded-[1.8rem] flex flex-col items-center gap-2 border-2 transition-all duration-300 ${form.scope === opt.id ? 'border-[#87be00] bg-[#87be00]/5 text-gray-900 shadow-sm scale-105' : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                 >
                    <div className={form.scope === opt.id ? 'text-[#87be00]' : ''}>{opt.icon}</div>
                    <span className="text-[9px] font-black uppercase tracking-tighter italic">{opt.label}</span>
                 </button>
               ))}
            </div>

            {(form.scope === 'local' || form.scope === 'ZONA') && (
              <div className="space-y-3 animate-in slide-in-from-right-4 duration-500">
                {form.scope === 'local' ? (
                  <>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl text-[10px] font-black uppercase outline-none border-2 border-transparent focus:border-[#87be00]/30 transition-all"
                      value={form.chainId} onChange={(e) => setForm({...form, chainId: e.target.value})}>
                      <option value="">Seleccionar Cadena</option>
                      {chains.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl text-[10px] font-black uppercase outline-none border-2 border-transparent focus:border-[#87be00]/30 transition-all disabled:opacity-30"
                      disabled={!form.chainId} value={form.localId} onChange={(e) => setForm({...form, localId: e.target.value})}>
                      <option value="">Seleccionar Local (Mi Cartera)</option>
                      {locales.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </>
                ) : (
                  <select className="w-full p-4 bg-gray-50 rounded-2xl text-[10px] font-black uppercase outline-none border-2 border-transparent focus:border-[#87be00]/30 transition-all"
                    value={form.selectedZone} onChange={(e) => setForm({...form, selectedZone: e.target.value})}>
                    <option value="">Seleccionar Zona</option>
                    <option value="Metropolitana">RM</option>
                    <option value="Norte">Norte</option>
                    <option value="Sur">Sur</option>
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-7 rounded-[3rem] border border-gray-100 shadow-sm space-y-5">
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest text-center italic">Prioridad del Sistema</p>
            <div className="flex bg-gray-50 p-2 rounded-[1.5rem] gap-2">
              {['OPERATIVA', 'URGENTE'].map(t => (
                <button key={t} type="button" onClick={() => setForm({...form, type: t})}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 ${form.type === t ? 'bg-gray-900 text-[#87be00] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}>
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