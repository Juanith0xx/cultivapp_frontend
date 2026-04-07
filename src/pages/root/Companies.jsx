import { useEffect, useState } from "react"
import { FiPlus, FiBriefcase, FiUsers, FiEye, FiActivity } from "react-icons/fi"
import CreateCompanyModal from "../../components/CreateCompanyModal"
import { toast } from "react-hot-toast"

const API_URL = import.meta.env.VITE_API_URL

const Companies = () => {
  const [companies, setCompanies] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/api/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error("Error obteniendo empresas")

      const data = await res.json()
      setCompanies(data)
    } catch (err) {
      console.error("Error cargando empresas:", err)
      toast.error("No se pudieron cargar las empresas")
    } finally {
      setLoading(false)
    }
  }

  const toggleCompany = async (id) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_URL}/api/companies/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Estado actualizado")
      fetchCompanies()
    } catch (err) {
      console.error("Error cambiando estado de empresa:", err)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-[Outfit]">
      
      {/* HEADER DE SECCIÓN */}
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

      {/* CONTENEDOR DE TABLA */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Empresa</th>
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Identificación</th>
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Plan Contratado</th>
              <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-20 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#87be00] border-t-transparent"></div>
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-20 text-center">
                   <FiBriefcase className="mx-auto text-gray-200 mb-4" size={40} />
                   <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Sin empresas registradas</p>
                </td>
              </tr>
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
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter italic">Cliente Activo</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-6">
                    <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-500 uppercase">
                      {company.rut}
                    </span>
                  </td>

                  <td className="p-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Supervisores</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          <FiActivity size={12} className="text-[#87be00]" /> {company.max_supervisors}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Mercaderistas</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          <FiUsers size={12} className="text-[#87be00]" /> {company.max_users}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Views</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          <FiEye size={12} className="text-[#87be00]" /> {company.max_view}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-6">
                    <div className="flex justify-center">
                      <button
                        onClick={() => toggleCompany(company.id)}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 shadow-inner ${
                          company.is_active ? "bg-[#87be00]" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 shadow-sm ${
                            company.is_active ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
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
        onClose={() => setOpenModal(false)}
        onCreated={fetchCompanies}
      />
    </div>
  )
}

export default Companies