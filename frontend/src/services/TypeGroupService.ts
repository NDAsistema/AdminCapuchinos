import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

class TypeGroupService {
  async create(formData: FormData): Promise<any> {
    try {
      // Forzamos el content-type para evitar errores 400
      const response = await api.post('/typegroup/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error creando:', error.response?.data || error.message);
      throw error;
    }
  }

  async update(id: number, formData: FormData): Promise<any> {
    try {
      const response = await api.put(`/typegroup/update/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error actualizando:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAll() {
    const response = await api.get('/typegroup/getAll');
    return response.data.data;
  }

  async delete(id: number) {
    await api.delete(`/typegroup/delete/${id}`);
  }
}

export default new TypeGroupService();