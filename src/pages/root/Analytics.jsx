import { useEffect, useState } from "react"
// Importamos el cliente centralizado para evitar errores de URL
import api from "../../api/apiClient" 

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
      setLoading(true)
      
      // ✅ MEJORA: Usamos 'api.get'. 
      // No necesita '/api' ni configurar headers manualmente.
      const users = await api.get("/users")

      const activeUsers = users.filter(user => user.is_active).length

      setStats({
        totalUsers: users.length,
        activeUsers
      })

    } catch (error) {
      console.error("❌ Error cargando analytics:", error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#87be00]"></div>
        <p className="text-gray-500 font-medium animate-pulse">Cargando estadísticas globales...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 font-[Outfit]">
      <div>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
          Dashboard Global
        </h2>
        <p className="text-[#87be00] text-xs font-bold uppercase tracking-widest mt-1">Resumen de red Cultiva</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TOTAL USERS */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
            Usuarios Totales
          </p>
          <p className="text-5xl font-black text-gray-800 mt-2">
            {stats.totalUsers}
          </p>
          <div className="mt-4 h-1 w-12 bg-gray-100 rounded-full" />
        </div>

        {/* ACTIVE USERS */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
            Usuarios Activos
          </p>
          <p className="text-5xl font-black text-[#87be00] mt-2">
            {stats.activeUsers}
          </p>
          <div className="mt-4 h-1 w-12 bg-[#87be00]/20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default Analytics