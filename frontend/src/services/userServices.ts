// src/services/userService.ts
import axios from 'axios';

const api = axios.create({
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
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔐 Error 401: No autorizado - Sesión expirada');
    }
    if (error.response?.status === 403) {
      console.error('🚫 Error 403: Acceso prohibido');
    }
    return Promise.reject(error);
  }
);

// Interfaces para tipar los datos de Usuario
export interface User {
    id: number;
    type_user: string;
    email: string;
    password?: string;
    id_brother?: number;
    name?: string; // Nombre del hermano (traído por el JOIN)
    img?: string;  // Imagen del hermano (traída por el JOIN)
    status: number;
}

export interface CreateUserData {
    email: string;
    password?: string;
    type_user: string;
    id_brother?: number | string;
}

class UserService {
    
    /**
     * Obtiene todos los usuarios activos del sistema
     */
    async getAllUser(): Promise<User[]> {
        try {
            const response = await api.get('/users/getAllUser');
            if (response.data.success && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return [];
        } catch (error: any) {
            console.error('❌ Error en getAllUser:', error.message);
            return [];
        }
    }

    /**
     * Crea un nuevo usuario para el login
     */
    async createUser(userData: CreateUserData): Promise<User | null> {
        try {
            const response = await api.post('/users/create', userData);
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Error creando usuario:', {
                message: error.message,
                response: error.response?.data
            });
            throw error;
        }
    }

    /**
     * Actualiza los datos de un usuario existente
     */
    async updateUser(id: number, userData: Partial<CreateUserData>): Promise<User | null> {
        try {
            const response = await api.put(`/users/update/${id}`, userData);
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Error actualizando usuario:', error.message);
            throw error;
        }
    }

    /**
     * Eliminación lógica (Analógica) de un usuario
     */
    async deleteUser(id: number): Promise<boolean> {
        try {
            const response = await api.delete(`/users/delete/${id}`);
            return response.data.success;
        } catch (error: any) {
            console.error('❌ Error eliminando usuario:', error.message);
            return false;
        }
    }

    /**
     * Obtiene un usuario específico por su ID
     */
    async getUserById(id: number): Promise<User | null> {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo usuario por ID:', error.message);
            return null;
        }
    }
}

export default new UserService();