import axios from 'axios';

// Reutilizamos la configuración de la API con los interceptores
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

// Interfaz para los adjuntos (opcional si necesitas tipado en el front)
export interface Attachment {
    id?: number;
    url: string;
    filename?: string;
    id_newspaper?: number | null;
    status: 'temp' | 'active';
    created_at?: string;
}

class AttachmentService {
    
    /**
     * Sube una imagen individual a AWS S3 a través del backend.
     * Este método es el que usará Froala.
     */
    async uploadImage(file: File): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('file', file); // El campo 'file' que espera el AttachmentController

            const response = await api.post('/attachments/upload-newspaper-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            return response.data.link;
        } catch (error: any) {
            console.error('❌ Error subiendo imagen adjunta:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene los adjuntos vinculados a una noticia específica
     */
    async getAttachmentsByNews(newspaperId: number): Promise<Attachment[]> {
        try {
            const response = await api.get(`/attachments/getByNewspaper/${newspaperId}`);
            return response.data.success ? response.data.data : response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo adjuntos:', error.message);
            return [];
        }
    }

    /**
     * Elimina un adjunto de la base de datos y de S3
     */
    async deleteAttachment(id: number): Promise<void> {
        try {
            await api.delete(`/attachments/deleteAttachment/${id}`);
        } catch (error: any) {
            console.error('❌ Error eliminando adjunto:', error.message);
            throw error;
        }
    }
}

export default new AttachmentService();