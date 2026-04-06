import { useState, useEffect } from "react";
import api from "../../api/apiClient";
import { toast } from "react-hot-toast";
import { Send, Users, Store, Globe, Loader2, X, CheckCircle2, Mail, UserCircle } from "lucide-react";

const NotificationManager = () => {
  const [companies, setCompanies] = useState([]);
  const [chains, setChains] = useState([]);
  const [locales, setLocales] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    scope: "global",
    companyId: "",
    chainId: "",
    localId: "",
    selectedTargets: [] 
  });

  useEffect(() => {
    api.get("/companies").then(res => setCompanies(res || []));
  }, []);

  useEffect(() => {
    if (form.companyId) {
      setFetchingData(true);
      api.get(`/chains?company_id=${form.companyId}`).then(res => setChains(res || []));
      api.get(`/users?company_id=${form.companyId}`).then(res => {
        setUsers(res || []);
        setFetchingData(false);
      });
    }
    setForm(prev => ({ ...prev, chainId: "", localId: "", selectedTargets: [] }));
  }, [form.companyId]);

  useEffect(() => {
    if (form.chainId) {
      api.get(`/locales?chain_id=${form.chainId}`).then(res => setLocales(res || []));
    }
    setForm(prev => ({ ...prev, localId: "", selectedTargets: [] }));
  }, [form.chainId]);

  useEffect(() => {
    if (form.scope === 'local' && form.localId) {
      setFetchingData(true);
      api.get(`/users?local_id=${form.localId}`).then(res => {
        setUsers(res || []);
        setFetchingData(false);
      });
    }
  }, [form.localId, form.scope]);

  const toggleUserSelection = (userId) => {
    setForm(prev => {
      const isSelected = prev.selectedTargets.includes(userId);
      return {
        ...prev,
        selectedTargets: isSelected 
          ? prev.selectedTargets.filter(id => id !== userId)
          : [...prev.selectedTargets, userId]
      };
    });
  };

  // 🛡️ EXTRACCIÓN BASADA EN TU ESQUEMA POSTGRES
  const getUserInfo = (u) => {
    if (!u) return { name: "Desconocido", email: "-", role: "-" };

    // Concatenamos first_name y last_name según tu tabla
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || "Sin nombre";
    const email = u.email || "No registra";
    const role = u.role || "Personal";

    return { name, email, role };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.scope !== 'global' && form.selectedTargets.length === 0) {
      return toast.error("Selecciona al menos un destinatario");
    }

    setLoading(true);
    try {
      await api.post("/notifications/send-bulk", {
        title: form.title,
        message: form.message,
        scope: form.scope,
        companyId: form.companyId,
        targetIds: form.selectedTargets, 
        localId: form.localId || null
      });
      
      toast.success("¡Alertas enviadas con éxito en Cultivapp!");
      setForm(prev => ({ ...prev, title: "", message: "", selectedTargets: [] }));
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-[Outfit]">
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-gray-200/50 border border-gray-100">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Generador de Alertas</h2>
          <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.3em]">Gestión de Personal Cultivapp</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* CLIENTE Y ALCANCE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-6 rounded-[2.5rem]">
            <div className="md:col-span-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Empresa Cliente</label>
              <select 
                className="w-full bg-white border-none rounded-2xl px-5 py-4 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#87be00]/20"
                value={form.companyId}
                onChange={(e) => setForm({...form, companyId: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Alcance</label>
              <div className="flex gap-2">
                {[
                  { id: 'global', label: 'Global', icon: <Globe size={14}/> },
                  { id: 'individual', label: 'Usuarios', icon: <Users size={14}/> },
                  { id: 'local', label: 'Por Local', icon: <Store size={14}/> }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setForm({...form, scope: s.id, selectedTargets: []})}
                    className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[9px] uppercase ${
                      form.scope === s.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CASCADA RETAIL */}
          {form.scope === 'local' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 animate-in slide-in-from-top-4">
              <select 
                className="bg-gray-50 border-none rounded-2xl px-5 py-4 text-xs font-bold outline-none"
                value={form.chainId}
                onChange={(e) => setForm({...form, chainId: e.target.value})}
              >
                <option value="">Seleccione cadena...</option>
                {chains.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
              <select 
                className="bg-gray-50 border-none rounded-2xl px-5 py-4 text-xs font-bold outline-none"
                value={form.localId}
                onChange={(e) => setForm({...form, localId: e.target.value})}
                disabled={!form.chainId}
              >
                <option value="">Seleccione local...</option>
                {locales.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}

          {/* LISTADO DE PERSONAL CON FIRST_NAME Y LAST_NAME */}
          {(form.scope === 'individual' || form.scope === 'local') && (
            <div className="space-y-4">
              <div className="flex justify-between items-end px-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Personal Cultivapp</label>
                <div className="flex flex-wrap gap-2">
                  {form.selectedTargets.map(id => {
                    const u = users.find(user => user.id === id);
                    const { name } = getUserInfo(u);
                    return (
                      <span key={id} className="bg-[#87be00] text-white px-3 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 animate-in zoom-in-95">
                        {name} <X size={10} className="cursor-pointer" onClick={() => toggleUserSelection(id)}/>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                {fetchingData ? (
                  <div className="col-span-full py-12 flex justify-center"><Loader2 className="animate-spin text-[#87be00]"/></div>
                ) : (
                  users.map(u => {
                    const isSelected = form.selectedTargets.includes(u.id);
                    const { name, email, role } = getUserInfo(u);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUserSelection(u.id)}
                        className={`group p-5 rounded-[2rem] text-left transition-all border-2 flex flex-col justify-between h-36 ${
                          isSelected ? 'bg-white border-[#87be00] shadow-xl' : 'bg-white/60 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className={`text-[11px] font-black leading-tight truncate ${isSelected ? 'text-[#87be00]' : 'text-gray-800'}`}>
                            {name}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-medium text-gray-400 truncate">
                            <Mail size={10}/> {email}
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <div className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase ${isSelected ? 'bg-[#87be00] text-white' : 'bg-gray-100 text-gray-500'}`}>
                            <UserCircle size={10} className="inline mr-1"/> {role}
                          </div>
                          {isSelected && <CheckCircle2 className="text-[#87be00]" size={18}/>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* MENSAJE Y BOTÓN */}
          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-8 rounded-[2.5rem]">
            <input 
              type="text" placeholder="Título..."
              className="w-full bg-white border-none rounded-2xl px-6 py-5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              required
            />
            <textarea 
              placeholder="Mensaje de alerta..." rows="3"
              className="w-full bg-white border-none rounded-2xl px-6 py-5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 resize-none"
              value={form.message}
              onChange={(e) => setForm({...form, message: e.target.value})}
              required
            />
            <button 
              type="submit" disabled={loading}
              className="mt-4 w-full bg-[#87be00] hover:bg-[#76a500] text-white font-black uppercase text-[12px] py-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
              {loading ? "Sincronizando..." : `Enviar Alerta a ${form.selectedTargets.length || 'la Empresa'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationManager;