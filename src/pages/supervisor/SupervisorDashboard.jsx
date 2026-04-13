import { Outlet } from "react-router-dom"
import SupervisorSidebar from "../supervisor/SuperviorSidebar"
import Notifications from "../../components/Notifications"
import { useAuth } from "../../context/AuthContext"

const SupervisorDashboard = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-[Outfit]">
      <SupervisorSidebar />

      <div className="flex-1 p-6 md:p-10 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER SUPERVISOR */}
        <div className="flex justify-between items-center mb-8 shrink-0 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50">
          <div className="flex items-center gap-4 pl-4">
            <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-[#87be00] font-black text-xs">
              {user?.first_name?.substring(0, 1)}{user?.last_name?.substring(0, 1)}
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-900 uppercase italic leading-none">Supervisor</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Control Terreno</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Notifications />
            <div className="h-8 w-[1px] bg-gray-100"></div>
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-gray-900 uppercase italic">{user?.company_name}</p>
              <p className="text-[8px] font-bold text-[#87be00] uppercase tracking-widest">Socio Estratégico</p>
            </div>
          </div>
        </div>

        {/* CONTENIDO DINÁMICO */}
        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-[2.5rem] bg-white shadow-sm border border-gray-50 p-6 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default SupervisorDashboard