import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  reference_id: number;
  message: string;
  is_read: number;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  unreadCount: number;
}

class NotificationService {
  async getAll(limit = 30): Promise<NotificationListResponse> {
    const response = await api.get('/notifications', { params: { limit } });
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.unreadCount ?? 0;
  }

  async markAsRead(id: number): Promise<number> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.unreadCount ?? 0;
  }

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  }
}

export default new NotificationService();
