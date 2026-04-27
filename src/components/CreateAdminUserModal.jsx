import { useState, useEffect } from "react";
import { FiX, FiCamera, FiUploadCloud, FiFileText, FiCheck } from "react-icons/fi";
import api from "../api/apiClient";

const CreateAdminUserModal = ({ isOpen, onClose, onCreated }) => {
  const userAdmin = JSON.parse(localStorage.getItem("user"));

  const initialForm = {
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "",
    rut: "",
    position: "",
    fecha_contrato: "",
    tipo_contrato: "",
    supervisor_nombre: "",
    supervisor_telefono: "",
  };

  const [form, setForm] = useState(initialForm);
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [documentoAchs, setDocumentoAchs] = useState(null); // Nuevo estado para ACHS
  const [companyStats, setCompanyStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCompanyStats();
      setForm(initialForm);
      setFoto(null);
      setPreview(null);
      setDocumentoAchs(null);
      setError("");
    }
  }, [isOpen]);

  const fetchCompanyStats = async () => {
    try {
      const data = await api.get(`/api/users/company/${userAdmin.company_id}/stats`);
      setCompanyStats(data);
    } catch (err) {
      console.error("Stats Error:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Manejador para el PDF de la ACHS
  const handleAchsChange = (e) => {
    const file = e.target.files[0];
    if (file) setDocumentoAchs(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      
      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      formData.append("company_id", userAdmin.company_id);
      
      if (foto) formData.append("foto", foto);
      if (documentoAchs) formData.append("documento_achs", documentoAchs); // Enviamos el PDF

      await api.post("/users", formData);

      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold">Crear Colaborador</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><FiX size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs border border-red-100">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {/* SECCIÓN FOTO */}
              <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50">
                {preview ? (
                  <img src={preview} className="w-24 h-24 rounded-2xl object-cover mb-2 border-2 border-[#87be00]" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gray-200 flex items-center justify-center mb-2"><FiCamera size={30} className="text-gray-400"/></div>
                )}
                <label className="cursor-pointer text-[10px] font-bold text-[#87be00] uppercase tracking-wider">
                  <FiUploadCloud className="inline mr-1"/> Subir Foto
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>

              {/* SECCIÓN ADJUNTAR ACHS */}
              <div className={`flex items-center gap-3 p-4 border-2 rounded-2xl transition-all ${documentoAchs ? 'border-[#87be00] bg-green-50' : 'border-gray-100 bg-white'}`}>
                <div className={`${documentoAchs ? 'text-[#87be00]' : 'text-gray-400'}`}>
                  {documentoAchs ? <FiCheck size={24}/> : <FiFileText size={24}/>}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Documentos</p>
                  <p className="text-[11px] font-bold text-gray-700 truncate">
                    {documentoAchs ? documentoAchs.name : "Sin archivo seleccionado"}
                  </p>
                </div>
                <label className="cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50">
                  {documentoAchs ? "Cambiar" : "Adjuntar PDF"}
                  <input type="file" className="hidden" accept=".pdf" onChange={handleAchsChange} />
                </label>
              </div>

              <input type="text" placeholder="Nombres" required className="w-full border rounded-xl px-4 py-2 text-sm"
                onChange={e => setForm({...form, first_name: e.target.value})} />
              <input type="text" placeholder="Apellidos" required className="w-full border rounded-xl px-4 py-2 text-sm"
                onChange={e => setForm({...form, last_name: e.target.value})} />
              <input type="text" placeholder="RUT" required className="w-full border rounded-xl px-4 py-2 text-sm"
                onChange={e => setForm({...form, rut: e.target.value})} />
            </div>

            <div className="space-y-4">
              <input type="text" placeholder="Cargo (ej: Mercaderista)" required className="w-full border rounded-xl px-4 py-2 text-sm"
                onChange={e => setForm({...form, position: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-2">
                <select required className="border rounded-xl px-2 py-2 text-xs bg-white"
                  onChange={e => setForm({...form, tipo_contrato: e.target.value})}>
                  <option value="">Tipo Contrato</option>
                  <option value="Indefinido">Indefinido</option>
                  <option value="Plazo Fijo">Plazo Fijo</option>
                  <option value="Part-Time">Part-Time</option>
                </select>
                <input type="date" className="border rounded-xl px-2 py-2 text-xs"
                  onChange={e => setForm({...form, fecha_contrato: e.target.value})} />
              </div>

              <input type="email" placeholder="Email" required className="w-full border rounded-xl px-4 py-2 text-sm"
                onChange={e => setForm({...form, email: e.target.value})} />
              <input type="password" placeholder="Contraseña" required className="w-full border rounded-xl px-4 py-2 text-sm"
                onChange={e => setForm({...form, password: e.target.value})} />
              
              <select required className="w-full border rounded-xl px-4 py-2 text-sm bg-white"
                onChange={e => setForm({...form, role: e.target.value})}>
                <option value="">Perfil de Sistema</option>
                <option value="USUARIO">Usuario</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 grid grid-cols-2 gap-4">
             <input type="text" placeholder="Nombre Supervisor" className="w-full border rounded-xl px-4 py-2 text-sm bg-white"
                onChange={e => setForm({...form, supervisor_nombre: e.target.value})} />
             <input type="text" placeholder="Teléfono Supervisor" className="w-full border rounded-xl px-4 py-2 text-sm bg-white"
                onChange={e => setForm({...form, supervisor_telefono: e.target.value})} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#87be00] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#87be00]/20 transition-all active:scale-[0.98]">
            {loading ? "Registrando..." : "Generar Colaborador"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminUserModal;