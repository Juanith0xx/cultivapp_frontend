import { useEffect, useState } from "react"
import { FiPlus } from "react-icons/fi"
import CreateCompanyModal from "../../components/CreateCompanyModal"

const Companies = () => {

  const [companies, setCompanies] = useState([])
  const [openModal, setOpenModal] = useState(false)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:5000/api/companies", {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      setCompanies(data)

    } catch (err) {
      console.error(err)
    }
  }

  // 🔥 Activar / Desactivar empresa
  const toggleCompany = async (id) => {
    try {
      const token = localStorage.getItem("token")

      await fetch(`http://localhost:5000/api/companies/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      })

      fetchCompanies()

    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Empresas</h2>

        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition"
        >
          <FiPlus size={16} />
          Crear Empresa
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">RUT</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>

          <tbody>
            {companies.length === 0 ? (
              <tr className="border-t">
                <td className="p-4">Sin registros</td>
                <td className="p-4">Supervisor</td>
                <td className="p-4">Usuarios</td>
                <td className="p-4">View</td>
              </tr>
            ) : (
              companies.map(company => (
                <tr key={company.id} className="border-t">

                  <td className="p-4 font-medium">
                    {company.name}
                  </td>

                  <td className="p-4">
                    {company.rut}
                  </td>

                  {/* Límites */}
                  <td className="p-4 text-xs text-gray-600">
                    Sup: {company.max_supervisors} | 
                    User: {company.max_users} | 
                    View: {company.max_view}
                  </td>

                  {/* Switch */}
                  <td className="p-4">
                    <button
                      onClick={() => toggleCompany(company.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        company.is_active
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          company.is_active
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <CreateCompanyModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={fetchCompanies}
      />

    </div>
  )
}

export default Companies