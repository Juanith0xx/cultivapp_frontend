import { useState } from "react"
import { FiX, FiUpload } from "react-icons/fi"

const API_URL = import.meta.env.VITE_API_URL

const UploadLocalesModal = ({
  isOpen,
  onClose,
  onUploaded,
  companies
}) => {

  const [company_id, setCompanyId] = useState("")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {

    e.preventDefault()

    setLoading(true)
    setError("")
    setResult(null)

    if (!file) {

      setError("Selecciona un archivo")
      setLoading(false)

      return
    }

    try {

      const token = localStorage.getItem("token")

      const formData = new FormData()

      formData.append("file", file)
      formData.append("company_id", company_id)

      const response = await fetch(
        `${API_URL}/api/locales/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setResult(data)

      if (onUploaded) onUploaded()

    } catch (err) {

      setError(err.message)

    } finally {

      setLoading(false)

    }

  }

  return (

    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-6">

        <div className="flex justify-between items-center">

          <h3 className="text-xl font-semibold">
            Carga Masiva Excel
          </h3>

          <button onClick={onClose}>
            <FiX size={20} />
          </button>

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <select
            value={company_id}
            onChange={(e) => setCompanyId(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >

            <option value="">
              Seleccionar Empresa
            </option>

            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}

          </select>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >

            <FiUpload size={16} />

            {loading ? "Subiendo..." : "Subir Archivo"}

          </button>

          {result && (

            <div className="bg-green-50 p-3 rounded-lg text-sm">

              <p>
                Locales insertados: {result.inserted}
              </p>

              {result.errors?.length > 0 && (
                <p className="text-red-500">
                  Errores: {result.errors.length}
                </p>
              )}

            </div>

          )}

        </form>

      </div>

    </div>

  )
}

export default UploadLocalesModal