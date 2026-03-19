import { useState } from "react";
import { FiUploadCloud, FiFileText, FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import api from "../../api/apiClient";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const BulkLocalesModal = ({ isOpen, onClose, onRefresh }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Selecciona un archivo primero");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setResults(null);
      
      // Enviamos el archivo al endpoint de Multer en el backend
      const response = await api.post("/locales/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResults(response);
      toast.success("Proceso finalizado");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error en la carga");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Carga Masiva de Locales</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors"><FiXCircle size={24}/></button>
        </div>

        {!results ? (
          <div className="space-y-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
              Sube tu archivo Excel (.xlsx). El sistema buscará automáticamente las coordenadas en Mapbox según la dirección y comuna.
            </p>

            {/* ZONA DE CARGA */}
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-[2rem] cursor-pointer hover:bg-gray-50 hover:border-[#87be00] transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUploadCloud size={40} className="text-gray-300 group-hover:text-[#87be00] mb-3 transition-colors" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-tighter">
                  {file ? file.name : "Haz clic para seleccionar archivo"}
                </p>
              </div>
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} disabled={loading} />
            </label>

            {/* BOTÓN ACCIÓN */}
            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className="w-full bg-black text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? (
                <> <FiLoader className="animate-spin" size={18} /> Procesando y Geolocalizando... </>
              ) : (
                "Comenzar Importación"
              )}
            </button>
          </div>
        ) : (
          /* RESULTADOS POST-CARGA */
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center">
                <span className="block text-2xl font-black text-green-600">{results.inserted}</span>
                <span className="text-[9px] font-black uppercase text-green-400 tracking-widest">Éxito</span>
              </div>
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center">
                <span className="block text-2xl font-black text-red-600">{results.failed}</span>
                <span className="text-[9px] font-black uppercase text-red-400 tracking-widest">Errores</span>
              </div>
            </div>

            {results.details?.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {results.details.map((err, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                    <FiAlertCircle className="text-red-400" size={14}/>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Local {err.codigo}: {err.error}</p>
                  </div>
                ))}
              </div>
            )}

            <button onClick={onClose} className="w-full border-2 border-gray-100 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">
              Cerrar Resumen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkLocalesModal;