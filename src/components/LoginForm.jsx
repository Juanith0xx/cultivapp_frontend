import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

const LoginForm = () => {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Debes completar todos los campos")
      return
    }

    setLoading(true)

    try {

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión")
      }

      login(data)

      if (data.must_change_password) {
        toast("Debes cambiar tu contraseña antes de continuar", {
          icon: "🔐"
        })
        navigate("/change-password")
        return
      }

      if (!data.user || !data.user.role) {
        throw new Error("Error interno: datos inválidos")
      }

      toast.success("Bienvenido a Cultivapp")

      switch (data.user.role) {
        case "ROOT":
          navigate("/root")
          break

        case "ADMIN_CLIENTE":
          navigate("/admin")
          break

        default:
          navigate("/")
      }

    } catch (err) {

      const message = err.message || "Error inesperado"

      if (message.includes("deshabilitada")) {
        toast.error(message, { icon: "🚫" })
      } else if (message.includes("Empresa")) {
        toast.error(message, { icon: "🏢" })
      } else if (message.includes("Credenciales")) {
        toast.error("Correo o contraseña incorrectos", { icon: "🔑" })
      } else {
        toast.error(message)
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 md:bg-white flex md:items-center md:justify-center font-[Outfit]">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl bg-white md:rounded-2xl md:shadow-2xl overflow-hidden grid md:grid-cols-2"
      >

        {/* PANEL IZQUIERDO */}
        <div className="hidden md:flex bg-[#87be00] text-white items-center justify-center p-12">
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Bienvenido
            </h2>
            <p className="opacity-90 text-lg">
              Plataforma interna Cultiva Strategic Partners
            </p>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="flex flex-col min-h-screen md:min-h-0">

          <div className="md:hidden px-6 pt-10 pb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Iniciar sesión
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Accede a tu cuenta
            </p>
          </div>

          <div className="flex-1 px-6 pb-10 md:p-12 flex flex-col justify-center">

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 
                             focus:outline-none 
                             focus:ring-2 focus:ring-[#87be00]
                             focus:border-[#87be00]
                             transition"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 
                             focus:outline-none 
                             focus:ring-2 focus:ring-[#87be00]
                             focus:border-[#87be00]
                             transition"
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#87be00] hover:bg-[#6e9e00] 
                           text-white font-medium py-3 rounded-xl 
                           transition disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Ingresando..." : "Ingresar"}
              </button>

            </form>

            {/* FORGOT PASSWORD */}
            <p className="text-sm text-gray-500 mt-6 text-center md:text-left">
              ¿Olvidaste tu contraseña?{" "}
              <Link
                to="/forgot-password"
                className="text-[#87be00] hover:underline font-medium"
              >
                Recuperar
              </Link>
            </p>

          </div>

        </div>

      </motion.div>

    </div>
  )
}

export default LoginForm