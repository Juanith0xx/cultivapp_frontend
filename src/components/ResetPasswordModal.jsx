import { useState } from "react"
import { FiLock, FiX, FiCheckCircle, FiCopy, FiAlertCircle } from "react-icons/fi"
import api from "../api/apiClient"
import { toast } from "react-hot-toast"

const ResetPasswordModal = ({ user, onClose }) => {
  const [tempPassword, setTempPassword] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    try {
      setLoading(true)
      const data = await api.put(`/users/${user.id}/reset-password`)
      setTempPassword(data.temporaryPassword)
      toast.success("Contraseña restablecida")
    } catch (error) {
      toast.error(error.message || "Error al resetear contraseña")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword)
    toast.success("¡Copiado al portapapeles!")
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] font-[Outfit] p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#87be00]/10 rounded-2xl flex items-center justify-center text-[#87be00]">
              <FiLock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                Seguridad
              </h2>
              <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.2em] mt-1">
                Resetear Contraseña
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-8 pt-4">
          {!tempPassword ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex gap-4">
                <FiAlertCircle className="text-orange-400 shrink-0" size={20} />
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  ¿Estás seguro que deseas generar una nueva contraseña para <span className="font-black text-gray-900 italic">{user.first_name}</span>? 
                  <br />
                  <span className="text-[11px] text-gray-400 italic">La contraseña anterior dejará de funcionar inmediatamente.</span>
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-black text-[#87be00] py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#87be00]/30 border-t-[#87be00] rounded-full animate-spin" />
                  ) : (
                    "Generar Nueva Clave"
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-gray-600 transition-colors"
                >
                  Cancelar operación
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 text-green-500 rounded-full mb-4">
                  <FiCheckCircle size={32} />
                </div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">Nueva clave generada</p>
              </div>

              <div 
                onClick={copyToClipboard}
                className="group relative bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-3xl cursor-pointer hover:border-[#87be00] hover:bg-white transition-all text-center"
              >
                <span className="text-2xl font-black text-gray-900 tracking-widest font-mono">
                  {tempPassword}
                </span>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-[#87be00] transition-colors">
                  <FiCopy size={20} />
                </div>
              </div>

              <p className="text-[10px] text-center text-gray-400 font-medium leading-relaxed px-4">
                Haz clic en el código para copiar. El usuario deberá cambiar esta contraseña obligatoriamente en su próximo inicio de sesión.
              </p>

              <button
                onClick={onClose}
                className="w-full bg-[#87be00] hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-[#87be00]/20"
              >
                Entendido, cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordModal