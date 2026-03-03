import { useEffect, useState } from "react"
import { FiPlus, FiUpload, FiTrash, FiToggleRight } from "react-icons/fi"

import CreateLocalModal from "./CreateLocalModal"
import UploadLocalesModal from "./UploadLocalesModal"

const API_URL = "http://localhost:5000/api/locales"

const AdminLocales = () => {

  const [locales, setLocales] = useState([])
  const [openCreate, setOpenCreate] = useState(false)
  const [openUpload, setOpenUpload] = useState(false)

  const userLocal = JSON.parse(localStorage.getItem("user"))
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchLocales()
  }, [])

  const fetchLocales = async () => {
    const res = await fetch(
      `${API_URL}?company_id=${userLocal.company_id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = await res.json()
    setLocales(data)
  }

  const toggleLocal = async (id) => {
    await fetch(`${API_URL}/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    })

    fetchLocales()
  }

  const deleteLocal = async (id) => {
    if (!window.confirm("¿Eliminar local?")) return

    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })

    fetchLocales()
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
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
              <tr key={local.id} className="border-t hover:bg-gray-50">

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
                    className="text-red-500 hover:opacity-70"
                  >
                    <FiTrash size={16} />
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
        companies={[{ id: userLocal.company_id }]} // 👈 automático
        autoCompany={userLocal.company_id}
      />

      <UploadLocalesModal
        isOpen={openUpload}
        onClose={() => setOpenUpload(false)}
        onUploaded={fetchLocales}
        companyId={userLocal.company_id}
      />

    </div>
  )
}

export default AdminLocales