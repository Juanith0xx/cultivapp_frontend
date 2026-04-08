import { useEffect, useState } from "react"
import api from "../../api/apiClient" 
import { FiUsers, FiActivity, FiGlobe, FiBriefcase } from "react-icons/fi"

const Analytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCompanies: 0,
    activeCompanies: 0
  })

  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // ✅ PETICIÓN DOBLE: Traemos usuarios y empresas en paralelo
      const [users, companies] = await Promise.all([
        api.get("/users"),
        api.get("/companies")
      ])

      if (Array.isArray(users) && Array.isArray(companies)) {
        const activeUsers = users.filter(user => user.is_active).length
        const activeCompanies = companies.filter(comp => comp.is_active).length

        setStats({
          totalUsers: users.length,
          activeUsers,
          totalCompanies: companies.length,
          activeCompanies
        })
      }
    } catch (error) {
      console.error("❌ Error cargando analytics:", error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 font-[Outfit]">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#87be00] rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse italic">
          Sincronizando Dashboard Global...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-[Outfit]">
      
      {/* HEADER */}
      <div className="px-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#87be00]/10 rounded-lg text-[#87be00]">
            <FiGlobe size={20} />
          </div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">
            Dashboard Global
          </h2>
        </div>
        <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.3em] ml-12">Monitor de infraestructura Cultivapp</p>
      </div>

      {/* GRID DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        
        {/* CARD: EMPRESAS TOTALES */}
        <StatCard 
          label="Empresas" 
          value={stats.totalCompanies} 
          icon={<FiBriefcase size={24} />} 
          trend={`${stats.activeCompanies} activas`}
          color="text-gray-800"
        />

        {/* CARD: USUARIOS TOTALES */}
        <StatCard 
          label="Usuarios" 
          value={stats.totalUsers} 
          icon={<FiUsers size={24} />} 
          trend={`${stats.activeUsers} activos`}
          color="text-gray-800"
        />

        {/* CARD: TASA DE ACTIVIDAD (Empresas) */}
        <StatCard 
          label="Actividad Red" 
          value={`${((stats.activeCompanies / stats.totalCompanies) * 100 || 0).toFixed(0)}%`} 
          icon={<FiActivity size={24} />} 
          trend="Operativo"
          color="text-[#87be00]"
        />

        {/* CARD: USUARIOS ACTIVOS */}
        <StatCard 
          label="En Terreno" 
          value={stats.activeUsers} 
          icon={<FiActivity size={24} />} 
          trend="Real Time"
          color="text-[#87be00]"
        />
      </div>
    </div>
  )
}

// Componente Reutilizable para las tarjetas
const StatCard = ({ label, value, icon, trend, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-50 flex flex-col justify-between group hover:shadow-2xl transition-all h-full">
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{trend}</span>
    </div>
    
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-5xl font-black tracking-tighter italic leading-none ${color}`}>
        {value}
      </p>
    </div>
    <div className="mt-6 h-1 w-12 bg-gray-100 rounded-full" />
  </div>
)

export default Analytics;