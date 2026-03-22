import { useState } from "react";
import api from "../../api/apiClient";
import Scanner from "./Scanner"; // El componente que maneja html5-qrcode
import toast from "react-hot-toast";
import { FiPackage, FiCamera, FiCheck, FiX, FiHash } from "react-icons/fi";

const ProductReplenishment = ({ routeId }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Al detectar el código, buscamos en el maestro de productos
  const handleScanSuccess = async (barcode) => {
    setShowScanner(false);
    try {
      const res = await api.get(`/api/products/scan/${barcode}`);
      setProduct(res.data);
      toast.success("Producto identificado");
    } catch (err) {
      toast.error("El producto no existe en el sistema");
    }
  };

  // 2. Guardamos la reposición en la base de datos
  const handleSave = async () => {
    if (!quantity || quantity <= 0) return toast.error("Ingresa una cantidad");
    
    setLoading(true);
    try {
      await api.post("/api/routes/replenish", {
        route_id: routeId,
        product_id: product.id,
        quantity_added: parseInt(quantity)
      });
      toast.success("Reposición guardada con éxito");
      // Reset para el siguiente producto
      setProduct(null);
      setQuantity("");
    } catch (err) {
      toast.error("Error al guardar registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow font-[Outfit] space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">
          Reponer Góndola
        </h2>
        <FiPackage className="text-[#87be00]" size={24} />
      </div>

      {!product && !showScanner && (
        <button
          onClick={() => setShowScanner(true)}
          className="w-full py-12 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-[#87be00] hover:text-[#87be00] transition-all group"
        >
          <div className="p-4 bg-gray-50 rounded-full group-hover:bg-[#87be00]/10 transition-colors">
            <FiCamera size={32} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em]">Presiona para escanear</span>
        </button>
      )}

      {showScanner && (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-square md:aspect-video">
          <Scanner onScanSuccess={handleScanSuccess} />
          <button 
            onClick={() => setShowScanner(false)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-full text-[10px] font-black uppercase border border-white/30"
          >
            Cancelar
          </button>
        </div>
      )}

      {product && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* INFO PRODUCTO */}
          <div className="bg-[#87be00]/5 border border-[#87be00]/20 p-4 rounded-xl mb-4 flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-[#87be00] uppercase tracking-widest">Producto Detectado</p>
              <h3 className="text-lg font-black text-gray-800 uppercase">{product.name}</h3>
              <p className="text-xs text-gray-400 font-bold tracking-tighter">EAN: {product.barcode}</p>
            </div>
            <button onClick={() => setProduct(null)} className="text-gray-300 hover:text-red-500 transition-colors">
              <FiX size={20} />
            </button>
          </div>

          {/* INPUT CANTIDAD */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
                <FiHash size={14} /> Cantidad Repuesta
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej: 12"
                className="w-full bg-gray-50 border-none rounded-xl p-5 text-2xl font-black text-gray-800 focus:ring-2 focus:ring-[#87be00] transition-all"
                autoFocus
              />
            </div>

            <button
              onClick={handleSave}
              disabled={loading || !quantity}
              className="w-full bg-[#87be00] text-white py-5 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#87be00]/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <FiCheck size={20} />
              {loading ? "Guardando..." : "Confirmar Carga"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReplenishment;