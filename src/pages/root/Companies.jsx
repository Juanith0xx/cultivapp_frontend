import { useEffect, useRef, useState } from "react"
import { FiPlus, FiBriefcase, FiUsers, FiEye, FiActivity, FiEdit3, FiTrash2, FiShield, FiHash } from "react-icons/fi"
import CreateCompanyModal from "../../components/CreateCompanyModal"
import { toast } from "react-hot-toast"
import api from "../../api/apiClient"
import { useAuth } from "../../context/AuthContext"
import { motion } from "framer-motion"

const Companies = () => {
  const { user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState(null)

  const ID_CULTIVA = '0e342e01-d213-4353-b210-39a12ac335cf'; 

  const isRoot = user?.role === "ROOT"
  const isCultivaAdmin = user?.role === "ADMIN_CLIENTE" && user?.company_id === ID_CULTIVA
  const hasFullAccess = isRoot || isCultivaAdmin

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const data = await api.get("/companies")
      setCompanies(data || [])
    } catch (err) {
      toast.error("No se pudieron cargar las empresas")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (company) => {
    setEditingCompany(company)
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setEditingCompany(null)
    setOpenModal(false)
  }

  const toggleCompany = async (id) => {
    if (!hasFullAccess) return toast.error("No tienes permisos para esta acción")
    try {
      await api.patch(`/companies/${id}/toggle`)
      toast.success("Estado de empresa actualizado")
      fetchCompanies()
    } catch (err) {
      toast.error("Error al cambiar estado")
    }
  }

  const handleDelete = async (company) => {
    if (!isRoot) return toast.error("Acción restringida: Solo ROOT puede eliminar")
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar a "${company.name}"?`)
    if (!confirmDelete) return
    try {
      await api.delete(`/companies/${company.id}`)
      toast.success("Empresa eliminada correctamente")
      fetchCompanies()
    } catch (err) {
      toast.error(err.message || "Error al eliminar")
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 font-[Outfit] pb-20 px-2 sm:px-0">
      
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2 md:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="min-w-0">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">
              Empresas
            </h2>
            <p className="text-[9px] md:text-[10px] font-bold text-[#87be00] uppercase tracking-[0.3em] mt-2 italic leading-tight">
              {hasFullAccess ? "Administración Global de Clientes" : `Gestión: ${user?.company_name}`}
            </p>
          </div>
          {isCultivaAdmin && (
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 w-max animate-pulse">
              <FiShield className="text-blue-600" size={12} />
              <span className="text-[8px] font-black text-blue-600 uppercase">Acceso Elevado</span>
            </div>
          )}
        </div>

        {hasFullAccess && (
          <button
            onClick={() => setOpenModal(true)}
            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-[#87be00] hover:bg-black text-white px-6 py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-widest transition-all shadow-lg shadow-[#87be00]/20 active:scale-95 group"
          >
            <FiPlus size={18} className="group-hover:rotate-90 transition-transform" />
            Crear Nueva Empresa
          </button>
        )}
      </div>

      {/* 🚩 VISTA MÓVIL: CARDS (Oculta en md) */}
      <div className="md:hidden space-y-4 px-2">
        {loading ? (
          <div className="py-20 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#87be00] border-t-transparent"></div></div>
        ) : (
          companies.map((company, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              key={company.id}
              className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-4 relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 text-[#87be00] flex items-center justify-center shrink-0">
                    <FiBriefcase size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-800 uppercase italic truncate">{company.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase font-mono">{company.rut}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => handleEdit(company)} className="p-2 bg-gray-50 text-gray-400 rounded-lg"><FiEdit3 size={14}/></button>
                   {isRoot && <button onClick={() => handleDelete(company)} className="p-2 bg-red-50 text-red-400 rounded-lg"><FiTrash2 size={14}/></button>}
                </div>
              </div>

              {/* LIMITES EN GRID */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex flex-col items-center py-1">
                  <span className="text-[7px] font-black text-gray-400 uppercase mb-1 tracking-tighter">SUPS</span>
                  <div className="flex items-center gap-1 text-[11px] font-black text-gray-700">
                    <FiActivity size={10} className="text-[#87be00]" /> {company.max_supervisors}
                  </div>
                </div>
                <div className="flex flex-col items-center py-1 border-x border-gray-200">
                  <span className="text-[7px] font-black text-gray-400 uppercase mb-1 tracking-tighter">MERCS</span>
                  <div className="flex items-center gap-1 text-[11px] font-black text-gray-700">
                    <FiUsers size={10} className="text-[#87be00]" /> {company.max_users}
                  </div>
                </div>
                <div className="flex flex-col items-center py-1">
                  <span className="text-[7px] font-black text-gray-400 uppercase mb-1 tracking-tighter">VIEWS</span>
                  <div className="flex items-center gap-1 text-[11px] font-black text-gray-700">
                    <FiEye size={10} className="text-[#87be00]" /> {company.max_view}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                 <span className="text-[8px] font-bold text-gray-400 italic">ID: {company.id.split('-')[0]}</span>
                 <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase italic ${company.is_active ? 'text-[#87be00]' : 'text-gray-400'}`}>
                      {company.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => hasFullAccess && toggleCompany(company.id)}
                      disabled={!hasFullAccess}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${
                        !hasFullAccess ? "opacity-30" : ""
                      } ${company.is_active ? "bg-[#87be00]" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${
                          company.is_active ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 🚩 VISTA DESKTOP: TABLA ORIGINAL (Oculta en móvil) */}
      <div className="hidden md:block bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden mx-2 lg:mx-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Empresa</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Identificación</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Plan / Límites</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="4" className="p-20 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#87be00] border-t-transparent"></div></td></tr>
              ) : (
                companies.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-[#87be00] transition-all">
                          <FiBriefcase size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800 uppercase tracking-tighter leading-none">{company.name}</p>
                          <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold italic">ID: {company.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="bg-gray-50 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 uppercase font-mono border border-gray-100">
                        {company.rut}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Sups</span>
                          <div className="flex items-center gap-1 text-xs font-black text-gray-700">
                            <FiActivity size={10} className="text-[#87be00]" /> {company.max_supervisors}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Mercs</span>
                          <div className="flex items-center gap-1 text-xs font-black text-gray-700">
                            <FiUsers size={10} className="text-[#87be00]" /> {company.max_users}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Views</span>
                          <div className="flex items-center gap-1 text-xs font-black text-gray-700">
                            <FiEye size={10} className="text-[#87be00]" /> {company.max_view}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleEdit(company)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-[#87be00] transition-all"><FiEdit3 size={16} /></button>
                        <button
                          onClick={() => hasFullAccess && toggleCompany(company.id)}
                          disabled={!hasFullAccess}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${!hasFullAccess ? "opacity-30 cursor-not-allowed" : ""} ${company.is_active ? "bg-[#87be00]" : "bg-gray-200"}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all ${company.is_active ? "translate-x-6" : "translate-x-1"}`}/>
                        </button>
                        {isRoot && (
                          <button onClick={() => handleDelete(company)} className="p-2.5 bg-red-50 text-red-300 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><FiTrash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCompanyModal isOpen={openModal} onClose={handleCloseModal} onCreated={fetchCompanies} editingCompany={editingCompany} />
    </div>
  )
}

export default Companies