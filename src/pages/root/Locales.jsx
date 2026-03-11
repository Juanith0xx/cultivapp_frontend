import { useEffect, useState, useMemo } from "react"
import { FiPlus, FiUpload, FiTrash2, FiEdit, FiEye, FiEyeOff } from "react-icons/fi"
import toast from "react-hot-toast"

import CreateLocalModal from "../../components/CreateLocalModal"
import UploadLocalesModal from "../../components/UploadLocalesModal"
import EditLocalModal from "../../components/EditLocalModal"
import LocalesMap from "../../components/LocalesMap"

import api from "../../api/apiClient"

const Locales = () => {
  const [locales, setLocales] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState("")
  const [showInactive, setShowInactive] = useState(false)

  const [openCreate, setOpenCreate] = useState(false)
  const [openUpload, setOpenUpload] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedLocal, setSelectedLocal] = useState(null)

  const [mapSelectedId, setMapSelectedId] = useState(null)

  /* =================================
      LOAD DATA
  ================================= */
  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    fetchLocales()
  }, [selectedCompany])

  const fetchCompanies = async () => {
    try {
      const data = await api.get("/api/companies")
      setCompanies(data || [])
    } catch (error) {
      toast.error("Error al cargar empresas")
    }
  }

  const fetchLocales = async () => {
    try {
      let url = "/api/locales"
      if (selectedCompany) url += `?company_id=${selectedCompany}`
      
      const data = await api.get(url)
      setLocales(data || [])
    } catch (error) {
      toast.error("No se pudieron cargar los locales")
    }
  }

  /* =================================
      FILTRADO LÓGICO
  ================================= */
  const visibleLocales = useMemo(() => {
    return locales.filter(l => showInactive || l.is_active)
  }, [locales, showInactive])

  const activeSelectedLocal = useMemo(() => {
    return visibleLocales.find(l => l.id === mapSelectedId)
  }, [mapSelectedId, visibleLocales])

  /* =================================
      ACTIONS
  ================================= */
  const toggleLocal = async (id) => {
    try {
      await api.patch(`/api/locales/${id}/toggle`)
      setLocales(prev => prev.map(l => 
        l.id === id ? { ...l, is_active: !l.is_active } : l
      ))
      toast.success("Estado actualizado")
    } catch (error) {
      toast.error("Error al cambiar estado")
    }
  }

  const deleteLocal = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este local?")) return
    try {
      await api.delete(`/api/locales/${id}`)
      setLocales(prev => prev.filter(l => l.id !== id))
      toast.success("Local eliminado")
    } catch (error) {
      toast.error("No se pudo eliminar")
    }
  }

  const openEditModal = (local) => {
    setSelectedLocal(local)
    setOpenEdit(true)
  }

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Gestión de Locales</h2>
          <p className="text-sm text-gray-500">Administra la visibilidad y datos de tus puntos de venta.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setOpenUpload(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm"
          >
            <FiUpload size={16} className="text-gray-500" />
            Carga Masiva
          </button>
          <button
            onClick={() => setOpenCreate(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-lg shadow-black/10"
          >
            <FiPlus size={16} />
            Crear Local
          </button>
        </div>
      </div>

      {/* FILTROS Y VISTA DE MAPA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtrar por empresa:</span>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black transition min-w-[200px]"
                >
                  <option value="">Todas las empresas</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>

             <button 
              onClick={() => setShowInactive(!showInactive)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                showInactive ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500"
              }`}
             >
               {showInactive ? <FiEye size={14}/> : <FiEyeOff size={14}/>}
               {showInactive ? "MOSTRANDO INACTIVOS" : "OCULTANDO INACTIVOS"}
             </button>
          </div>

          <div className="h-[350px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
             <LocalesMap locales={visibleLocales} selectedLocal={activeSelectedLocal} />
          </div>
        </div>
      </div>

      {/* TABLA DE LOCALES */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Cadena</th>
                <th className="p-4 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Ubicación</th>
                <th className="p-4 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Dirección</th>
                <th className="p-4 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Contacto</th>
                <th className="p-4 text-center font-bold text-gray-400 uppercase text-[10px] tracking-widest">Estado</th>
                <th className="p-4 text-center font-bold text-gray-400 uppercase text-[10px] tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleLocales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400 italic">No hay locales registrados en esta selección.</td>
                </tr>
              ) : (
                visibleLocales.map(local => (
                  <tr 
                    key={local.id} 
                    className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${mapSelectedId === local.id ? 'bg-indigo-50/40' : ''} ${!local.is_active ? 'opacity-75' : ''}`}
                    onClick={() => setMapSelectedId(local.id)}
                  >
                    <td className="p-4">
                      <span className={`font-bold ${local.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                        {local.cadena}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className={local.is_active ? 'text-gray-700' : 'text-gray-400'}>{local.region}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{local.comuna}</span>
                      </div>
                    </td>
                    <td className={`p-4 ${local.is_active ? 'text-gray-600' : 'text-gray-400'}`}>
                      {local.direccion}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className={`text-xs font-semibold ${local.is_active ? 'text-gray-800' : 'text-gray-400'}`}>{local.gerente}</span>
                        <span className="text-[11px] text-gray-500">{local.telefono}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleLocal(local.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          local.is_active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            local.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>

                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => openEditModal(local)} 
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteLocal(local.id)} 
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
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
      </div>

      <CreateLocalModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onCreated={fetchLocales} companies={companies} />
      <UploadLocalesModal isOpen={openUpload} onClose={() => setOpenUpload(false)} onUploaded={fetchLocales} companies={companies} />
      <EditLocalModal isOpen={openEdit} onClose={() => setOpenEdit(false)} onUpdated={fetchLocales} companies={companies} local={selectedLocal} />
    </div>
  )
}

export default Locales