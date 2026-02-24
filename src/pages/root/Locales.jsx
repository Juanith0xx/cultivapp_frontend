import { useEffect, useState } from "react"
import { FiPlus, FiUpload, FiTrash2 } from "react-icons/fi"
import CreateLocalModal from "../../components/CreateLocalModal"
import UploadLocalesModal from "../../components/UploadLocalesModal"

const Locales = () => {

  const [locales, setLocales] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState("")
  const [openCreate, setOpenCreate] = useState(false)
  const [openUpload, setOpenUpload] = useState(false)

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    fetchLocales()
  }, [selectedCompany])

  const fetchCompanies = async () => {
    const token = localStorage.getItem("token")

    const res = await fetch("http://localhost:5000/api/companies", {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json()
    setCompanies(data)
  }

  const fetchLocales = async () => {
    const token = localStorage.getItem("token")

    let url = "http://localhost:5000/api/locales"
    if (selectedCompany) {
      url += `?company_id=${selectedCompany}`
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json()
    setLocales(data)
  }

  const toggleLocal = async (id) => {
    const token = localStorage.getItem("token")

    await fetch(
      `http://localhost:5000/api/locales/${id}/toggle`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    fetchLocales()
  }

  const deleteLocal = async (id) => {
    if (!window.confirm("¿Eliminar local?")) return

    const token = localStorage.getItem("token")

    await fetch(
      `http://localhost:5000/api/locales/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    fetchLocales()
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
        <option value="">Todas las empresas</option>
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
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {locales.map(local => (
              <tr key={local.id} className="border-t">
                <td className="p-4">{local.cadena}</td>
                <td className="p-4">{local.region}</td>
                <td className="p-4">{local.comuna}</td>

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

                <td className="p-4">
                  <button
                    onClick={() => deleteLocal(local.id)}
                    className="text-red-500"
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

    </div>
  )
}

export default Locales