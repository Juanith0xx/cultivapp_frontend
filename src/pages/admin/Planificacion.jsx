import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import AdminCalendarView from "../../components/AdminCalendarView";
import WeeklyStatus from "../../components/MiniCalendario";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiUploadCloud, FiRefreshCw, FiList, FiCalendar } from "react-icons/fi";
import * as XLSX from "xlsx";

const Planificacion = () => {
  const [viewMode, setViewMode] = useState("list");
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  /**
   * 🔄 Sincronización de datos con el Backend
   * 🚩 MEJORA: Validación de tipo de dato para evitar "Error de Sincronización"
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resRoutes, resUsers, resLocales, resCompanies] = await Promise.all([
        api.get("/routes"),
        api.get("/users"),
        api.get("/locales"),
        api.get("/companies")
      ]);

      // Tu apiClient devuelve directamente el body (data), 
      // pero forzamos validación de Array para seguridad absoluta
      setRoutes(Array.isArray(resRoutes) ? resRoutes : []);
      setUsers(Array.isArray(resUsers) ? resUsers : []);
      setLocales(Array.isArray(resLocales) ? resLocales : []);
      setCompanies(Array.isArray(resCompanies) ? resCompanies : []);

    } catch (error) {
      console.error("❌ Error en fetchData:", error);
      // Solo mostramos el toast si el error no es por estar offline (manejado por el apiClient)
      if (!error.offline) {
        toast.error("Error al sincronizar datos del servidor");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /**
   * 🚀 CARGA MASIVA SaaS DINÁMICA
   * 🚩 MEJORA: Envío envuelto en objeto 'routes' para compatibilidad con el Backend
   */
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const toastId = toast.loading("Analizando planilla...");

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertimos a JSON asegurando que capture encabezados
        const excelData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!excelData || excelData.length === 0) {
          toast.error("El archivo parece estar vacío", { id: toastId });
          return;
        }

        console.log("🔍 Filas detectadas antes de enviar:", excelData.length);
        toast.loading(`Enviando ${excelData.length} filas al servidor...`, { id: toastId });

        /**
         * Envolvemos en { routes: ... } porque el Backend actualizado busca req.body.routes
         */
        const response = await api.post("/routes/bulk-create", { routes: excelData });

        if (response.success) {
          toast.success(`¡Éxito! ${response.count} rutas planificadas`, { id: toastId });
          fetchData(); 
        } else {
          const errorMsg = response.errors && response.errors.length > 0 
            ? `${response.message} - ${response.errors[0]}` 
            : response.message;
          toast.error(errorMsg, { id: toastId, duration: 6000 });
        }
      } catch (err) {
        console.error("❌ Error en proceso frontend:", err);
        toast.error("Error al procesar el archivo Excel", { id: toastId });
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = ""; 
  };

  /**
   * 📋 LÓGICA DE AGRUPACIÓN PARA TABLA
   * 🚩 MEJORA: Filtrado estricto de nulos y duplicados
   */
  const groupedRoutes = useMemo(() => {
    const groups = {};
    routes.forEach((r) => {
      if (!r.user_id || !r.local_id) return;
      const key = `${r.user_id}-${r.local_id}`;
      if (!groups[key]) {
        groups[key] = { 
          ...r, 
          allDays: (r.day_of_week !== null && r.day_of_week !== undefined) ? [Number(r.day_of_week)] : [] 
        };
      } else if (r.day_of_week !== null && r.day_of_week !== undefined) {
        const dayNum = Number(r.day_of_week);
        if (!groups[key].allDays.includes(dayNum)) {
          groups[key].allDays.push(dayNum);
        }
      }
    });
    return Object.values(groups);
  }, [routes]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <FiRefreshCw className="animate-spin text-[#87be00]" size={42} />
      <p className="font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 italic text-center px-4">
        Sincronizando Ecosistema de Rutas...
      </p>
    </div>
  );

  return (
    <div className="p-8 font-[Outfit] space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-gray-900">
            Planificación <span className="text-[#87be00]">Mensual</span>
          </h1>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mt-4 w-fit border border-gray-200">
            <button 
              onClick={() => setViewMode("list")} 
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FiList /> Vista Lista
            </button>
            <button 
              onClick={() => setViewMode("calendar")} 
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FiCalendar /> Calendario
            </button>
          </div>
        </div>
        
        <div className="flex gap-4">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
          <button 
            onClick={() => fileInputRef.current.click()} 
            className="bg-[#87be00] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#87be00]/20 flex items-center gap-3 hover:bg-black transition-all active:scale-95"
          >
            <FiUploadCloud size={18} /> Carga Masiva
          </button>
          <button 
            onClick={() => { setSelectedRoute(null); setIsModalOpen(true); }} 
            className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 hover:bg-[#87be00] transition-all active:scale-95"
          >
            <FiPlus size={18} /> Nueva Visita
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-6 duration-500">
          <table className="w-full text-left">
              <thead>
                  <tr className="bg-gray-50/50">
                    <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">Local / Cadena</th>
                    <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">Mercaderista</th>
                    <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 text-center">Gestión</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {groupedRoutes.length > 0 ? groupedRoutes.map((row) => (
                  <tr key={`${row.user_id}-${row.local_id}`} className="hover:bg-gray-50/50 transition-all group">
                      <td className="p-8">
                        <p className="font-black text-sm uppercase text-gray-900 tracking-tighter">{row.cadena || 'Sin Local'}</p>
                        <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-tighter">
                          {row.codigo_local || row.center_code || 'S/C'}
                        </p>
                      </td>
                      <td className="p-8">
                        <p className="font-bold text-sm text-gray-700">{row.first_name} {row.last_name}</p>
                        <div className="mt-2 flex items-center gap-3">
                           <WeeklyStatus activeDays={row.allDays} />
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <button 
                          onClick={() => { setSelectedRoute({...row, selectedDays: row.allDays}); setIsModalOpen(true); }} 
                          className="p-4 bg-gray-50 rounded-2xl text-gray-300 group-hover:bg-black group-hover:text-[#87be00] transition-all shadow-sm active:scale-90"
                        >
                            <FiEdit2 size={16} />
                        </button>
                      </td>
                  </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="p-32 text-center text-gray-300 font-black uppercase italic text-[11px] tracking-widest">
                         No hay planificación disponible para mostrar
                      </td>
                    </tr>
                  )}
              </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <AdminCalendarView />
        </div>
      )}

      <ManageRoutesModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        users={users} locales={locales} companies={companies}
        initialData={selectedRoute} onCreated={fetchData}
      />
    </div>
  );
};

export default Planificacion;