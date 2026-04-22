import { useEffect, useState } from "react"
import { FiPlus, FiBriefcase, FiUsers, FiEye, FiActivity, FiEdit3, FiTrash2, FiShield } from "react-icons/fi"
import CreateCompanyModal from "../../components/CreateCompanyModal"
import { toast } from "react-hot-toast"
import api from "../../api/apiClient"
import { useAuth } from "../../context/AuthContext"

const Companies = () => {
  const { user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState(null)

  // 🚩 CONSTANTE MAESTRA: ID DE CULTIVA (Misma que usamos en Alertas)
  const ID_CULTIVA = '0e342e01-d213-4353-b210-39a12ac335cf'; 

  // 🚀 LÓGICA DE ACCESO ELEVADO
  const isRoot = user?.role === "ROOT"
  const isCultivaAdmin = user?.role === "ADMIN_CLIENTE" && user?.company_id === ID_CULTIVA
  
  // Define quién puede crear/editar/activar
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
    // 🛡️ Solo ROOT puede eliminar (Borrado Lógico)
    if (!isRoot) return toast.error("Acción restringida: Solo el administrador maestro puede eliminar clientes")

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar a "${company.name}"? Esta acción no se puede deshacer.`
    )

    if (!confirmDelete) return

    try {
      await api.delete(`/companies/${company.id}`)
      toast.success("Empresa eliminada correctamente")
      fetchCompanies()
    } catch (err) {
      toast.error(err.message || "Error al eliminar la empresa")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-[Outfit] pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
        <div className="flex items-start gap-4">
          <div>
            <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">
              Empresas
            </h2>
            <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.3em] mt-2 italic">
              {hasFullAccess ? "Administración Global de Clientes Cultivapp" : `Panel de Gestión: ${user?.company_name}`}
            </p>
          </div>
          {isCultivaAdmin && (
            <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 animate-pulse">
              <FiShield className="text-blue-600" size={12} />
              <span className="text-[8px] font-black text-blue-600 uppercase">Acceso Elevado</span>
            </div>
          )}
        </div>

        {/* 🚩 Botón habilitado para ROOT y ADMIN CULTIVA */}
        {hasFullAccess && (
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 bg-[#87be00] hover:bg-black text-white px-6 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-[#87be00]/20 group"
          >
            <FiPlus size={18} className="group-hover:rotate-90 transition-transform" />
            Crear Nueva Empresa
          </button>
        )}
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
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

                  <td className="p-6">
                    <div className="flex items-center justify-center gap-3">
                      {/* EDITAR: Disponible para ROOT y ADMIN CULTIVA */}
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-[#87be00] transition-all"
                        title="Ver/Editar Límites"
                      >
                        <FiEdit3 size={16} />
                      </button>

                      {/* TOGGLE: Habilitado para ROOT y ADMIN CULTIVA */}
                      <button
                        onClick={() => hasFullAccess && toggleCompany(company.id)}
                        disabled={!hasFullAccess}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                          !hasFullAccess ? "opacity-30 cursor-not-allowed" : ""
                        } ${company.is_active ? "bg-[#87be00]" : "bg-gray-200"}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all ${
                            company.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>

                      {/* ELIMINAR: ÚNICAMENTE PARA ROOT */}
                      {isRoot && (
                        <button
                          onClick={() => handleDelete(company)}
                          className="p-2.5 bg-red-50 text-red-300 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Eliminar Empresa"
                        >
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

      <CreateCompanyModal
        isOpen={openModal}
        onClose={handleCloseModal}
        onCreated={fetchCompanies}
        editingCompany={editingCompany}
      />
    </div>
  )
}

export default Companies