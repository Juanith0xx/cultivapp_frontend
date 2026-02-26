import { useEffect, useState } from "react"

const AdminOverview = () => {

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      const user = JSON.parse(localStorage.getItem("user"))

      if (!user?.company_id) {
        throw new Error("Empresa no definida")
      }

      const res = await fetch(
        `http://localhost:5000/api/users/company/${user.company_id}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error al obtener estadísticas")
      }

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

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  if (!stats) return null

  // 🔒 Protección total contra NaN
  const maxSupervisors = Number(stats?.limits?.max_supervisors || 0)
  const maxUsers = Number(stats?.limits?.max_users || 0)
  const maxView = Number(stats?.limits?.max_view || 0)

  const usedSupervisors = Number(stats?.counts?.SUPERVISOR || 0)
  const usedUsers = Number(stats?.counts?.USUARIO || 0)
  const usedView = Number(stats?.counts?.VIEW || 0)

  const availableSupervisors = Math.max(maxSupervisors - usedSupervisors, 0)
  const availableUsers = Math.max(maxUsers - usedUsers, 0)
  const availableView = Math.max(maxView - usedView, 0)

  const Card = ({ title, available, used, max, color }) => {

    const percentage = max > 0 ? (used / max) * 100 : 0

    const getColor = () => {
      if (available === 0) return "bg-red-500"
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
            {available}
          </p>

          <span className="text-xs text-gray-400">
            {used} / {max}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className={`${getColor()} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {available === 0 && (
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
          Gestión de límites y disponibilidad de usuarios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card
          title="Supervisores disponibles"
          available={availableSupervisors}
          used={usedSupervisors}
          max={maxSupervisors}
          color="bg-green-500"
        />

        <Card
          title="Usuarios disponibles"
          available={availableUsers}
          used={usedUsers}
          max={maxUsers}
          color="bg-blue-500"
        />

        <Card
          title="View disponibles"
          available={availableView}
          used={usedView}
          max={maxView}
          color="bg-purple-500"
        />

      </div>

    </div>
  )
}

export default AdminOverview