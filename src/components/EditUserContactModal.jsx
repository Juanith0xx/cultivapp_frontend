import { useState } from "react"
import { FiX, FiMail, FiPhone, FiSave, FiUser } from "react-icons/fi"
import api from "../api/apiClient"
import { toast } from "react-hot-toast"

const EditUserContactModal = ({ user, onClose, onUpdated }) => {
  const [email, setEmail] = useState(user.email || "")
  const [phone, setPhone] = useState(user.phone || "")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    try {
      setLoading(true)
      // Ajuste de ruta según tu apiClient: quitamos el /api inicial si el cliente ya lo tiene
      await api.put(`/users/${user.id}/update-contact`, { email, phone })
      
      toast.success("Información de contacto actualizada")
      onUpdated()
      onClose()
    } catch (error) {
      toast.error(error.message || "Error al actualizar")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const Label = ({ children }) => (
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1 block">
      {children}
    </label>
  )

  const InputWrapper = ({ icon: Icon, children }) => (
    <div className="relative flex items-center group">
      <div className="absolute left-5 text-gray-300 group-focus-within:text-[#87be00] transition-colors">
        <Icon size={18} />
      </div>
      {children}
    </div>
  )

  const inputClass = "w-full bg-gray-50 border-none rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#87be00]/20 transition-all placeholder:text-gray-300 shadow-sm"

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] font-[Outfit]">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="p-10 pb-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#87be00]/10 rounded-2xl flex items-center justify-center text-[#87be00]">
              <FiUser size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                Editar Perfil
              </h2>
              <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.2em] mt-1">
                Información de contacto
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <div className="px-10 pb-4 space-y-6">
          <p className="text-xs text-gray-400 italic px-2">
            Actualizando datos para: <span className="text-gray-900 font-bold">{user.first_name} {user.last_name || ""}</span>
          </p>

          <div className="space-y-4">
            <div>
              <Label>Correo Electrónico</Label>
              <InputWrapper icon={FiMail}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.cl"
                  className={inputClass}
                />
              </InputWrapper>
            </div>

            <div>
              <Label>Teléfono / Móvil</Label>
              <InputWrapper icon={FiPhone}>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className={inputClass}
                />
              </InputWrapper>
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="p-10 pt-6">
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-[#87be00] py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#87be00]/30 border-t-[#87be00] rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave size={18} />
                  Guardar Cambios
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-gray-600 transition-colors"
            >
              Descartar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUserContactModal