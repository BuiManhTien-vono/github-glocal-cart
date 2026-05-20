import apiClient from './apiClient';

export interface AppNotification {
  id: number;
  type: string;
  action: string;
  relatedOrderId?: number | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (page = 1, pageSize = 30) => {
    return apiClient.get(`/notifications?page=${page}&pageSize=${pageSize}`);
  },

  markAsRead: async (id: number) => {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  getUnreadCount: async () => {
    return apiClient.get('/notifications/unread-count');
  },
};
