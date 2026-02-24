import { useEffect, useState } from "react"

const Analytics = () => {

  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    activeUsers: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      })

      const users = await res.json()

      const activeUsers = users.filter(u => u.is_active).length

      setStats({
        totalUsers: users.length,
        activeUsers
      })

    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold">
        Dashboard Global
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Usuarios Totales</p>
          <p className="text-3xl font-semibold">{stats.totalUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Usuarios Activos</p>
          <p className="text-3xl font-semibold text-green-500">
            {stats.activeUsers}
          </p>
        </div>

      </div>
    </div>
  )
}

export default Analytics