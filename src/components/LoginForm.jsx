import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
    setLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión")
      }

      login(data)

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

      // 🔥 Mensajes inteligentes según error
      if (err.message.includes("deshabilitada")) {
        toast.error(err.message, { icon: "🚫" })
      } else if (err.message.includes("Empresa")) {
        toast.error(err.message, { icon: "🏢" })
      } else {
        toast.error(err.message)
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 md:bg-white flex md:items-center md:justify-center">
      <div className="w-full max-w-6xl bg-white md:rounded-2xl md:shadow-xl overflow-hidden grid md:grid-cols-2">

        {/* PANEL IZQUIERDO */}
        <div className="hidden md:flex bg-[#87be00] text-white items-center justify-center p-12">
          <div>
            <h2 className="text-4xl font-bold mb-4">Bienvenido</h2>
            <p className="opacity-85">
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
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-sm text-gray-600 mb-1">
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

              <div>
                <label className="block text-sm text-gray-600 mb-1">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#87be00] hover:bg-[#6e9e00] 
                           text-white font-medium py-3 rounded-xl 
                           transition disabled:opacity-50"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>

            </form>

            <p className="text-sm text-gray-500 mt-6 text-center md:text-left">
              ¿Olvidaste tu contraseña?{" "}
              <span className="text-[#87be00] hover:underline cursor-pointer">
                Recuperar
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LoginForm