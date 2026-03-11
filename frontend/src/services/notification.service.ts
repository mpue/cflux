import api from './api';

export interface AppNotification {
  id: string;
  userId: string;
  type: 'CHAT_MESSAGE' | 'MESSAGE' | 'WORKFLOW' | 'SYSTEM';
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  linkUrl: string | null;
  createdAt: string;
}

// Get notifications
export const getNotifications = async (limit = 50, unreadOnly = false): Promise<AppNotification[]> => {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (unreadOnly) params.set('unread', 'true');
  const response = await api.get(`/notifications?${params.toString()}`);
  return response.data;
};

// Get unread notification count
export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread-count');
  return response.data.count;
};

// Mark single notification as read
export const markNotificationAsRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

// Mark all as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};
