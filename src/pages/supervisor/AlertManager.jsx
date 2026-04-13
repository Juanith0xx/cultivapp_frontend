import { useState, useEffect, useMemo } from "react";
import { 
  FiSend, FiUsers, FiInfo, FiAlertTriangle, 
  FiMapPin, FiLayers, FiCheckCircle, 
  FiSearch, FiTarget, FiLoader 
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

  // 1. CARGA DE DATOS AUTOMÁTICA POR EMPRESA DEL SUPERVISOR
  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentUser?.company_id) return;

      try {
        setFetchingData(true);
        // Traemos usuarios y cadenas de la empresa del supervisor directamente
        const [uRes, cRes] = await Promise.all([
          api.get(`/users?company_id=${currentUser.company_id}`),
          api.get(`/chains?company_id=${currentUser.company_id}`)
        ]);
        
        const userData = uRes.data || uRes || [];
        const chainData = cRes.data || cRes || [];

        // Filtramos para no enviarnos mensajes a nosotros mismos
        setUsers(Array.isArray(userData) ? userData.filter(u => u.id !== currentUser.id && !u.deleted_at) : []);
        setChains(Array.isArray(chainData) ? chainData : []);
      } catch (error) {
        console.error("❌ Error cargando datos:", error);
        toast.error("Error al sincronizar datos del equipo");
      } finally {
        setFetchingData(false);
      }
    };

    loadInitialData();
  }, [currentUser]);

  // 2. CARGA DE LOCALES CUANDO SE ELIGE UNA CADENA
  useEffect(() => {
    if (form.chainId) {
      api.get(`/locales?chain_id=${form.chainId}`).then(res => {
        setLocales(res.data || res || []);
      });
    } else {
      setLocales([]);
    }
    setForm(prev => ({ ...prev, localId: "" }));
  }, [form.chainId]);

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
      return toast.error("Selecciona al menos un destinatario");
    }

    setLoading(true);
    try {
      await api.post("/notifications/bulk", {
        type: form.type,
        scope: form.scope,
        title: form.title || (form.type === "URGENTE" ? "ALERTA URGENTE" : "AVISO OPERATIVO"),
        message: form.message,
        targetIds: form.selectedTargets,
        localId: form.localId,
        zone: form.selectedZone,
        company_id: currentUser.company_id
      });
      
      toast.success("Instrucción enviada con éxito");
      setForm(prev => ({ ...prev, title: "", message: "", selectedTargets: [], chainId: "", localId: "", selectedZone: "" }));
    } catch (error) {
      toast.error("Error al emitir alerta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-[Outfit]">
      <div className="bg-gray-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#87be00]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <h2 className="text-2xl font-black uppercase italic mb-1 tracking-tighter text-[#87be00]">Centro de Mensajería</h2>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] italic">Emisión de instrucciones a terreno</p>
      </div>

      <form onSubmit={handleSend} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
            
            <div className="space-y-4">
              <input 
                type="text" placeholder="TÍTULO / ASUNTO..."
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-[#87be00]/20"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
              />
              <textarea 
                placeholder="ESCRIBE AQUÍ LA INSTRUCCIÓN PARA EL PERSONAL..."
                className="w-full h-44 bg-gray-50 rounded-[2.5rem] p-6 text-sm font-medium outline-none focus:ring-2 focus:ring-[#87be00]/20 resize-none"
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                required
              />
            </div>

            {/* LISTADO DE USUARIOS */}
            {form.scope === 'individual' && (
              <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in duration-500">
                <div className="flex justify-between items-center px-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">
                    Seleccionar Personal ({form.selectedTargets.length})
                  </p>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12}/>
                    <input 
                      type="text" placeholder="BUSCAR..."
                      className="pl-8 pr-4 py-2 bg-gray-50 rounded-xl text-[9px] font-black outline-none border border-gray-100 focus:border-[#87be00]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-4 bg-gray-50 rounded-[2rem] custom-scrollbar border border-gray-100">
                  {fetchingData ? (
                    <div className="col-span-full py-12 flex justify-center"><FiLoader className="animate-spin text-[#87be00]" size={24}/></div>
                  ) : (
                    filteredUsers.map(u => {
                      const isSelected = form.selectedTargets.includes(u.id);
                      return (
                        <button
                          key={u.id} type="button"
                          onClick={() => toggleUserSelection(u.id)}
                          className={`p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between group ${
                            isSelected ? 'bg-white border-[#87be00] shadow-md scale-[1.02]' : 'bg-white/50 border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className={`text-[11px] font-black uppercase truncate ${isSelected ? 'text-[#87be00]' : 'text-gray-700'}`}>
                              {u.first_name} {u.last_name}
                            </p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase italic">{u.role}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#87be00] border-[#87be00]' : 'border-gray-200'}`}>
                            {isSelected && <FiCheckCircle className="text-white" size={12}/>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className="w-full bg-[#87be00] text-white py-5 rounded-[1.8rem] font-black uppercase italic tracking-[0.2em] shadow-lg shadow-[#87be00]/30 hover:bg-gray-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <FiLoader className="animate-spin" /> : <FiSend />}
              {loading ? "PROCESANDO..." : `ENVIAR A ${form.scope === 'TODOS' ? 'TODA LA EMPRESA' : `${form.selectedTargets.length} SELECCIONADOS`}`}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* ALCANCE */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block italic text-center underline decoration-[#87be00] decoration-2 underline-offset-4 tracking-widest">Configurar Alcance</label>
            
            <div className="grid grid-cols-2 gap-2">
               {[
                 { id: 'TODOS', label: 'Empresa', icon: <FiLayers/> },
                 { id: 'individual', label: 'Personal', icon: <FiUsers/> },
                 { id: 'local', label: 'Punto Venta', icon: <FiMapPin/> },
                 { id: 'ZONA', label: 'Por Zona', icon: <FiTarget/> }
               ].map(opt => (
                 <button
                    key={opt.id} type="button"
                    onClick={() => setForm({...form, scope: opt.id, selectedTargets: [], chainId: "", localId: "", selectedZone: ""})}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-2 border transition-all ${form.scope === opt.id ? 'border-[#87be00] bg-[#87be00]/5 text-gray-900 shadow-sm' : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                 >
                    <div className={form.scope === opt.id ? 'text-[#87be00]' : ''}>{opt.icon}</div>
                    <span className="text-[9px] font-black uppercase tracking-tighter">{opt.label}</span>
                 </button>
               ))}
            </div>

            {/* SELECTORES DINÁMICOS SEGÚN ALCANCE */}
            {form.scope === 'local' && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <select 
                  className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase outline-none border-none focus:ring-2 focus:ring-[#87be00]/20"
                  value={form.chainId}
                  onChange={(e) => setForm({...form, chainId: e.target.value})}
                >
                  <option value="">Seleccionar Cadena</option>
                  {chains.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select 
                  className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase outline-none border-none focus:ring-2 focus:ring-[#87be00]/20 disabled:opacity-30"
                  disabled={!form.chainId}
                  value={form.localId}
                  onChange={(e) => setForm({...form, localId: e.target.value})}
                >
                  <option value="">Seleccionar Local</option>
                  {locales.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}

            {form.scope === 'ZONA' && (
              <div className="animate-in fade-in duration-300">
                <select 
                  className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase outline-none border-none focus:ring-2 focus:ring-[#87be00]/20"
                  value={form.selectedZone}
                  onChange={(e) => setForm({...form, selectedZone: e.target.value})}
                >
                  <option value="">Seleccionar Zona</option>
                  <option value="Metropolitana">Metropolitana</option>
                  <option value="Norte">Zona Norte</option>
                  <option value="Sur">Zona Sur</option>
                </select>
              </div>
            )}
          </div>

          {/* PRIORIDAD */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm">
            <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block italic">Prioridad de Alerta</label>
            <div className="flex gap-2">
              {['OPERATIVA', 'URGENTE'].map(t => (
                <button 
                  key={t} type="button"
                  onClick={() => setForm({...form, type: t})}
                  className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${form.type === t ? 'bg-gray-900 text-[#87be00]' : 'bg-gray-50 text-gray-400'}`}
                >
                  {t === 'URGENTE' ? <FiAlertTriangle size={14} /> : <FiInfo size={14} />} {t}
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