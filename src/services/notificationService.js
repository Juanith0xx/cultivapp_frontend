import api from '../api/apiClient';

/**
 * SERVICIO DE NOTIFICACIONES - CULTIVAPP
 * Quitamos el .data porque el apiClient ya entrega el JSON directamente.
 */

// 🔔 Obtener historial
export const getMyNotifications = () => 
  api.get('/notifications'); 

// ✅ Marcar una alerta específica como leída
export const markAsRead = (id) => 
  api.put(`/notifications/${id}/read`);

// 🗑️ Eliminar notificación
export const deleteNotification = (id) => 
  api.delete(`/notifications/${id}`);

// 🚀 Envío Masivo
export const sendBulk = (data) => 
  api.post('/notifications/send-bulk', data);

// 📌 Marcar todas como leídas
export const markAllAsRead = () => 
  api.put('/notifications/read-all');