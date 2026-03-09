import { useState } from "react"
import { FiX, FiUpload } from "react-icons/fi"

const API_URL = import.meta.env.VITE_API_URL

const UploadLocalesModal = ({
  isOpen,
  onClose,
  onUploaded,
  companies = []
}) => {

  const [company_id, setCompanyId] = useState("")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)

  if (!isOpen) return null

  const resetState = () => {
    setCompanyId("")
    setFile(null)
    setError("")
    setResult(null)
    setLoading(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    setError("")
    setResult(null)

    if (!company_id) {
      setError("Debes seleccionar una empresa")
      return
    }

    if (!file) {
      setError("Selecciona un archivo Excel")
      return
    }

    const allowedExtensions = [".xlsx", ".xls"]
    const fileExtension = file.name.substring(file.name.lastIndexOf("."))

    if (!allowedExtensions.includes(fileExtension)) {
      setError("El archivo debe ser Excel (.xlsx o .xls)")
      return
    }

    try {

      setLoading(true)

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
        throw new Error(data.message || "Error al subir archivo")
      }

      setResult(data)

      if (onUploaded) onUploaded()

    } catch (err) {

      console.error(err)
      setError(err.message || "Error inesperado")

    } finally {

      setLoading(false)

    }

  }

  return (

    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">

          <h3 className="text-xl font-semibold">
            Carga Masiva Excel
          </h3>

          <button onClick={handleClose}>
            <FiX size={20} />
          </button>

        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* EMPRESA */}
          <select
            value={company_id}
            onChange={(e) => setCompanyId(e.target.value)}
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

          {/* ARCHIVO */}
          <div className="space-y-2">

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm"
            />

            {file && (
              <p className="text-xs text-gray-500">
                Archivo seleccionado: <strong>{file.name}</strong>
              </p>
            )}

          </div>

          {/* BOTÓN */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >

            <FiUpload size={16} />

            {loading ? "Subiendo archivo..." : "Subir Archivo"}

          </button>

          {/* RESULTADO */}
          {result && (

            <div className="bg-green-50 p-4 rounded-lg text-sm space-y-2">

              <p className="text-green-700 font-medium">
                ✔ Locales insertados: {result.inserted}
              </p>

              {result.errors?.length > 0 && (

                <div className="text-red-500">

                  <p>Errores detectados: {result.errors.length}</p>

                  <ul className="text-xs mt-1 list-disc ml-4">

                    {result.errors.slice(0,5).map((err, index) => (
                      <li key={index}>
                        Fila {err.row}: {err.error}
                      </li>
                    ))}

                  </ul>

                </div>

              )}

            </div>

          )}

        </form>

      </div>

    </div>

  )
}

export default UploadLocalesModal