import { useEffect, useState } from "react"

const API_URL = import.meta.env.VITE_API_URL

const Analytics = () => {

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {

    try {

      const token = localStorage.getItem("token")

      const res = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error("Error obteniendo estadísticas")
      }

      const users = await res.json()

      const activeUsers = users.filter(user => user.is_active).length

      setStats({
        totalUsers: users.length,
        activeUsers
      })

    } catch (error) {

      console.error("Error cargando analytics:", error)

    } finally {

      setLoading(false)

    }

  }

  if (loading) {
    return (
      <div className="p-6">
        Cargando estadísticas...
      </div>
    )
  }

  return (

    <div className="space-y-6">

      <h2 className="text-2xl font-semibold">
        Dashboard Global
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* TOTAL USERS */}

        <div className="bg-white p-6 rounded-xl shadow-sm border">

          <p className="text-gray-500 text-sm">
            Usuarios Totales
          </p>

          <p className="text-3xl font-semibold">
            {stats.totalUsers}
          </p>

        </div>

        {/* ACTIVE USERS */}

        <div className="bg-white p-6 rounded-xl shadow-sm border">

          <p className="text-gray-500 text-sm">
            Usuarios Activos
          </p>

          <p className="text-3xl font-semibold text-green-600">
            {stats.activeUsers}
          </p>

        </div>

      </div>

    </div>

  )

}

export default Analytics