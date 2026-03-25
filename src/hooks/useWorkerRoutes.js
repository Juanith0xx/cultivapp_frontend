import { useState, useEffect, useCallback } from 'react';
import api from '../api/apiClient';

export const useWorkerRoutes = (userId) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoutes = useCallback(async () => {
    if (!userId) return;
    
    // Solo ponemos loading true la primera vez para evitar parpadeos molestos
    // si ya tenemos datos (ideal para el mutate)
    if (routes.length === 0) setLoading(true);

    try {
      // 🚩 CORRECCIÓN 1: Quitamos el /api inicial porque el backend/client ya lo tienen
      // 🚩 CORRECCIÓN 2: Usamos desestructuración { data } para obtener el array real de Axios
      //const response = await api.get(`/routes/user/${userId}`);
      const data = await api.get(`/routes/user/${userId}`);
      // Validamos que lo que llegue sea un array
      //const routesData = Array.isArray(response.data) ? response.data : (response.data.routes || []);
      const routesData = Array.isArray(data) ? data : (data.routes || []);
      
      console.log("✅ Rutas actualizadas en el Hook:", routesData);
      setRoutes(routesData);
      setError(null);
    } catch (err) {
      console.error("❌ Error cargando rutas:", err);
      setError("No se pudieron cargar las rutas.");
    } finally {
      setLoading(false);
    }
  }, [userId, routes.length]); // Añadimos dependencia para control de carga

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return { 
    routes, 
    loading, 
    error, 
    // 🚩 Forzamos a que mutate sea una función que siempre devuelva la data fresca
    mutate: fetchRoutes 
  };
};