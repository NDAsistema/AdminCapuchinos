import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CalendarEventInstance {
  id: string;
  eventId: number;
  calendarId: number;
  calendarName?: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  isRecurring: boolean;
  isException: boolean;
  originalStartAt: string;
}

export interface EventInput {
  calendar_id: number;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  all_day?: boolean;
  is_recurring?: boolean;
  recurrence_rule?: RecurrenceRule;
  recurrence_interval?: number;
  recurrence_end_date?: string;
  recurrence_count?: number;
  recurrence_days?: string;
  reminders?: number[];
}

export interface EventExceptionInput {
  original_start_at: string;
  exception_type: 'deleted' | 'modified';
  override_title?: string;
  override_description?: string;
  override_start_at?: string;
  override_end_at?: string;
  override_all_day?: boolean;
}

class EventService {
  async getInRange(start: string, end: string, calendarIds?: number[]): Promise<CalendarEventInstance[]> {
    const params: Record<string, string> = { start, end };
    if (calendarIds?.length === 1) {
      params.calendarId = String(calendarIds[0]);
    }
    const res = await api.get('/events', { params });
    let events: CalendarEventInstance[] = res.data?.data ?? [];
    if (calendarIds && calendarIds.length > 1) {
      events = events.filter((e) => calendarIds.includes(e.calendarId));
    }
    return events;
  }

  async getById(id: number) {
    const res = await api.get(`/events/${id}`);
    return res.data?.data;
  }

  async create(data: EventInput): Promise<number> {
    const res = await api.post('/events', data);
    return res.data?.data?.eventId;
  }

  async update(id: number, data: EventInput): Promise<void> {
    await api.put(`/events/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/events/${id}`);
  }

  async createException(eventId: number, data: EventExceptionInput): Promise<void> {
    await api.post(`/events/${eventId}/exceptions`, data);
  }
}

export default new EventService();
