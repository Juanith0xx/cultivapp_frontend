import { useState } from "react"
import { FiX } from "react-icons/fi"
import api from "../api/apiClient"

const ResetPasswordAdminModal = ({ user, onClose, onUpdated }) => {

  const [tempPassword, setTempPassword] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!user) return null

  const handleReset = async () => {

    try {

      setLoading(true)
      setError("")

      const data = await api.put(
        `/users/${user.id}/reset-password`
      )

      // contraseña temporal devuelta por el backend
      setTempPassword(data.temporaryPassword)

    } catch (err) {

      setError(err.message)

    } finally {

      setLoading(false)

    }

  }

  const handleClose = () => {

    if (onUpdated) onUpdated()
    onClose()

  }

  return (

    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6">

        <div className="flex justify-between items-center">

          <h2 className="text-lg font-semibold">
            Resetear contraseña
          </h2>

          <button onClick={handleClose}>
            <FiX />
          </button>

        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        {!tempPassword ? (
          <>

            <p className="text-sm text-gray-600">
              ¿Deseas generar una contraseña temporal para{" "}
              <span className="font-medium">
                {user.first_name}
              </span>?
            </p>

            <div className="flex justify-end gap-3">

              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>

              <button
                onClick={handleReset}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
              >
                {loading ? "Generando..." : "Confirmar"}
              </button>

            </div>

          </>
        ) : (
          <>

            <p className="text-sm text-gray-600">
              Contraseña temporal generada:
            </p>

            <div className="bg-gray-100 p-3 rounded-lg text-center font-mono text-lg tracking-wider">
              {tempPassword}
            </div>

            <p className="text-xs text-gray-500">
              El usuario deberá cambiarla al iniciar sesión.
            </p>

            <div className="flex justify-end">

              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Cerrar
              </button>

            </div>

          </>
        )}

      </div>

    </div>

  )

}

export default ResetPasswordAdminModal