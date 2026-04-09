import api from '../api/apiClient';
 
/**
 * SERVICIO DE NOTIFICACIONES - CULTIVAPP
 */
 
// 🔔 Obtener mis notificaciones recibidas
export const getMyNotifications = () =>
  api.get('/notifications');
 
// 📤 Historial de enviadas
export const getSentNotifications = () =>
  api.get('/notifications/sent');
 
// ✅ Marcar una como leída
export const markAsRead = (id) =>
  api.put(`/notifications/${id}/read`);
 
// 🚩 Marcar todas como leídas
export const markAllAsRead = () =>
  api.put('/notifications/read-all');
 
// 🗑️ Eliminar notificación
export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`);
 
// 🚀 Envío individual o por local
export const sendNotification = (data) =>
  api.post('/notifications/send', data);
 
// 🔥 Envío masivo (Bulk)
export const sendBulk = (data) =>
  api.post('/notifications/send-bulk', data);
 