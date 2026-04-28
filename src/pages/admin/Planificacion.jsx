import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../../api/apiClient";
import ManageRoutesModal from "../../components/ManageRoutesModal";
import AdminCalendarView from "../../components/AdminCalendarView";
import WeeklyStatus from "../../components/MiniCalendario";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEdit2,
  FiUploadCloud,
  FiRefreshCw,
  FiList,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiLayers,
  FiSearch
} from "react-icons/fi";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [resRoutes, resUsers, resLocales, resCompanies] =
        await Promise.all([
          api.get("/routes"),
          api.get("/users"),
          api.get("/locales"),
          api.get("/companies"),
        ]);

      setRoutes(Array.isArray(resRoutes) ? resRoutes : []);
      setUsers(Array.isArray(resUsers) ? resUsers : []);
      setLocales(Array.isArray(resLocales) ? resLocales : []);
      setCompanies(Array.isArray(resCompanies) ? resCompanies : []);
    } catch (error) {
      console.error("❌ Error en fetchData:", error);
      if (!error.offline) toast.error("Error al sincronizar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getWeekOfMonth = (dateStr) => {
    const date = new Date(dateStr);
    return Math.ceil(date.getDate() / 7);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const toastId = toast.loading("Analizando estructura del archivo...");

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });

        const headerRowIndex = rows.findIndex((row) =>
          row.some((cell) => {
            const c = String(cell).toLowerCase().trim();
            return (
              c.includes("rut") ||
              c.includes("codigo") ||
              c.includes("turno")
            );
          })
        );

        if (headerRowIndex === -1) {
          toast.error("No se encontraron encabezados válidos", { id: toastId });
          return;
        }

        const rawJson = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          defval: "",
        });

        const finalData = rawJson
          .map((row) => {
            const newRow = {};
            Object.keys(row).forEach((key) => {
              const cleanKey = key.trim().toLowerCase();
              const value = String(row[key]).trim();
              if (cleanKey.includes("rut")) newRow.Rut_Mercaderista = value;
              else if (cleanKey.includes("cod")) newRow.Codigo = value;
              else if (cleanKey.includes("turno") && cleanKey.includes("semana")) newRow[key.trim()] = value;
            });
            return newRow;
          })
          .filter((f) => f.Rut_Mercaderista && f.Codigo);

        const today = new Date();
        const payload = {
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          routes: finalData,
        };

        const response = await api.post("/routes/bulk-create", payload);

        if (response.success) {
          toast.success(`Éxito: ${response.count} visitas creadas`, { id: toastId });
          fetchData();
        } else {
          toast.error(response.message || "Error en carga masiva", { id: toastId });
        }
      } catch (err) {
        toast.error("No se pudo procesar el Excel", { id: toastId });
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const groupedRoutes = useMemo(() => {
    const groups = {};
    routes.forEach((r) => {
      if (!r.user_id || !r.local_id) return;
      let key;
      if (r.visit_date) {
        const date = new Date(r.visit_date);
        key = [r.user_id, r.local_id, date.getFullYear(), date.getMonth(), getWeekOfMonth(r.visit_date)].join("-");
      } else {
        key = `${r.user_id}-${r.local_id}-${r.schedule_group_id || "weekly"}`;
      }

      if (!groups[key]) {
        groups[key] = {
          ...r,
          allDays: r.day_of_week !== null && r.day_of_week !== undefined ? [Number(r.day_of_week)] : [],
          groupedVisits: [],
        };
      }
      if (r.day_of_week !== null && r.day_of_week !== undefined && !groups[key].allDays.includes(Number(r.day_of_week))) {
        groups[key].allDays.push(Number(r.day_of_week));
      }
      if (r.visit_date) groups[key].groupedVisits.push(r.visit_date);
    });
    return Object.values(groups);
  }, [routes]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <FiRefreshCw className="animate-spin text-[#87be00]" size={42} />
        <p className="font-[Outfit] font-black uppercase italic text-gray-400 tracking-widest text-xs">Sincronizando Planificación...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 font-[Outfit] pb-20 px-2 sm:px-0">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />

      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Gestión de Rutas</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2 italic">
            <span className="w-2 h-2 bg-[#87be00] rounded-full animate-pulse"></span>
            Planificación Mensual Operativa
          </p>
        </div>

        {/* ACCIONES DEL HEADER (Se adaptan a móvil) */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex-1 sm:flex-none">
            <button 
              onClick={() => setViewMode("list")} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-black text-[#87be00]' : 'text-gray-400'}`}
            >
              <FiList /> <span className="hidden xs:inline">Lista</span>
            </button>
            <button 
              onClick={() => setViewMode("calendar")} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-black text-[#87be00]' : 'text-gray-400'}`}
            >
              <FiCalendar /> <span className="hidden xs:inline">Calendario</span>
            </button>
          </div>

          <button 
            onClick={() => fileInputRef.current.click()}
            className="flex-1 sm:flex-none bg-white border border-gray-100 text-gray-900 px-5 py-3 rounded-xl shadow-sm text-[10px] font-black uppercase italic flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
          >
            <FiUploadCloud size={16} /> <span className="hidden sm:inline">Carga Masiva</span>
          </button>

          <button 
            onClick={() => { setSelectedRoute(null); setIsModalOpen(true); }}
            className="flex-1 sm:flex-none bg-[#87be00] text-white px-5 py-3 rounded-xl shadow-lg shadow-[#87be00]/20 text-[10px] font-black uppercase italic flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <FiPlus size={16} /> Nueva Ruta
          </button>
        </div>
      </div>

      {/* CONTENIDO SEGÚN VISTA */}
      {viewMode === "calendar" ? (
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-sm border border-gray-50 overflow-hidden">
          <AdminCalendarView routes={routes} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 🚩 VISTA MÓVIL: CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden px-2">
            {groupedRoutes.map((route, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                key={idx}
                className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-900"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <FiUser size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-gray-900 uppercase truncate">
                        {users.find(u => u.id === route.user_id)?.first_name} {users.find(u => u.id === route.user_id)?.last_name}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Reponedor Asignado</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedRoute(route); setIsModalOpen(true); }}
                    className="p-2 bg-[#87be00]/10 text-[#87be00] rounded-lg active:scale-90 transition-all"
                  >
                    <FiEdit2 size={14} />
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <FiMapPin className="text-gray-400 mt-1 shrink-0" size={12} />
                    <p className="text-[10px] font-black text-gray-800 leading-tight uppercase">
                      {locales.find(l => l.id === route.local_id)?.cadena} - {locales.find(l => l.id === route.local_id)?.direccion}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiLayers className="text-gray-400 shrink-0" size={12} />
                    <p className="text-[9px] font-black text-[#87be00] uppercase italic">
                      {route.nombre_turno || 'Visita Individual'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Frecuencia de Visita</p>
                  <WeeklyStatus 
                    allDays={route.allDays} 
                    isManual={route.origin === 'INDIVIDUAL'} 
                    groupedVisits={route.groupedVisits} 
                    selectedDate={route.visit_date}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* 🚩 VISTA DESKTOP: TABLA */}
          <div className="hidden md:block bg-white rounded-[3rem] shadow-sm border border-gray-50 overflow-hidden mx-2 lg:mx-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest italic">Reponedor</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest italic">Local / Punto de Venta</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest italic text-center">Planificación</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest italic text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {groupedRoutes.map((route, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#87be00]/10 flex items-center justify-center text-[#87be00] font-black text-[10px]">
                            {users.find(u => u.id === route.user_id)?.first_name?.[0]}
                            {users.find(u => u.id === route.user_id)?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 uppercase">
                              {users.find(u => u.id === route.user_id)?.first_name} {users.find(u => u.id === route.user_id)?.last_name}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">#{route.user_id.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-gray-800 uppercase leading-none">
                          {locales.find(l => l.id === route.local_id)?.cadena}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 truncate max-w-xs">
                          {locales.find(l => l.id === route.local_id)?.direccion}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-[9px] font-black text-[#87be00] uppercase italic">{route.nombre_turno || 'Individual'}</span>
                          <WeeklyStatus 
                            allDays={route.allDays} 
                            isManual={route.origin === 'INDIVIDUAL'} 
                            groupedVisits={route.groupedVisits} 
                            selectedDate={route.visit_date}
                          />
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => { setSelectedRoute(route); setIsModalOpen(true); }}
                          className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl hover:bg-black hover:text-[#87be00] transition-all flex items-center justify-center ml-auto"
                        >
                          <FiEdit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTIÓN */}
      {isModalOpen && (
        <ManageRoutesModal 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedRoute(null); }}
          initialData={selectedRoute}
          users={users}
          locales={locales}
          companies={companies}
          onCreated={fetchData}
        />
      )}
    </div>
  );
};

export default Planificacion;