import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import CreateAdminClient from "../pages/CreateAdminCliente"

const RootDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />
        
        <div className="p-8">
          <CreateAdminClient />
        </div>
      </div>

    </div>
  )
}

export default RootDashboard