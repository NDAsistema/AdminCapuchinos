// src/services/brotherService.ts - MODIFICADO
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// CREAR LA MISMA INSTANCIA DE AXIOS QUE EN homeService
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
});

// INTERCEPTOR PARA AGREGAR TOKEN - IGUAL QUE EN homeService
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Brother {
    id: number;
    name: string;
    email: string;
    birth_date: string;
    study: string;
    cv: string;
    server: string;
    year_profession: string;
    img?: string | null;
    status?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateBrotherData {
    name: string;
    email: string;
    birth_date?: string | null;
    study?: string;
    cv?: string;
    server?: string;
    year_profession?: string | null;
    img?: File | null;
}

class BrotherService {
    // USAR 'api' EN LUGAR DE 'axios' PARA TODAS LAS PETICIONES
    async createBrother(brotherData: CreateBrotherData): Promise<Brother> {
        const response = await api.post('/brother', brotherData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.data;
    }

    async updateBrother(id: number, brotherData: Partial<CreateBrotherData>): Promise<Brother> {
        const formattedData = {
            ...brotherData,
            birth_date: brotherData.birth_date ? this.formatDate(brotherData.birth_date) : null,
            year_profession: brotherData.year_profession ? this.formatDate(brotherData.year_profession) : null
        };
        
        const response = await api.put(`/brother/${id}`, formattedData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.data;
    }

    async getAllBrothers(): Promise<Brother[]> {
        const response = await api.get('/brother');
        return response.data.data;
    }

    async getBrotherById(id: number): Promise<Brother> {
        const response = await api.get(`/brother/${id}`);
        return response.data.data;
    }

    async deleteBrother(id: number): Promise<void> {
        await api.delete(`/brother/${id}`);
    }

    // Métodos para las rutas específicas
    async findBrothersForGuardian(): Promise<any[]> {
        const response = await api.get('/brother/findBrothersForGuardian');
        return response.data.data;
    }

    async findBrothersForParishPriest(): Promise<any[]> {
        const response = await api.get('/brother/findBrothersForParishPriest');
        return response.data.data;
    }

    async findBrothersForCommunicationUser(): Promise<any[]> {
        const response = await api.get('/brother/findBrothersForCommunicationUser');
        return response.data.data;
    }

    async getListTypeUserServices(): Promise<any[]> {
        const response = await api.get('/brother/getListTypeUserServices');
        return response.data.data;
    }

    private formatDate(dateString: string): string {
        if (!dateString) return '';
        
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('Fecha inválida:', dateString);
            return '';
        }
        return date.toISOString().split('T')[0];
    }
}

export default new BrotherService();