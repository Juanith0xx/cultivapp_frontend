import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  FiPlus, FiRefreshCw, FiEdit3, FiCalendar, FiList, FiClock, 
  FiCheckCircle, FiAlertCircle, FiXCircle, FiPlayCircle, FiBriefcase,
  FiUploadCloud, FiHash, FiUser 
} from "react-icons/fi";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const WeeklyStatus = ({ activeDays = [] }) => {
  const days = [
    { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
    { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' },
  ];
  const normalized = useMemo(() => {
    const unique = [...new Set((Array.isArray(activeDays) ? activeDays : []).map(d => parseInt(d, 10)))];
    return unique.filter(d => !isNaN(d));
  }, [activeDays]);

  return (
    <div className="flex gap-1.5 mt-1">
      {days.map((d) => (
        <div key={d.id} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border transition-all ${normalized.includes(d.id) ? "bg-[#87be00] border-[#87be00] text-white shadow-sm scale-110" : "bg-gray-50 border-gray-100 text-gray-200"}`}>{d.label}</div>
      ))}
    </div>
  );
};

const AdminRoutes = () => {
  const context = useOutletContext();
  const globalSelectedCompany = context?.selectedCompany || "";
  const fileInputRef = useRef(null);

  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [companies, setCompanies] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [routesRes, usersRes, localesRes] = await Promise.all([
        api.get("/routes"), 
        api.get("/users"), 
        api.get("/locales")
      ]);
      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : routesRes || []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes || []);
      setLocales(Array.isArray(localesRes.data) ? localesRes.data : localesRes || []);
      try {
        const companiesRes = await api.get("/companies");
        setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : companiesRes || []);
      } catch (err) { setCompanies([]); }
    } catch (error) {
      toast.error("Error al sincronizar datos");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const toastId = toast.loading("Procesando carga masiva...");
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(ws);
        
        const cleanRut = (r) => r?.toString().toLowerCase().replace(/[^0-9k]/g, "") || "";
        const routesToUpload = [];

        excelData.forEach((row) => {
          const rutExcel = row["Rut_Mercaderista"];
          const codigoLocalExcel = row["Codigo "];
          const tipoTurnoExcel = row["Tipo de Turno"]?.toString().trim().toUpperCase();
          let fechaRaw = row["Fecha"];
          let baseDate = (fechaRaw instanceof Date && !isNaN(fechaRaw)) ? fechaRaw : new Date(fechaRaw + "T12:00:00");

          const foundUser = users.find(u => cleanRut(u.rut) === cleanRut(rutExcel));
          const foundLocal = locales.find(l => l.codigo_local?.toString().trim() === codigoLocalExcel?.toString().trim());

          if (foundUser && foundLocal) {
            const crearRuta = (dateObj) => ({
              user_id: foundUser.id,
              local_id: foundLocal.id,
              Rol: row["Rol"],
              Tipo_de_Turno: tipoTurnoExcel,
              Fecha: dateObj.toISOString().split('T')[0]
            });

            if (tipoTurnoExcel === "TURNO A1") [0, 3, 4].forEach(off => { const d = new Date(baseDate); d.setDate(baseDate.getDate() + off); routesToUpload.push(crearRuta(d)); });
            else if (tipoTurnoExcel === "TURNO A2") [1, 2, 5].forEach(off => { const d = new Date(baseDate); d.setDate(baseDate.getDate() + off); routesToUpload.push(crearRuta(d)); });
            else if (tipoTurnoExcel === "TURNO A") [0, 2, 4].forEach(off => { const d = new Date(baseDate); d.setDate(baseDate.getDate() + off); routesToUpload.push(crearRuta(d)); });
            else routesToUpload.push(crearRuta(baseDate));
          }
        });

        await api.post("/routes/bulk-create", routesToUpload);
        toast.success("Carga completada", { id: toastId });
        fetchData();
      } catch (err) { toast.error("Error: " + err.message, { id: toastId }); }
    };
    reader.readAsBinaryString(file);
  };

  const groupedRoutes = useMemo(() => {
    if (!Array.isArray(routes)) return [];
    
    const filteredRoutes = globalSelectedCompany 
      ? routes.filter(r => String(r.company_id) === String(globalSelectedCompany))
      : routes;

    const groups = {};
    
    filteredRoutes.forEach(r => {
      const identifier = r.origin === 'TURNO' 
        ? `GRP-${r.schedule_group_id}` 
        : `IND-${r.id}`;
        
      const key = `${r.user_id}-${r.local_id}-${identifier}`;
      
      if (!groups[key]) {
        groups[key] = { 
          ...r, 
          days_array: r.day_of_week !== null ? [parseInt(r.day_of_week, 10)] : [], 
          all_statuses: [r.status]
        };
      } else {
        const d = parseInt(r.day_of_week, 10);
        if (!groups[key].days_array.includes(d)) groups[key].days_array.push(d);
        groups[key].all_statuses.push(r.status);
      }
    });

    return Object.values(groups).map(group => ({
      ...group,
      displayStatus: group.all_statuses.includes('IN_PROGRESS') ? 'IN_PROGRESS' : 
                     group.all_statuses.every(s => s === 'COMPLETED' || s === 'OK') ? 'COMPLETED' : 
                     group.all_statuses.some(s => s === 'COMPLETED' || s === 'OK') ? 'PARTIAL' : 'PENDING'
    }));
  }, [routes, globalSelectedCompany]);

  const getStatusBadge = (status) => {
    const config = {
      COMPLETED: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: <FiCheckCircle/>, label: 'Completado' },
      IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: <FiPlayCircle className="animate-pulse"/>, label: 'En Curso' },
      PARTIAL: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', icon: <FiRefreshCw/>, label: 'Parcial' },
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-200', icon: <FiAlertCircle/>, label: 'Pendiente' }
    };
    const s = config[status?.toUpperCase()] || { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', icon: <FiXCircle/>, label: 'Pendiente' };
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${s.bg} ${s.text} text-[8px] font-black uppercase tracking-widest border ${s.border} shadow-sm`}>
        {s.icon} {s.label}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-6 font-[Outfit]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight italic leading-none">Planificación de Rutas</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={fetchData} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-[#87be00] transition-all"><FiRefreshCw className={loading ? "animate-spin" : ""}/></button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
          <button onClick={() => fileInputRef.current.click()} className="bg-[#87be00] text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 transition-all"><FiUploadCloud size={16}/> Importar Excel</button>
          <button onClick={() => { setSelectedRoute(null); setIsModalOpen(true); }} className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-all"><FiPlus size={16}/> Nueva Visita</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Punto de Venta / Código</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Mercaderista / Turno</th>
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Frecuencia Semanal</th>
                <th className="p-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                <th className="p-6 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
              {loading ? (
                 <tr><td colSpan="5" className="p-20 text-center text-[10px] font-black text-gray-300 uppercase animate-pulse">Sincronizando...</td></tr>
              ) : groupedRoutes.map((r) => (
                <tr 
                   key={`${r.id}-${r.origin}-${r.schedule_group_id || 'manual'}`} 
                   className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 bg-gray-50 text-gray-400 rounded-lg"><FiHash size={14}/></div>
                      <div>
                        <p className="font-black text-gray-800 uppercase italic leading-none">{r.cadena}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{r.direccion}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-900 text-white text-[8px] font-black rounded-md">{r.codigo_local || 'S/C'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-2">
                        <p className="font-black text-gray-700 uppercase flex items-center gap-2 leading-none">
                          <FiUser size={14} className="text-[#87be00]"/> {r.first_name} {r.last_name}
                        </p>
                        <div className="flex flex-col gap-1.5">
                           {/* 🚩 ETIQUETA DE ROL */}
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight italic">
                             {r.user_role || 'Rol no definido'}
                           </span>
                           {/* 🚩 ETIQUETA DE TURNO */}
                           <span className={`w-fit px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${r.origin === 'INDIVIDUAL' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}>
                             {r.origin === 'INDIVIDUAL' ? 'Agendamiento Manual' : (r.nombre_turno || 'Turno Planificado')}
                           </span>
                        </div>
                    </div>
                  </td>
                  <td className="p-6"><WeeklyStatus activeDays={r.days_array} /></td>
                  <td className="p-6 text-center">{getStatusBadge(r.displayStatus)}</td>
                  <td className="p-6 text-right">
                    <button onClick={() => { setSelectedRoute({ ...r, selectedDays: r.days_array }); setIsModalOpen(true); }} className="p-3 bg-gray-50 text-gray-400 hover:bg-[#87be00] hover:text-white rounded-xl transition-all shadow-sm">
                      <FiEdit3 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ManageRoutesModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedRoute(null); }} users={users} locales={locales} companies={companies} onCreated={fetchData} initialData={selectedRoute} />
    </div>
  );
};

export default AdminRoutes;