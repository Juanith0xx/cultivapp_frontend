import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../../api/apiClient"

const ForgotPassword = () => {

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {

    e.preventDefault()

    setLoading(true)

    try {

      const data = await api.post(
        "/api/auth/forgot-password",
        { email }
      )

      toast.success(data.message)

      setEmail("")

    } catch (error) {

      toast.error(error.message || "Error enviando correo")

    } finally {

      setLoading(false)

    }

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
          Recuperar contraseña
        </h2>

        <p className="text-sm text-gray-500 text-center">
          Ingresa tu correo y te enviaremos un enlace seguro.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-400 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#87be00] text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>

        </form>

        <div className="text-center">

          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            Volver al login
          </Link>

        </div>

      </motion.div>

    </div>

  )
}

export default ForgotPassword