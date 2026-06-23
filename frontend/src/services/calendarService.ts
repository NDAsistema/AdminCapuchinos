import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface CalendarAssignment {
  id?: number;
  assigned_type: number;
  assigned_id: number;
  assigned_name?: string;
}

export interface Calendar {
  id: number;
  name: string;
  description?: string | null;
  color?: string;
  created_by: number;
  creator_name?: string;
  assignments?: CalendarAssignment[];
  canManage?: boolean;
}

export interface CalendarInput {
  name: string;
  description?: string;
  color?: string;
  assignments?: { assigned_type: number; assigned_id: number }[];
}

class CalendarService {
  async getAll(): Promise<Calendar[]> {
    const res = await api.get('/calendars');
    return res.data?.data ?? [];
  }

  async getById(id: number): Promise<Calendar> {
    const res = await api.get(`/calendars/${id}`);
    return res.data?.data;
  }

  async create(data: CalendarInput): Promise<number> {
    const res = await api.post('/calendars', data);
    return res.data?.data?.calendarId;
  }

  async update(id: number, data: CalendarInput): Promise<void> {
    await api.put(`/calendars/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/calendars/${id}`);
  }
}

export default new CalendarService();
