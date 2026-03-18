import { useState } from "react";
import { FiUpload, FiClock, FiCalendar, FiUser, FiMapPin, FiX } from "react-icons/fi";
import * as XLSX from "xlsx";
import api from "../api/apiClient";
import toast from "react-hot-toast";

const ManageRoutesModal = ({ isOpen, onClose, users, locales, onCreated }) => {
  const [tab, setTab] = useState("manual"); 
  const [loading, setLoading] = useState(false);
  
  const [manualTask, setManualTask] = useState({
    user_id: "",
    local_id: "",
    visit_date: "",
    start_time: "09:00" 
  });

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualTask.user_id || !manualTask.local_id || !manualTask.visit_date) {
      return toast.error("Por favor completa todos los campos obligatorios");
    }

    try {
      setLoading(true);
      await api.post("/routes", { tasks: [manualTask] });
      toast.success("Ruta agendada con éxito");
      onCreated();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al agendar la ruta");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedTasks = data.map(row => ({
          user_id: row.user_id || row.USER_ID,
          local_id: row.local_id || row.LOCAL_ID,
          visit_date: row.visit_date || row.FECHA,
          start_time: row.start_time || row.HORA || "09:00"
        }));

        await api.post("/routes", { tasks: formattedTasks });
        toast.success(`${formattedTasks.length} rutas cargadas correctamente`);
        onCreated();
        onClose();
      } catch (error) {
        toast.error("Error al procesar el archivo Excel");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  if (!isOpen) return null;

  // Filtrar usuarios con rol USUARIO (case-insensitive)
  const filteredUsers = users?.filter(u => u.role?.toUpperCase() === 'USUARIO') || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-[Outfit]">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
        
        <div className="flex border-b border-gray-50 bg-gray-50/50">
          <button onClick={() => setTab("manual")} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${tab === 'manual' ? 'text-[#87be00] border-b-2 border-[#87be00] bg-white' : 'text-gray-400'}`}>Individual</button>
          <button onClick={() => setTab("massive")} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${tab === 'massive' ? 'text-[#87be00] border-b-2 border-[#87be00] bg-white' : 'text-gray-400'}`}>Masivo (Excel)</button>
        </div>

        <div className="p-10 relative">
          <button onClick={onClose} className="absolute top-4 right-6 text-gray-300 hover:text-gray-600 transition-colors"><FiX size={20} /></button>

          {tab === "manual" ? (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FiUser className="text-[#87be00]" /> Reponedor
                </label>
                <select 
                  required
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 transition-all"
                  value={manualTask.user_id}
                  onChange={(e) => setManualTask({...manualTask, user_id: e.target.value})}
                >
                  <option value="">Seleccionar Usuario...</option>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name || ""}
                      </option>
                    ))
                  ) : (
                    <option disabled>No se encontraron reponedores</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FiMapPin className="text-[#87be00]" /> Punto de Venta
                </label>
                <select 
                  required
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 transition-all"
                  value={manualTask.local_id}
                  onChange={(e) => setManualTask({...manualTask, local_id: e.target.value})}
                >
                  <option value="">Seleccionar Local...</option>
                  {locales?.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.cadena} - {l.nombre || l.direccion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <FiCalendar className="text-[#87be00]" /> Fecha
                  </label>
                  <input type="date" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20" onChange={(e) => setManualTask({...manualTask, visit_date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <FiClock className="text-[#87be00]" /> Hora
                  </label>
                  <input type="time" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20" value={manualTask.start_time} onChange={(e) => setManualTask({...manualTask, start_time: e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Sincronizando..." : "Confirmar Agendamiento"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-12 hover:border-[#87be00]/40 transition-all group relative bg-gray-50/50 cursor-pointer">
                <FiUpload size={40} className="mx-auto text-gray-300 group-hover:text-[#87be00] transition-colors" />
                <p className="mt-4 text-xs font-black text-gray-500 uppercase tracking-widest">Subir Planilla Excel</p>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
          )}
          
          <button onClick={onClose} className="w-full text-center mt-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] hover:text-red-400 transition-colors">Cancelar operación</button>
        </div>
      </div>
    </div>
  );
};

export default ManageRoutesModal;