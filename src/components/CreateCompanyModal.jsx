import { useState } from "react"
import { FiX, FiBriefcase, FiUser, FiBarChart2, FiLock, FiPlus } from "react-icons/fi"
import api from "../api/apiClient"
import { toast } from "react-hot-toast"

const CreateCompanyModal = ({ isOpen, onClose, onCreated }) => {
  const initialState = {
    rut: "",
    name: "",
    address: "",
    max_supervisors: 2,
    max_users: 10,
    max_view: 1,
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    admin_position: "",
    admin_password: ""
  }

  const [form, setForm] = useState(initialState)
  const [loading, setLoading] = useState(false)

  // Funciones de RUT (se mantienen igual para la lógica, pero aplicamos limpieza)
  const cleanRut = (rut) => rut.replace(/\./g, "").replace("-", "").toUpperCase()
  
  const formatRut = (rut) => {
    const clean = cleanRut(rut)
    if (clean.length <= 1) return clean
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1)
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    return `${formattedBody}-${dv}`
  }

  const validateRut = (rut) => {
    const clean = cleanRut(rut)
    if (clean.length < 8) return false
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1)
    let sum = 0, multiplier = 2
    for (let i = body.length - 1; i >= 0; i--) {
      sum += multiplier * parseInt(body[i])
      multiplier = multiplier === 7 ? 2 : multiplier + 1
    }
    const expected = 11 - (sum % 11)
    const dvCalc = expected === 11 ? "0" : expected === 10 ? "K" : expected.toString()
    return dvCalc === dv
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === "rut" ? formatRut(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateRut(form.rut)) return toast.error("El RUT ingresado no es válido")

    setLoading(true)
    try {
      const payload = {
        ...form,
        rut: cleanRut(form.rut),
        max_supervisors: parseInt(form.max_supervisors) || 0,
        max_users: parseInt(form.max_users) || 0,
        max_view: parseInt(form.max_view) || 0
      }
      await api.post("/companies/with-admin", payload)
      toast.success("Empresa y administrador creados")
      setForm(initialState)
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const Label = ({ children }) => (
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1 block">
      {children}
    </label>
  )

  const InputStyle = "w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 transition-all placeholder:text-gray-300 shadow-sm"

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] font-[Outfit]">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
              Nueva Empresa
            </h3>
            <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.3em] mt-2">
              Configuración de Cliente Root
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECCIÓN 1: DATOS EMPRESA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 px-2">
              <FiBriefcase className="text-[#87be00]" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Información Legal</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>RUT Empresa</Label>
                <input name="rut" value={form.rut} onChange={handleChange} placeholder="76.123.456-7" required className={InputStyle} />
              </div>
              <div>
                <Label>Nombre de Fantasía</Label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Empresa SPA" required className={InputStyle} />
              </div>
            </div>
            <div>
              <Label>Dirección Casa Matriz</Label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Av. Ejemplo 123, Santiago" required className={InputStyle} />
            </div>
          </div>

          {/* SECCIÓN 2: LÍMITES */}
          <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <FiBarChart2 className="text-[#87be00]" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Límites del Plan</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Supervisores</Label>
                <input type="number" name="max_supervisors" value={form.max_supervisors} onChange={handleChange} className={InputStyle} />
              </div>
              <div>
                <Label>Mercaderistas</Label>
                <input type="number" name="max_users" value={form.max_users} onChange={handleChange} className={InputStyle} />
              </div>
              <div>
                <Label>Solo Vista</Label>
                <input type="number" name="max_view" value={form.max_view} onChange={handleChange} className={InputStyle} />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ADMINISTRADOR */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 px-2">
              <FiUser className="text-[#87be00]" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Administrador de Cliente</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo</Label>
                <input name="admin_name" value={form.admin_name} onChange={handleChange} placeholder="Juan Pérez" required className={InputStyle} />
              </div>
              <div>
                <Label>Cargo / Posición</Label>
                <input name="admin_position" value={form.admin_position} onChange={handleChange} placeholder="Gerente de Operaciones" className={InputStyle} />
              </div>
              <div>
                <Label>Email Corporativo</Label>
                <input name="admin_email" value={form.admin_email} onChange={handleChange} placeholder="admin@empresa.cl" required className={InputStyle} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <input name="admin_phone" value={form.admin_phone} onChange={handleChange} placeholder="+56 9..." className={InputStyle} />
              </div>
            </div>
            <div>
              <Label>Contraseña de Acceso</Label>
              <div className="relative">
                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  type="password" name="admin_password" value={form.admin_password} 
                  onChange={handleChange} placeholder="••••••••" required className={`${InputStyle} pl-12`} 
                />
              </div>
            </div>
          </div>

          {/* Footer / Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#87be00] hover:bg-[#76a500] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#87be00]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><FiPlus size={18} /> Crear Empresa y Admin</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCompanyModal