import { useEffect, useState } from "react"
import { FiPlus, FiUpload, FiTrash2, FiEdit } from "react-icons/fi"

import CreateLocalModal from "../../components/CreateLocalModal"
import UploadLocalesModal from "../../components/UploadLocalesModal"
import EditLocalModal from "../../components/EditLocalModal"

import api from "../../api/apiClient"

const Locales = () => {

  const [locales, setLocales] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState("")

  const [openCreate, setOpenCreate] = useState(false)
  const [openUpload, setOpenUpload] = useState(false)

  const [openEdit, setOpenEdit] = useState(false)
  const [selectedLocal, setSelectedLocal] = useState(null)

  /* =================================
     LOAD INITIAL DATA
  ================================= */

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    fetchLocales()
  }, [selectedCompany])

  /* =================================
     FETCH COMPANIES
  ================================= */

  const fetchCompanies = async () => {

    try {

      const data = await api.get("/api/companies")
      setCompanies(data)

    } catch (error) {

      console.error("Error cargando empresas", error)

    }

  }

  /* =================================
     FETCH LOCALES
  ================================= */

  const fetchLocales = async () => {

    try {

      let url = "/api/locales"

      if (selectedCompany) {
        url += `?company_id=${selectedCompany}`
      }

      const data = await api.get(url)

      setLocales(data)

    } catch (error) {

      console.error("Error cargando locales", error)

    }

  }

  /* =================================
     TOGGLE ACTIVO / INACTIVO
  ================================= */

  const toggleLocal = async (id) => {

    try {

      await api.patch(`/api/locales/${id}/toggle`)

      fetchLocales()

    } catch (error) {

      console.error("Error cambiando estado", error)

    }

  }

  /* =================================
     DELETE LOCAL
  ================================= */

  const deleteLocal = async (id) => {

    if (!window.confirm("¿Eliminar local?")) return

    try {

      await api.delete(`/api/locales/${id}`)

      fetchLocales()

    } catch (error) {

      console.error("Error eliminando local", error)

    }

  }

  /* =================================
     OPEN EDIT MODAL
  ================================= */

  const openEditModal = (local) => {

    setSelectedLocal(local)
    setOpenEdit(true)

  }

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <h2 className="text-2xl font-semibold">
          Gestión de Locales
        </h2>

        <div className="flex gap-3">

          <button
            onClick={() => setOpenUpload(true)}
            className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg text-sm"
          >
            <FiUpload size={16} />
            Carga Masiva
          </button>

          <button
            onClick={() => setOpenCreate(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm"
          >
            <FiPlus size={16} />
            Crear Local
          </button>

        </div>

      </div>

      {/* FILTRO EMPRESA */}

      <select
        value={selectedCompany}
        onChange={(e) => setSelectedCompany(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm w-full md:w-64"
      >

        <option value="">
          Todas las empresas
        </option>

        {companies.map(company => (

          <option key={company.id} value={company.id}>
            {company.name}
          </option>

        ))}

      </select>

      {/* TABLA */}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-left text-gray-500">

            <tr>
              <th className="p-4">Cadena</th>
              <th className="p-4">Región</th>
              <th className="p-4">Comuna</th>
              <th className="p-4">Dirección</th>
              <th className="p-4">Gerente</th>
              <th className="p-4">Telefono</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>

          </thead>

          <tbody>

            {locales.map(local => (

              <tr key={local.id} className="border-t">

                <td className="p-4">
                  {local.cadena}
                </td>

                <td className="p-4">
                  {local.region}
                </td>

                <td className="p-4">
                  {local.comuna}
                </td>

                <td className="p-4">
                {local.direccion}
                </td>

                <td className="p-4">
                  {local.gerente}
                </td>

                <td className="p-4">
                  {local.telefono}
                </td>

                {/* ESTADO */}

                <td className="p-4">

                  <button
                    onClick={() => toggleLocal(local.id)}
                    className={`px-3 py-1 rounded-full text-xs ${
                      local.is_active
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >

                    {local.is_active ? "Activo" : "Inactivo"}

                  </button>

                </td>

                {/* ACCIONES */}

                <td className="p-4 flex gap-3">

                  <button
                    onClick={() => openEditModal(local)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FiEdit size={16} />
                  </button>

                  <button
                    onClick={() => deleteLocal(local.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 size={16} />
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* MODALES */}

      <CreateLocalModal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={fetchLocales}
        companies={companies}
      />

      <UploadLocalesModal
        isOpen={openUpload}
        onClose={() => setOpenUpload(false)}
        onUploaded={fetchLocales}
        companies={companies}
      />

      <EditLocalModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        onUpdated={fetchLocales}
        companies={companies}
        local={selectedLocal}
      />

    </div>

  )

}

export default Locales