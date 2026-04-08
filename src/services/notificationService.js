import api from '../api/apiClient';

/**
 * SERVICIO DE NOTIFICACIONES - CULTIVAPP
 * Centraliza las peticiones para que los componentes reciban la data limpia.
 */

// 🔔 Obtener historial (El backend filtra por empresa/usuario automáticamente)
export const getMyNotifications = () => 
  api.get('/notifications').then(res => res.data);

// ✅ Marcar una alerta específica como leída
export const markAsRead = (id) => 
  api.put(`/notifications/${id}/read`).then(res => res.data);

// 🗑️ Eliminar notificación (Solo permitido para ROOT / ADMIN)
export const deleteNotification = (id) => 
  api.delete(`/notifications/${id}`).then(res => res.data);

// 🚀 Envío Masivo desde el NotificationManager
export const sendBulk = (data) => 
  api.post('/notifications/send-bulk', data).then(res => res.data);

// 📌 Opcional: Marcar todas como leídas
export const markAllAsRead = () => 
  api.put('/notifications/read-all').then(res => res.data);