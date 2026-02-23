const Sidebar = () => {
  return (
    <div className="w-64 bg-white shadow-md p-6 hidden md:block">
      <h2 className="text-xl font-bold text-[#87be00] mb-8">
        Root Panel
      </h2>

      <nav className="space-y-4 text-gray-600">
        <p className="hover:text-[#87be00] cursor-pointer">
          Dashboard
        </p>
        <p className="hover:text-[#87be00] cursor-pointer font-medium">
          Crear Admin Cliente
        </p>
        <p className="hover:text-[#87be00] cursor-pointer">
          Supervisores
        </p>
        <p className="hover:text-[#87be00] cursor-pointer">
          Usuarios
        </p>
      </nav>
    </div>
  )
}

export default Sidebar