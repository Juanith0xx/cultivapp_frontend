import { useState, useEffect, useRef } from "react";
import api from "../api/apiClient";
import ManageRoutesModal from "./ManageRoutesModal";
import AdminCalendarView from "./AdminCalendarView";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiUploadCloud } from "react-icons/fi";
import * as XLSX from "xlsx"; // Asegúrate de tener esto

const Planificacion = () => {
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locales, setLocales] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRoutes, resUsers, resLocales, resCompanies] = await Promise.all([
        api.get("/routes"),
        api.get("/users"),
        api.get("/locales"),
        api.get("/companies")
      ]);
      setRoutes(resRoutes);
      setUsers(resUsers);
      setLocales(resLocales);
      setCompanies(resCompanies);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FUNCIÓN DE CARGA MASIVA DIRECTA ---
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        toast.loading("Procesando Excel...", { id: "import" });
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(ws);

        const diasMap = [
          { key: "lunes", val: 1 }, { key: "martes", val: 2 },
          { key: "miercoles", val: 3 }, { key: "jueves", val: 4 },
          { key: "viernes", val: 5 }, { key: "sabadodomingo", val: 6 }
        ];

        const routesToUpload = [];
        excelData.forEach(row => {
          const rut = row["Rut 2"];
          const centerCode = row["center_code"];
          if (!rut || rut === "#VALUE!") return;
          diasMap.forEach(dia => {
            if (row[dia.key] && parseFloat(row[dia.key]) > 0) {
              routesToUpload.push({
                rut_mercaderista: String(rut).trim(),
                codigo_local: String(centerCode).trim(),
                day_of_week: dia.val,
                start_time: "08:00",
                end_time: "16:00"
              });
            }
          });
        });

        await api.post("/routes/bulk-create", { routes: routesToUpload });
        toast.success(`¡Éxito! Cargadas ${routesToUpload.length} visitas`, { id: "import" });
        fetchData(); // Recargar tabla
      } catch (err) {
        toast.error("Error al procesar el Excel", { id: "import" });
      }
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <div className="p-10 text-center font-black">Cargando...</div>;

  return (
    <div className="p-8 font-[Outfit] space-y-10">
      
      {/* HEADER CON LOS DOS BOTONES */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Planificación</h1>
          <p className="text-[#87be00] text-xs font-bold uppercase tracking-widest mt-1">Carga Masiva y Gestión</p>
        </div>
        
        <div className="flex gap-4">
          {/* BOTÓN 1: EXCEL (NUEVO) */}
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
          <button 
            onClick={() => fileInputRef.current.click()}
            className="bg-[#87be00] text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-[#87be00]/20 flex items-center gap-2 hover:scale-105 transition-all"
          >
            <FiUploadCloud size={16} /> Importar Excel
          </button>

          {/* BOTÓN 2: MANUAL */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg flex items-center gap-2 hover:scale-105 transition-all"
          >
            <FiPlus size={16} /> Nueva Visita
          </button>
        </div>
      </div>

      {/* CALENDARIO VISUAL */}
      <AdminCalendarView onSelectDate={() => {}} />

      {/* TABLA DE RUTAS */}
      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-50">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Local / Cadena</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Mercaderista</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {routes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-black text-sm uppercase">{route.cadena}</td>
                    <td className="p-6 font-bold text-sm text-gray-600">{route.first_name} {route.last_name}</td>
                    <td className="p-6 text-center">
                    <button onClick={() => { setSelectedRoute(route); setIsModalOpen(true); }} className="p-3 bg-gray-100 rounded-xl text-gray-400 hover:bg-black hover:text-white transition-all">
                        <FiEdit2 size={14} />
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
      </div>

      <ManageRoutesModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        users={users} locales={locales} companies={companies}
        initialData={selectedRoute} onCreated={fetchData}
      />
    </div>
  );
};

export default Planificacion;