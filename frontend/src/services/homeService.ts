import axios from 'axios';

const api = axios.create({
  // Asegúrate de que esta URL sea la correcta (http://localhost:5001/api)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
});

// Interceptor para inyectar el token en cada petición
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

// Interfaces para tipar las Fraternidades (Home)
export interface Home {
    id: number;
    name_home: string;
    address_home?: string;
    phone_home?: string;
    status: number;
    created_at?: string;
}

export interface CreateHomeData {
    name_home: string;
    address_home?: string;
    phone_home?: string;
}

class HomeService {
    
    /**
     * GET /api/home
     * Obtiene todas las fraternidades
     */
    async getAllHomes(): Promise<Home[]> {
        try {
            const response = await api.get('/home'); // Ruta ajustada a tu app.ts
            // Ajustamos según si tu controller devuelve { success, data } o solo el array
            if (response.data.success) {
                return response.data.data;
            }
            return Array.isArray(response.data) ? response.data : [];
        } catch (error: any) {
            console.error('❌ Error en getAllHome:', error.message);
            return [];
        }
    }

    /**
     * POST /api/home
     * Crea una nueva fraternidad
     */
    async createHome(homeData: CreateHomeData): Promise<any> {
        try {
            const response = await api.post('/home', homeData);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error creando home:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * GET /api/home/:id
     */
    async getHomeById(id: number): Promise<Home | null> {
        try {
            const response = await api.get(`/home/${id}`);
            return response.data.success ? response.data.data : response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo home:', error.message);
            return null;
        }
    }

    /**
     * PUT /api/home/:id
     */
    async updateHome(id: number, homeData: Partial<CreateHomeData>): Promise<any> {
        try {
            const response = await api.put(`/home/${id}`, homeData);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error actualizando home:', error.message);
            throw error;
        }
    }

    /**
     * DELETE /api/home/:id
     */
    async deleteHome(id: number): Promise<boolean> {
        try {
            const response = await api.delete(`/home/${id}`);
            return response.data.success;
        } catch (error: any) {
            console.error('❌ Error eliminando home:', error.message);
            return false;
        }
    }

    // --- RUTAS ESPECÍFICAS DE IMÁGENES ---

    /**
     * GET /api/home/getAllImgById/:id
     */
    async getImagesByHomeId(id: number): Promise<any[]> {
        try {
            const response = await api.get(`/home/getAllImgById/${id}`);
            return response.data.success ? response.data.data : [];
        } catch (error: any) {
            console.error('❌ Error obteniendo imágenes:', error.message);
            return [];
        }
    }

    /**
     * DELETE /api/home/deleteImgHome/:id
     */
    async deleteImageHome(id: number): Promise<boolean> {
        try {
            const response = await api.delete(`/home/deleteImgHome/${id}`);
            return response.data.success;
        } catch (error: any) {
            console.error('❌ Error eliminando imagen:', error.message);
            return false;
        }
    }
}

export default new HomeService();