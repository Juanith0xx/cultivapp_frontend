import { useState, useEffect } from "react"
import { FiPlus, FiTrash2, FiEdit2, FiKey, FiUsers, FiUserCheck, FiUserX, FiBriefcase, FiMail, FiShield } from "react-icons/fi"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-hot-toast"

import CreateUserModal from "../../components/CreateUserModal"
import EditUserContactModal from "../../components/EditUserContactModal"
import ResetPasswordModal from "../../components/ResetPasswordModal"

const API_URL = import.meta.env.VITE_API_URL

const UsersByRole = ({ role = null, title, buttonLabel }) => {
  const { user: loggedUser } = useAuth()
  const [openModal, setOpenModal] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedUser, setSelectedUser] = useState(null)
  const [openEdit, setOpenEdit] = useState(false)
  const [openReset, setOpenReset] = useState(false)

  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState("")

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/api/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCompanies(data)
    } catch (error) { console.error(error) }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      let url = `${API_URL}/api/users`
      const params = []
      if (role) params.push(`role=${role}`)
      if (selectedCompany) params.push(`company_id=${selectedCompany}`)
      if (params.length) url += `?${params.join("&")}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setUsers(data)
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [role, selectedCompany])
  useEffect(() => { if (loggedUser?.role === "ROOT") fetchCompanies() }, [])

  const canDeleteUser = (targetUser) => {
    if (!loggedUser) return false
    if (targetUser.role === "ROOT") return false
    if (loggedUser.id === targetUser.id) return false
    if (loggedUser.role === "ROOT") return true
    if (loggedUser.role === "ADMIN_CLIENTE") {
      return targetUser.company_id === loggedUser.company_id && targetUser.role !== "ADMIN_CLIENTE"
    }
    return false
  }

  const toggleUser = async (id) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_URL}/api/users/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Estado actualizado")
      fetchUsers()
    } catch (error) { console.error(error) }
  }

  const deleteUser = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success("Usuario eliminado")
        fetchUsers()
      }
    } catch (error) { console.error(error) }
  }

  const stats = {
    total: users.length,
    activos: users.filter(u => u.is_active).length,
    inactivos: users.filter(u => !u.is_active).length
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-[Outfit]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">
            {title}
          </h2>
          <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.3em] mt-2">
            Gestión de equipo y permisos
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 bg-[#87be00] hover:bg-[#76a500] text-white px-6 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-[#87be00]/20"
        >
          <FiPlus size={18} />
          {buttonLabel}
        </button>
      </div>

      {/* STATS & FILTERS */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Equipo" value={stats.total} icon={<FiUsers />} />
          <StatCard label="En Terreno" value={stats.activos} icon={<FiUserCheck />} color="text-[#87be00]" />
          <StatCard label="Inactivos" value={stats.inactivos} icon={<FiUserX />} color="text-red-400" />
        </div>

        {loggedUser?.role === "ROOT" && !role && (
          <div className="lg:w-72">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-1 block">Filtrar por Empresa</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#87be00]/20 shadow-sm"
            >
              <option value="">Todas las empresas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Colaborador</th>
              {!role && <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Organización</th>}
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Estado</th>
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="5" className="p-20 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#87be00] border-t-transparent" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="p-20 text-center text-gray-400 font-bold uppercase text-xs">Sin registros</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-black text-xs uppercase group-hover:bg-[#87be00] group-hover:text-white transition-all">
                        {u.first_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800 uppercase tracking-tighter leading-none">{u.first_name}</p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-bold tracking-tight italic">
                          <FiMail size={10}/> {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {!role && (
                    <td className="p-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                            <FiBriefcase size={10}/> {u.company_name || 'Cultivapp Core'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                            <FiShield size={10}/> {u.role}
                          </span>
                        </div>
                      </div>
                    </td>
                  )}

                  <td className="p-6 text-center">
                    <button
                      onClick={() => toggleUser(u.id)}
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 ${
                        u.is_active ? "bg-[#87be00]" : "bg-gray-200"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${u.is_active ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </td>

                  <td className="p-6">
                    <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedUser(u); setOpenEdit(true); }} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => { setSelectedUser(u); setOpenReset(true); }} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-yellow-50 hover:text-yellow-600 transition-all shadow-sm">
                        <FiKey size={16} />
                      </button>
                      {canDeleteUser(u) && (
                        <button onClick={() => deleteUser(u.id)} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
      <CreateUserModal isOpen={openModal} onClose={() => setOpenModal(false)} onCreated={fetchUsers} defaultRole={role || ""} />
      {openEdit && <EditUserContactModal user={selectedUser} onClose={() => setOpenEdit(false)} onUpdated={fetchUsers} />}
      {openReset && <ResetPasswordModal user={selectedUser} onClose={() => setOpenReset(false)} />}
    </div>
  )
}

const StatCard = ({ label, value, icon, color = "text-gray-800" }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">{label}</p>
      <p className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</p>
    </div>
  </div>
)

export default UsersByRole