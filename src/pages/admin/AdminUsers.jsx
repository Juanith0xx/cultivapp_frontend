import { useEffect, useState, useCallback, useRef } from "react"
import {
  FiUserPlus,
  FiRotateCw,
  FiEdit,
  FiTrash,
  FiActivity,
  FiUsers,
  FiEye,
  FiShield,
  FiMapPin,
  FiFileText,
  FiUploadCloud
} from "react-icons/fi"
import { toast } from "react-hot-toast"
import api from "../../api/apiClient"

import CreateAdminUserModal from "../../components/CreateAdminUserModal"
import EditAdminUserModal from "../../components/EditAdminUserModal"
import ResetPasswordAdminModal from "../../components/ResetPasswordAdminModal"
import AssignLocalesModal from "./AssignLocalesModal" 

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [assignSupervisor, setAssignSupervisor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)

  const fileInputRef = useRef(null)
  const userLocal = JSON.parse(localStorage.getItem("user"))

  const safe = (value) => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const timestamp = Date.now()
      const [usersData, statsData] = await Promise.all([
        api.get(`users?ts=${timestamp}`),
        api.get(`users/company/${userLocal.company_id}/stats?ts=${timestamp}`)
      ])
      setUsers(usersData)
      setStats(statsData)
    } catch (error) {
      console.error("FETCH ERROR:", error)
    } finally {
      setLoading(false)
    }
  }, [userLocal.company_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 🚩 FUNCIÓN PARA CARGA MASIVA DESDE EXCEL
  const handleBulkUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("excel", file)
    formData.append("company_id", userLocal.company_id)

    try {
      setBulkLoading(true)
      const res = await api.post("/users/bulk", formData)
      
      toast.success(res.message || "Carga masiva completada con éxito")
      
      if (res.errors?.length > 0) {
        console.warn("Registros fallidos:", res.errors)
        toast.error("Algunos registros fallaron. Revisa la consola.")
      }
      
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al procesar el archivo")
    } finally {
      setBulkLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = "" // Limpiar input
    }
  }

  const toggleUser = async (id) => {
    try {
      await api.patch(`users/${id}/toggle`)
      toast.success("Estado actualizado")
      fetchData()
    } catch (error) {
      toast.error("Error al cambiar estado")
    }
  }

  const deleteUser = async (targetUser) => {
    if (targetUser.role === "ADMIN_CLIENTE") return toast.error("No puedes eliminar otro Administrador")
    if (targetUser.id === userLocal.id) return toast.error("No puedes eliminarte a ti mismo")
    if (!window.confirm(`¿Eliminar permanentemente a ${targetUser.first_name}?`)) return

    try {
      await api.delete(`users/${targetUser.id}`)
      toast.success("Usuario eliminado")
      fetchData()
    } catch (error) {
      toast.error("Error al eliminar")
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-[#87be00] border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Sincronizando equipo...</p>
    </div>
  )

  if (!stats) return null

  const usedSupervisors = safe(stats.counts?.SUPERVISOR)
  const usedUsers = safe(stats.counts?.USUARIO)
  const usedView = safe(stats.counts?.VIEW)
  const maxSupervisors = safe(stats.limits?.max_supervisors)
  const maxUsers = safe(stats.limits?.max_users)
  const maxView = safe(stats.limits?.max_view)

  const totalUsed = usedSupervisors + usedUsers + usedView
  const totalMax = maxSupervisors + maxUsers + maxView
  const isCompanyFull = totalMax > 0 && totalUsed >= totalMax

  const ProgressCard = ({ title, used, max, color, icon }) => {
    const percentage = max > 0 ? (used / max) * 100 : 0
    return (
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col justify-between group hover:shadow-lg transition-all duration-500">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-gray-900 group-hover:text-[#87be00] transition-colors">{icon}</div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{title}</p>
        </div>
        <div>
          <p className="text-3xl font-black text-gray-800 tracking-tighter italic leading-none mb-4">
            {used} <span className="text-sm text-gray-200 font-bold uppercase tracking-widest not-italic">/ {max}</span>
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`${color} h-full rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-[Outfit]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
            Usuarios
          </h1>
          <p className="text-[10px] font-black text-[#87be00] uppercase tracking-[0.4em] mt-3">
            Control de accesos y licencias de empresa
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 🚩 BOTÓN CARGA MASIVA */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkLoading || isCompanyFull}
            className="flex items-center gap-3 bg-gray-900 text-[#87be00] px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-black shadow-xl shadow-gray-200 disabled:opacity-40"
          >
            {bulkLoading ? <FiRotateCw className="animate-spin" size={16} /> : <FiUploadCloud size={16} />}
            Carga Masiva
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleBulkUpload} 
          />

          <button
            onClick={() => setOpenModal(true)}
            disabled={isCompanyFull}
            className="flex items-center gap-3 bg-[#87be00] hover:bg-[#76a500] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-[#87be00]/20 disabled:opacity-40"
          >
            <FiUserPlus size={18} />
            Crear Usuario
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressCard 
            title="Supervisores" used={usedSupervisors} max={maxSupervisors} 
            color="bg-[#87be00]" icon={<FiShield size={22}/>} 
        />
        <ProgressCard 
            title="Mercaderistas" used={usedUsers} max={maxUsers} 
            color="bg-blue-600" icon={<FiUsers size={22}/>} 
        />
        <ProgressCard 
            title="Solo Vista" used={usedView} max={maxView} 
            color="bg-gray-900" icon={<FiEye size={22}/>} 
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Colaborador</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] text-center">Rol</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] text-center">Estado</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-black text-sm group-hover:bg-gray-900 group-hover:text-[#87be00] transition-all">
                        {user.first_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-black text-gray-900 uppercase tracking-tighter leading-none italic">{user.first_name} {user.last_name}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-bold tracking-tight lowercase flex items-center gap-2">
                           <FiFileText className="text-[#87be00]" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-8 text-center">
                    <span className="bg-[#87be00]/10 text-[#87be00] px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic border border-[#87be00]/10">
                      {user.role}
                    </span>
                  </td>

                  <td className="p-8 text-center">
                    <button
                      onClick={() => toggleUser(user.id)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-500 shadow-inner ${
                        user.is_active ? "bg-[#87be00]" : "bg-gray-200"
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-500 ${user.is_active ? "translate-x-8" : "translate-x-1"}`} />
                    </button>
                  </td>

                  <td className="p-8">
                    <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                      
                      {user.role === 'SUPERVISOR' && (
                        <button 
                          onClick={() => setAssignSupervisor(user)}
                          className="p-3 bg-gray-50 text-[#87be00] rounded-2xl hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                          title="Asignar Cobertura"
                        >
                          <FiMapPin size={18} />
                        </button>
                      )}

                      <button 
                        onClick={() => setEditUser(user)}
                        className="p-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-gray-900 hover:text-[#87be00] transition-all shadow-sm"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button 
                        onClick={() => setResetUser(user)}
                        className="p-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-gray-900 hover:text-yellow-400 transition-all shadow-sm"
                      >
                        <FiRotateCw size={18} />
                      </button>
                      {user.role !== "ADMIN_CLIENTE" && user.id !== userLocal.id && (
                        <button 
                          onClick={() => deleteUser(user)}
                          className="p-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <FiTrash size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateAdminUserModal isOpen={openModal} onClose={() => setOpenModal(false)} onCreated={fetchData} />
      <EditAdminUserModal isOpen={!!editUser} user={editUser} stats={stats} onClose={() => setEditUser(null)} onUpdated={fetchData} />
      
      {resetUser && <ResetPasswordAdminModal user={resetUser} onClose={() => setResetUser(null)} onUpdated={fetchData} />}
      
      {assignSupervisor && (
        <AssignLocalesModal 
          supervisor={assignSupervisor} 
          onClose={() => setAssignSupervisor(null)} 
          onRefresh={fetchData}
        />
      )}
    </div>
  )
}

export default AdminUsers