import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
});

// Interceptor para inyectar el token
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

// CORRECCIÓN CLAVE: Interceptor de respuesta para manejar errores de token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔐 Token inválido o sesión expirada. Limpiando...');
      // Si el backend rechaza el token, lo borramos para evitar bucles de error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Opcional: Redirigir al login
      // window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export interface Home {
    id: number;
    name: string; // Asegúrate de que coincida con el nombre en la BD (name o name_home)
    guardian?: number;
    location?: string;
    status: number;
}

class HomeService {
    
    async getAllHomes(): Promise<Home[]> {
        try {
            const response = await api.get('/home');
            // Retornamos la data limpia
            return response.data.success ? response.data.data : response.data;
        } catch (error: any) {
            console.error('❌ Error en getAllHome:', error.message);
            return [];
        }
    }

    async createHome(homeData: any): Promise<any> {
        try {
            const response = await api.post('/home', homeData);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error creando home:', error.response?.data || error.message);
            throw error;
        }
    }

    async getHomeById(id: number): Promise<Home | null> {
        try {
            const response = await api.get(`/home/${id}`);
            return response.data.success ? response.data.data : response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo home:', error.message);
            return null;
        }
    }

    async updateHome(id: number, homeData: any): Promise<any> {
        try {
            const response = await api.put(`/home/${id}`, homeData);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error actualizando home:', error.message);
            throw error;
        }
    }

    async deleteHome(id: number): Promise<boolean> {
        try {
            const response = await api.delete(`/home/${id}`);
            return response.data.success;
        } catch (error: any) {
            console.error('❌ Error eliminando home:', error.message);
            return false;
        }
    }

    // --- IMÁGENES ---

    async getImagesByHomeId(id: number): Promise<any[]> {
        try {
            const response = await api.get(`/home/getAllImgById/${id}`);
            return response.data.success ? response.data.data : [];
        } catch (error: any) {
            console.error('❌ Error obteniendo imágenes:', error.message);
            return [];
        }
    }

    async uploadHomeImage(homeId: number, file: File, order: number): Promise<any> {
        try {
            const formData = new FormData();
            formData.append('img', file);
            formData.append('home_id', homeId.toString());
            formData.append('orderimg', order.toString());

            const response = await api.post('/home/createImgHome', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ Error subiendo imagen:', error.message);
            throw error;
        }
    }

    async deleteImageHome(id: number): Promise<boolean> {
        try {
            const response = await api.delete(`/home/deleteImgHome/${id}`);
            return response.data.success;
        } catch (error: any) {
            console.error('❌ Error eliminando imagen:', error.message);
            return false;
        }
    }

    async findBrothersForGuardian(): Promise<any> { // Cambiado a any para recibir la data
        try {
            const response = await api.get(`/brother/findBrothersForGuardian`); 
            return response.data.success ? response.data.data : [];
        } catch (error: any) {
            console.error('❌ Error obteniendo hermanos para guardián:', error.message);
            return [];
        }
    }

    async findBrothersForParishPriest(): Promise<any> {
        try {
            const response = await api.get(`/brother/findBrothersForParishPriest`);
            return response.data.success ? response.data.data : [];
        } catch (error: any) {
            console.error('❌ Error obteniendo hermanos para párroco:', error.message);
            return [];
        }
    }

    async findBrothersForCommunicationUser(): Promise<any> {
        try {
            const response = await api.get(`/brother/findBrothersForCommunicationUser`);
            return response.data.success ? response.data.data : [];
        } catch (error: any) {
            console.error('❌ Error obteniendo hermanos para comunicación:', error.message);
            return [];
        }
    }
}

export default new HomeService();