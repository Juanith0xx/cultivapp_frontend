import { NavLink } from "react-router-dom"

const AdminSidebar = () => {
  return (
    <div className="w-64 bg-white shadow-md p-6">

      <h2 className="text-xl font-bold mb-8 text-green-600">
        Admin Panel
      </h2>

      <nav className="space-y-4 text-gray-600">

        <NavLink
          to="/admin"
          end
          className="block hover:text-green-600"
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/users"
          className="block hover:text-green-600"
        >
          Usuarios
        </NavLink>

      </nav>
    </div>
  )
}

export default AdminSidebar