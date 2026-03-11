import { useEffect, useState } from "react"
import api from "../../api/apiClient"

const UserForm = ({ userId = null }) => { // userId opcional para edición
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "USUARIO",
    rut: "",
    foto_url: "",
    position: "",
    fecha_contrato: "",
    supervisor_nombre: "",
    supervisor_telefono: ""
  })
  const [loading, setLoading] = useState(false)

  /* =========================
     CAMBIO DE VALORES
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  /* =========================
     SUBMIT AL BACKEND
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (userId) {
        await api.put(`/api/users/${userId}`, formData)
        alert("Usuario actualizado con éxito")
      } else {
        await api.post("/api/users", formData)
        alert("Usuario creado con éxito")
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow font-[Outfit]">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        {userId ? "Editar Colaborador" : "Registro de Nuevo Colaborador"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECCIÓN 1: DATOS PERSONALES */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Nombres</label>
              <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Apellidos</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">RUT</label>
              <input type="text" name="rut" placeholder="12.345.678-k" value={formData.rut} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Cargo / Posición</label>
              <input type="text" name="position" value={formData.position} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: CREDENCIALES DE ACCESO */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Cuenta y Acceso</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Email Corporativo</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            {!userId && (
              <div>
                <label className="block text-xs font-medium mb-1">Contraseña Temporal</label>
                <input type="password" name="password" required={!userId} value={formData.password} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1">URL Foto de Perfil</label>
              <input type="text" name="foto_url" placeholder="https://..." value={formData.foto_url} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Fecha Contrato</label>
              <input type="date" name="fecha_contrato" value={formData.fecha_contrato} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: SUPERVISOR */}
        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#87be00]">
          <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Información del Supervisor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Nombre Supervisor</label>
              <input type="text" name="supervisor_nombre" value={formData.supervisor_nombre} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Teléfono Supervisor</label>
              <input type="text" name="supervisor_telefono" value={formData.supervisor_telefono} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#87be00] text-white py-3 rounded-lg font-bold hover:bg-[#76a500] transition-colors"
        >
          {loading ? "Procesando..." : userId ? "Actualizar Colaborador" : "Crear Colaborador"}
        </button>

      </form>
    </div>
  )
}

export default UserForm