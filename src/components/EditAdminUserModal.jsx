import { useState, useEffect } from "react"
import { FiX, FiCamera, FiUploadCloud, FiFileText, FiCheck, FiSave } from "react-icons/fi"
import api from "../api/apiClient"

const EditAdminUserModal = ({ isOpen, onClose, onUpdated, user, stats }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    rut: "",
    position: "",
    fecha_contrato: "",
    tipo_contrato: "",
    supervisor_nombre: "",
    supervisor_telefono: "",
  })

  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [documentoAchs, setDocumentoAchs] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        role: user.role || "",
        rut: user.rut || "",
        position: user.position || "",
        fecha_contrato: user.fecha_contrato ? user.fecha_contrato.split('T')[0] : "",
        tipo_contrato: user.tipo_contrato || "Plazo Fijo",
        supervisor_nombre: user.supervisor_nombre || "",
        supervisor_telefono: user.supervisor_telefono || "",
      })
      setPreview(user.foto_url)
      setFoto(null)
      setDocumentoAchs(null)
    }
  }, [user])

  if (!isOpen || !user) return null

  const isRoleFull = (role) => {
    if (!stats) return false
    const counts = stats.counts || {}
    const limits = stats.limits || {}
    if (role === user.role) return false

    if (role === "SUPERVISOR") return counts.SUPERVISOR >= limits.max_supervisors
    if (role === "USUARIO") return counts.USUARIO >= limits.max_users
    if (role === "VIEW") return counts.VIEW >= limits.max_view
    return false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      
      // 1. Campos básicos del formulario
      Object.keys(form).forEach(key => formData.append(key, form[key]))
      
      // 🚩 2. Campo clave para la estructura de carpetas en el Backend
      // Esto permite que el middleware cree la carpeta /doc_achs/nombre_apellido/
      formData.append("user_full_name", `${form.first_name} ${form.last_name}`)

      // 3. Adjuntar archivos
      if (foto) formData.append("foto", foto)
      if (documentoAchs) formData.append("documento_achs", documentoAchs)

      await api.put(`/users/${user.id}`, formData)

      onUpdated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-[Outfit]">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Editar Colaborador</h3>
            <p className="text-[10px] text-[#87be00] font-bold uppercase tracking-widest">ID: {user.id.slice(0,8)}...</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* IZQUIERDA: Identidad y Foto */}
            <div className="space-y-4">
              <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/30">
                <div className="relative group">
                  <img 
                    src={preview || "https://via.placeholder.com/150"} 
                    className="w-28 h-28 rounded-[2rem] object-cover border-4 border-white shadow-lg transition-transform group-hover:scale-105" 
                  />
                  <label className="absolute bottom-0 right-0 bg-[#87be00] p-2 rounded-xl text-white shadow-lg cursor-pointer hover:scale-110 transition">
                    <FiCamera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0]
                      if(file){ 
                        setFoto(file)
                        setPreview(URL.createObjectURL(file))
                      }
                    }} />
                  </label>
                </div>
                <p className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-tighter">Imagen de Perfil</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nombre y RUT</label>
                <input type="text" value={form.first_name} placeholder="Nombres" required className="w-full border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[#87be00]/20 outline-none transition"
                  onChange={e => setForm({...form, first_name: e.target.value})} />
                <input type="text" value={form.last_name} placeholder="Apellidos" required className="w-full border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[#87be00]/20 outline-none transition"
                  onChange={e => setForm({...form, last_name: e.target.value})} />
                <input type="text" value={form.rut} placeholder="RUT" required className="w-full border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-sm font-bold"
                  onChange={e => setForm({...form, rut: e.target.value})} />
              </div>
            </div>

            {/* DERECHA: Contrato y Archivos */}
            <div className="space-y-4">
              <div className="bg-[#87be00]/5 p-5 rounded-[2rem] border border-[#87be00]/10 space-y-3">
                <label className="text-[10px] font-black text-[#87be00] uppercase tracking-widest">Gestión de Contrato</label>
                <input type="text" value={form.position} placeholder="Cargo" className="w-full border-white bg-white rounded-xl px-4 py-2 text-sm shadow-sm"
                  onChange={e => setForm({...form, position: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.tipo_contrato} className="bg-white border-none rounded-xl px-3 py-2 text-xs shadow-sm"
                    onChange={e => setForm({...form, tipo_contrato: e.target.value})}>
                    <option value="Indefinido">Indefinido</option>
                    <option value="Plazo Fijo">Plazo Fijo</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                  <input type="date" value={form.fecha_contrato} className="bg-white border-none rounded-xl px-3 py-2 text-xs shadow-sm font-bold"
                    onChange={e => setForm({...form, fecha_contrato: e.target.value})} />
                </div>

                {/* ADJUNTAR ACHS */}
                <div className={`mt-2 flex items-center justify-between p-3 rounded-xl border-2 border-dashed transition-colors ${documentoAchs ? 'border-[#87be00] bg-white' : 'border-gray-200 bg-gray-50/50'}`}>
                  <div className="flex items-center gap-2">
                    {documentoAchs ? <FiCheck className="text-[#87be00]" /> : <FiFileText className="text-gray-400" />}
                    <span className="text-[9px] font-bold text-gray-500 truncate max-w-[100px]">
                      {documentoAchs ? documentoAchs.name : "Nueva ACHS (PDF)"}
                    </span>
                  </div>
                  <label className="cursor-pointer bg-[#87be00] text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                    Subir
                    <input type="file" className="hidden" accept=".pdf" onChange={e => setDocumentoAchs(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Configuración de Cuenta</label>
                <input type="email" value={form.email} placeholder="Email" required className="w-full border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-sm"
                  onChange={e => setForm({...form, email: e.target.value})} />
                <select value={form.role} className="w-full border-gray-100 bg-gray-50/50 rounded-xl px-4 py-3 text-sm"
                  onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="USUARIO" disabled={isRoleFull("USUARIO")}>Usuario (Credencial)</option>
                  <option value="SUPERVISOR" disabled={isRoleFull("SUPERVISOR")}>Supervisor</option>
                  <option value="VIEW" disabled={isRoleFull("VIEW")}>Solo Vista</option>
                </select>
              </div>
            </div>
          </div>

          {/* SUPERVISOR */}
          <div className="bg-gray-900 p-6 rounded-[2rem] text-white flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
               <p className="text-[9px] font-black text-[#87be00] uppercase tracking-[0.2em] mb-2">Contacto de Emergencia</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <input type="text" value={form.supervisor_nombre} placeholder="Nombre Supervisor" className="bg-white/10 border-none rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:bg-white/20 transition"
                  onChange={e => setForm({...form, supervisor_nombre: e.target.value})} />
                 <input type="text" value={form.supervisor_telefono} placeholder="Teléfono (+56...)" className="bg-white/10 border-none rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:bg-white/20 transition"
                  onChange={e => setForm({...form, supervisor_telefono: e.target.value})} />
               </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#87be00] text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#87be00]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? "Actualizando..." : <><FiSave size={20}/> Actualizar Colaborador</>}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditAdminUserModal