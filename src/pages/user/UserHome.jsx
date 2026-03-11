import { FiMapPin, FiClipboard, FiCheckCircle, FiClock } from "react-icons/fi"

const UserWidgets = ({ stats = {} }) => {
  // Definimos los widgets con seguridad ante datos undefined o null
  const widgets = [
    {
      label: "Mis Locales",
      value: stats?.locales ?? 0,
      icon: <FiMapPin size={18} />,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Rutas asignadas",
      value: stats?.routes ?? 0,
      icon: <FiClipboard size={18} />,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      label: "Completadas",
      value: stats?.completed ?? 0,
      icon: <FiCheckCircle size={18} />,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      label: "Pendientes",
      value: stats?.pending ?? 0,
      icon: <FiClock size={18} />,
      color: "text-orange-600",
      bg: "bg-orange-50"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {widgets.map((w, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {w.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {w.value}
            </p>
          </div>

          <div className={`p-3 rounded-xl ${w.bg} ${w.color}`}>
            {w.icon}
          </div>
        </div>
      ))}
    </div>
  )
}

export default UserWidgets