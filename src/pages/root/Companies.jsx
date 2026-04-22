import { useEffect, useState } from "react"
import { FiPlus, FiBriefcase, FiUsers, FiEye, FiActivity, FiEdit3, FiTrash2 } from "react-icons/fi"
import CreateCompanyModal from "../../components/CreateCompanyModal"
import { toast } from "react-hot-toast"
import api from "../../api/apiClient" // 🚩 Usamos tu apiClient para consistencia

const Companies = () => {
  const [companies, setCompanies] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const data = await api.get("/companies")
      setCompanies(data)
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
    try {
      await api.patch(`/companies/${id}/toggle`)
      toast.success("Estado actualizado")
      fetchCompanies()
    } catch (err) {
      toast.error("Error al cambiar estado")
    }
  }

  // 🚩 NUEVA FUNCIÓN: Eliminar Empresa
  const handleDelete = async (company) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar a "${company.name}"? Esta acción no se puede deshacer y afectará a todos sus usuarios.`
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
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">
            Empresas
          </h2>
          <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.3em] mt-2">
            Administración de Clientes Cultivapp
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 bg-[#87be00] hover:bg-[#76a500] text-white px-6 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-[#87be00]/20"
        >
          <FiPlus size={18} />
          Crear Nueva Empresa
        </button>
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
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#87be00]/10 group-hover:text-[#87be00] transition-all">
                        <FiBriefcase size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800 uppercase tracking-tighter leading-none">{company.name}</p>
                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold italic">ID: {company.id.split('-')[0]}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-6">
                    <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-500 uppercase font-mono">
                      {company.rut}
                    </span>
                  </td>

                  <td className="p-6">
                    <div className="flex gap-4">
                      {/* Límites de Supervisores, Mercs, Views */}
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
                      {/* BOTÓN EDITAR */}
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-[#87be00] transition-all"
                        title="Editar Límites"
                      >
                        <FiEdit3 size={16} />
                      </button>

                      {/* TOGGLE ESTADO */}
                      <button
                        onClick={() => toggleCompany(company.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                          company.is_active ? "bg-[#87be00]" : "bg-gray-200"
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all ${
                            company.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>

                      {/* 🚩 BOTÓN ELIMINAR (ROOT) */}
                      <button
                        onClick={() => handleDelete(company)}
                        className="p-2.5 bg-red-50 text-red-300 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        title="Eliminar Empresa"
                      >
                        <FiTrash2 size={16} />
                      </button>
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