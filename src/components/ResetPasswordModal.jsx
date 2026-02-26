import { useState } from "react"

const ResetPasswordModal = ({ user, onClose }) => {

  const [tempPassword, setTempPassword] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem("token")

      const res = await fetch(
        `http://localhost:5000/api/users/${user.id}/reset-password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "Error al resetear contraseña")
        return
      }

      setTempPassword(data.temporaryPassword)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">

        <h2 className="text-lg font-semibold mb-4">
          Resetear contraseña
        </h2>

        {!tempPassword ? (
          <>
            <p className="text-sm text-gray-600 mb-6">
              ¿Deseas generar una contraseña temporal para{" "}
              <span className="font-medium">{user.first_name}</span>?
            </p>

            <div className="flex justify-end gap-3">

              <button
                onClick={onClose}
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
            <p className="text-sm text-gray-600 mb-3">
              Contraseña temporal generada:
            </p>

            <div className="bg-gray-100 p-3 rounded-lg text-center font-mono text-lg">
              {tempPassword}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              El usuario deberá cambiarla al iniciar sesión.
            </p>

            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
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

export default ResetPasswordModal