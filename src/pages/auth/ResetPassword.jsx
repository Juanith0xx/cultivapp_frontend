import { useState } from "react"
import { motion } from "framer-motion"
import { useSearchParams, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../../api/apiClient"

const ResetPassword = () => {

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {

    e.preventDefault()

    if (password !== confirmPassword) {
      return toast.error("Las contraseñas no coinciden")
    }

    setLoading(true)

    try {

      await api.post("/auth/reset-password", {
        token,
        newPassword: password
      })

      toast.success("Contraseña actualizada correctamente")

      setTimeout(() => {
        navigate("/")
      }, 2000)

    } catch (error) {

      toast.error(error.message || "Error al actualizar contraseña")

    } finally {

      setLoading(false)

    }

  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Token inválido</p>
      </div>
    )
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 font-[Outfit]">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6"
      >

        <h2 className="text-2xl font-bold text-gray-800 text-center">
          Nueva contraseña
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-400 outline-none"
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-400 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#87be00] text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>

        </form>

      </motion.div>

    </div>

  )
}

export default ResetPassword