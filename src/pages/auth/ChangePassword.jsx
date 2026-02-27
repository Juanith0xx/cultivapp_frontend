import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import toast from "react-hot-toast"

const ChangePassword = () => {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { logout, clearMustChangePassword } = useAuth()

  const handleChange = async () => {
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "PUT", // 👈 consistente con tu backend
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }

      toast.success("Contraseña actualizada correctamente")

      // 🔥 Limpiar flag de cambio obligatorio
      clearMustChangePassword()

      // 🔥 Invalidar sesión actual
      logout()

      // 🔥 Redirigir al login
      navigate("/")

    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">

        <h2 className="text-xl font-semibold mb-6 text-center">
          Cambiar contraseña
        </h2>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-[#87be00]"
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-6 focus:ring-2 focus:ring-[#87be00]"
        />

        <button
          onClick={handleChange}
          disabled={loading}
          className="w-full bg-[#87be00] hover:bg-[#6e9e00] 
                     text-white py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>

      </div>
    </div>
  )
}

export default ChangePassword
