import { useEffect, useState } from "react"
import api from "../../api/apiClient"

const AdminOverview = () => {

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    try {

      setLoading(true)
      setError(null)

      const user = JSON.parse(localStorage.getItem("user"))

      if (!user?.company_id) {
        throw new Error("Empresa no definida")
      }

      const data = await api.get(
        `users/company/${user.company_id}/stats`
      )

      setStats(data)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) return <p>Cargando...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!stats) return null

  const safeNumber = (value) => {
    const num = parseInt(value)
    return isNaN(num) ? 0 : num
  }

  const usedSupervisors = safeNumber(stats?.counts?.SUPERVISOR)
  const usedUsers = safeNumber(stats?.counts?.USUARIO)
  const usedView = safeNumber(stats?.counts?.VIEW)

  const maxSupervisors = safeNumber(stats?.limits?.max_supervisors)
  const maxUsers = safeNumber(stats?.limits?.max_users)
  const maxView = safeNumber(stats?.limits?.max_view)

  const Card = ({ title, used, max, color }) => {

    const percentage = max > 0 ? (used / max) * 100 : 0

    const getColor = () => {
      if (used >= max && max > 0) return "bg-red-500"
      if (percentage > 75) return "bg-yellow-500"
      return color
    }

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

        <p className="text-sm text-gray-500 mb-2">
          {title}
        </p>

        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-gray-800">
            {used} / {max}
          </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className={`${getColor()} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {used >= max && max > 0 && (
          <p className="text-xs text-red-500 mt-3">
            Límite alcanzado
          </p>
        )}

      </div>
    )
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-semibold">
          Resumen Empresa
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Uso actual de cuentas permitidas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card
          title="Supervisores"
          used={usedSupervisors}
          max={maxSupervisors}
          color="bg-green-500"
        />

        <Card
          title="Usuarios"
          used={usedUsers}
          max={maxUsers}
          color="bg-blue-500"
        />

        <Card
          title="Solo Vista"
          used={usedView}
          max={maxView}
          color="bg-purple-500"
        />

      </div>

    </div>
  )
}

export default AdminOverview