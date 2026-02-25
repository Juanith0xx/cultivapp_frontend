import { useEffect, useState } from "react"

const AdminOverview = () => {

  const [stats, setStats] = useState({
    counts: {
      SUPERVISOR: 0,
      USUARIO: 0,
      VIEW: 0,
      ADMIN_CLIENTE: 0
    },
    limits: {
      max_supervisors: 0,
      max_users: 0,
      max_view: 0
    }
  })

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
    return (
      <p className="text-red-500">
        {error}
      </p>
    )
  }

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">
        Resumen Empresa
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Supervisores</p>
          <p className="text-xl font-semibold">
            {stats.counts.SUPERVISOR} / {stats.limits.max_supervisors}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Usuarios</p>
          <p className="text-xl font-semibold">
            {stats.counts.USUARIO} / {stats.limits.max_users}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">View</p>
          <p className="text-xl font-semibold">
            {stats.counts.VIEW} / {stats.limits.max_view}
          </p>
        </div>

      </div>

    </div>
  )
}

export default AdminOverview