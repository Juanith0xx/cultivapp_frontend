import { useState } from "react"
import api from "../api/apiClient"

const EditUserContactModal = ({ user, onClose, onUpdated }) => {

  const [email, setEmail] = useState(user.email || "")
  const [phone, setPhone] = useState(user.phone || "")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {

    try {

      setLoading(true)

      await api.put(
        `/api/users/${user.id}/update-contact`,
        { email, phone }
      )

      onUpdated()
      onClose()

    } catch (error) {

      alert(error.message || "Error al actualizar")

      console.error(error)

    } finally {

      setLoading(false)

    }

  }

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">

        <h2 className="text-lg font-semibold mb-4">
          Editar contacto
        </h2>

        <div className="space-y-4">

          <div>

            <label className="text-sm text-gray-500">
              Correo
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-gray-500">
              Teléfono
            </label>

            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />

          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>

        </div>

      </div>

    </div>

  )
}

export default EditUserContactModal