import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Saint {
  id: number;
  title: string;
  content: string;
  date_birth?: string | null;
  date_death?: string | null;
  type: number;
  img?: string | null;
  status?: number;
  created_by?: number;
  name_created_by?: string;
  created_at?: string;
  updated_at?: string;
}

class SaintService {
  async getAll(): Promise<Saint[]> {
    const res = await api.get('/saints');
    return res.data?.data ?? [];
  }

  async getById(id: number): Promise<Saint> {
    const res = await api.get(`/saints/${id}`);
    return res.data?.data;
  }

  async create(formData: FormData): Promise<void> {
    await api.post('/saints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async update(id: number, formData: FormData): Promise<void> {
    await api.put(`/saints/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/saints/${id}`);
  }
}

export default new SaintService();
