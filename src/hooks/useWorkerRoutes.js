import { useState, useEffect, useCallback } from 'react';
import api from '../api/apiClient'; // Ajusta la ruta según tu carpeta

export const useWorkerRoutes = (userId) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoutes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Endpoint que configuramos en el backend de Linux
      const data = await api.get(`/routes/user/${userId}`);
      setRoutes(data);
      setError(null);
    } catch (err) {
      console.error("❌ Error cargando rutas:", err);
      setError("No se pudieron cargar las rutas.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return { routes, loading, error, refetch: fetchRoutes };
};