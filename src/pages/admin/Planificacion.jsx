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
} from "react-icons/fi";
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

      setRoutes(resRoutes.data || []);
      setUsers(resUsers.data || []);
      setLocales(resLocales.data || []);
      setCompanies(resCompanies.data || []);
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
    const toastId = toast.loading("Procesando Excel...");

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);

        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const rawJson = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
        });

        console.log("📦 RAW JSON:", rawJson);

        const finalData = rawJson
          .map((row) => ({
            Rut_Mercaderista: String(
              row["Rut_Mercaderista"] || row["rut_mercaderista"] || ""
            )
              .trim()
              .toUpperCase(),

            Codigo: String(
              row["Codigo"] || row["codigo"] || ""
            ).trim(),

            "Turno Semana 1": String(
              row["Turno Semana 1"] || row["turno semana 1"] || ""
            ).trim(),

            "Turno Semana 2": String(
              row["Turno Semana 2"] || row["turno semana 2"] || ""
            ).trim(),

            "Turno Semana 3": String(
              row["Turno Semana 3"] || row["turno semana 3"] || ""
            ).trim(),

            "Turno Semana 4": String(
              row["Turno Semana 4"] || row["turno semana 4"] || ""
            ).trim(),
          }))
          .filter(
            (row) =>
              row.Rut_Mercaderista &&
              row.Codigo
          );

        console.log("✅ FINAL DATA:", finalData);

        if (!finalData.length) {
          toast.error("No se encontraron filas válidas en el Excel", {
            id: toastId,
          });
          return;
        }

        const today = new Date();

        const payload = {
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          routes: finalData,
        };

        console.log("🚀 PAYLOAD:", payload);

        const response = await api.post("/routes/bulk-create", payload);

        const resData = response.data;

        console.log("📥 RESPUESTA BACKEND:", resData);

        if (resData.success) {
          toast.success(
            `Éxito: ${resData.count} visitas creadas`,
            { id: toastId }
          );

          fetchData();
        } else {
          toast.error(
            resData.message || "Error en carga masiva",
            { id: toastId }
          );
        }
      } catch (err) {
        console.error("❌ ERROR IMPORTANDO EXCEL:", err);

        toast.error(
          err.response?.data?.message ||
            "No se pudo procesar el Excel",
          { id: toastId }
        );
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

        key = [
          r.user_id,
          r.local_id,
          date.getFullYear(),
          date.getMonth(),
          getWeekOfMonth(r.visit_date),
        ].join("-");
      } else {
        key = `${r.user_id}-${r.local_id}-${r.schedule_group_id || "weekly"}`;
      }

      if (!groups[key]) {
        groups[key] = {
          ...r,
          allDays:
            r.day_of_week !== null &&
            r.day_of_week !== undefined
              ? [Number(r.day_of_week)]
              : [],
          groupedVisits: [],
        };
      }

      if (
        r.day_of_week !== null &&
        r.day_of_week !== undefined &&
        !groups[key].allDays.includes(Number(r.day_of_week))
      ) {
        groups[key].allDays.push(Number(r.day_of_week));
      }

      if (r.visit_date) {
        groups[key].groupedVisits.push(r.visit_date);
      }
    });

    return Object.values(groups);
  }, [routes]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <FiRefreshCw className="animate-spin text-[#87be00]" size={42} />
        <p>Sincronizando Planificación...</p>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xlsx, .xls"
        onChange={handleImportExcel}
      />

      <button onClick={() => fileInputRef.current.click()}>
        Importar Excel
      </button>
    </div>
  );
};

export default Planificacion;