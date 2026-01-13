import api from './api';
import { 
  Notification, 
  CreateNotification, 
  NotificationSummary, 
  ApiResponse, 
  PagedResult 
} from '../types';

export const notificationService = {
  // Get user's notifications (paginated)
  async getNotifications(page: number = 1, pageSize: number = 10, unreadOnly: boolean = false): Promise<PagedResult<Notification>> {
    const response = await api.get<ApiResponse<PagedResult<Notification>>>('/notifications', {
      params: { page, pageSize, unreadOnly }
    });
    return response.data.data!;
  },

  // Get notification summary (unread count + recent)
  async getNotificationSummary(): Promise<NotificationSummary> {
    const response = await api.get<ApiResponse<NotificationSummary>>('/notifications/summary');
    return response.data.data!;
  },

  // Get a single notification by ID
  async getNotification(id: string): Promise<Notification> {
    const response = await api.get<ApiResponse<Notification>>(`/notifications/${id}`);
    return response.data.data!;
  },

  // Create a new notification (admin/manager only)
  async createNotification(data: CreateNotification): Promise<Notification> {
    const response = await api.post<ApiResponse<Notification>>('/notifications', data);
    return response.data.data!;
  },

  // Mark a notification as read
  async markAsRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  },

  // Delete a notification (admin/manager only)
  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  // Get all notifications for admin view (admin/manager only)
  async getAllNotifications(page: number = 1, pageSize: number = 20): Promise<PagedResult<Notification>> {
    const response = await api.get<ApiResponse<PagedResult<Notification>>>('/notifications/all', {
      params: { page, pageSize }
    });
    return response.data.data!;
  }
};

export default notificationService;
