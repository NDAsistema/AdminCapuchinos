import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('🔐 Token inválido o sesión expirada. Limpiando...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
        }
        return Promise.reject(error);
    }
);

export interface Newspaper {
    id?: number;
    title: string;
    content: string;
    img?: string | null;
    type_news: number;
    type_assing: number; 
    sub_type_assing: number; 
    status: number;
    created_at?: string;
    updated_at?: string;
}

class NewspaperService {
    
    async getAllNewspapers(): Promise<Newspaper[]> {
        try {
            const response = await api.get('/newspaper/listAllNewspaper');
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo periódicos:', error.message);
            return [];
        }
    }

    async createNews(formData: FormData): Promise<void> {
        try {
            const response = await api.post('/newspaper/createNews', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ Error creando noticia:', error.message);
            throw error;
        }
    }

    async deleteNews(id: number): Promise<void> {
        try {
            await api.delete(`/newspaper/deleteNews/${id}`);
        } catch (error: any) {
            console.error('❌ Error eliminando noticia:', error.message);
            throw error;
        }
    }

    async updateNews(id: number, formData: FormData): Promise<void> {
        try {
            const response = await api.put(`/newspaper/updateNews/${id}`, formData, {        
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ Error actualizando noticia:', error.message);
            throw error;
        }
    }
}

export default new NewspaperService();