import { useEffect, useState } from "react"
import { FiX, FiBriefcase, FiUser, FiBarChart2, FiLock, FiPlus, FiSave } from "react-icons/fi"
import api from "../api/apiClient"
import { toast } from "react-hot-toast"

const CreateCompanyModal = ({ isOpen, onClose, onCreated, editingCompany }) => {
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

  // 🔄 Efecto para cargar datos si estamos editando
  useEffect(() => {
    if (editingCompany) {
      setForm({
        ...initialState,
        ...editingCompany,
        // Visualmente ocultamos la contraseña en edición
        admin_password: "••••••••" 
      })
    } else {
      setForm(initialState)
    }
  }, [editingCompany, isOpen])

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
    
    // Si no estamos editando, validamos el RUT (en edición está bloqueado)
    if (!editingCompany && !validateRut(form.rut)) {
      return toast.error("El RUT ingresado no es válido")
    }

    setLoading(true)
    try {
      // 📦 Payload base con parseo numérico
      const payload = {
        ...form,
        rut: cleanRut(form.rut),
        max_supervisors: parseInt(form.max_supervisors) || 0,
        max_users: parseInt(form.max_users) || 0,
        max_view: parseInt(form.max_view) || 0
      }

      if (editingCompany) {
        // ✨ ACTUALIZACIÓN (PATCH): Solo enviamos los campos del plan
        const planPayload = {
          max_supervisors: payload.max_supervisors,
          max_users: payload.max_users,
          max_view: payload.max_view
        }
        await api.patch(`/companies/${editingCompany.id}`, planPayload)
        toast.success("Plan de suscripción actualizado")
      } else {
        // 🚀 CREACIÓN (POST): Flujo normal completo
        await api.post("/companies/with-admin", payload)
        toast.success("Empresa y administrador creados")
      }

      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.message || "Error al procesar la solicitud")
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

  const InputStyle = "w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 transition-all placeholder:text-gray-300 shadow-sm disabled:text-gray-300 disabled:cursor-not-allowed"

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] font-[Outfit]">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
              {editingCompany ? "Editar Plan Contratado" : "Nueva Empresa"}
            </h3>
            <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.3em] mt-2">
              {editingCompany ? `Empresa: ${editingCompany.name}` : "Configuración de Cliente Root"}
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
          
          {/* SECCIÓN 1: DATOS EMPRESA (Bloqueada en edición) */}
          <div className={`space-y-4 ${editingCompany ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2 mb-2 px-2">
              <FiBriefcase className="text-[#87be00]" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                Información Legal {editingCompany && <FiLock size={12} />}
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>RUT Empresa</Label>
                <input name="rut" value={form.rut} disabled={!!editingCompany} placeholder="76.123.456-7" required className={InputStyle} />
              </div>
              <div>
                <Label>Nombre de Fantasía</Label>
                <input name="name" value={form.name} disabled={!!editingCompany} placeholder="Empresa SPA" required className={InputStyle} />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: LÍMITES (SIEMPRE EDITABLE) */}
          <div className="bg-[#87be00]/5 p-8 rounded-[2.5rem] border-2 border-[#87be00]/10 shadow-inner">
            <div className="flex items-center gap-2 mb-6">
              <FiBarChart2 className="text-[#87be00]" />
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest italic">Configuración de Cuotas</h4>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                <Label>Supervisores</Label>
                <input type="number" name="max_supervisors" value={form.max_supervisors} onChange={handleChange} className="w-full text-center text-xl font-black text-gray-900 outline-none bg-transparent" />
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                <Label>Mercaderistas</Label>
                <input type="number" name="max_users" value={form.max_users} onChange={handleChange} className="w-full text-center text-xl font-black text-gray-900 outline-none bg-transparent" />
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                <Label>Solo Vista</Label>
                <input type="number" name="max_view" value={form.max_view} onChange={handleChange} className="w-full text-center text-xl font-black text-gray-900 outline-none bg-transparent" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ADMINISTRADOR (Oculta en edición de plan) */}
          {!editingCompany && (
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
          )}

          {/* Footer / Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-[#87be00] py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#87be00]/30 border-t-[#87be00] rounded-full animate-spin" />
              ) : (
                editingCompany ? <><FiSave size={18} /> Actualizar Suscripción</> : <><FiPlus size={18} /> Crear Empresa y Admin</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCompanyModal;