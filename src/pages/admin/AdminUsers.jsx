import { useEffect, useState } from "react"

const AdminOverview = () => {

  const [stats, setStats] = useState(null)

  const fetchStats = async () => {
    const token = localStorage.getItem("token")
    const user = JSON.parse(localStorage.getItem("user"))

    const res = await fetch(
      `http://localhost:5000/api/users/company/${user.company_id}/stats`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = await res.json()
    setStats(data)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (!stats) return <p>Cargando...</p>

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