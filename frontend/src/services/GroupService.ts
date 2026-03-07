import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para el Token
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
    if (error.response?.status === 401) console.error('🔐 Error 401: No autorizado');
    if (error.response?.status === 403) console.error('🚫 Error 403: Acceso prohibido');
    return Promise.reject(error);
  }
);

class GroupService {
  
  /**
   * Obtiene todos los grupos activos
   */
  static async getAll() {
    try {
      const response = await api.get('/group');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      throw error;
    }
  }

  /**
   * Obtiene un grupo por su ID
   */
  static async getById(id: number) {
    try {
      const response = await api.get(`/group/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error al obtener el grupo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo grupo
   */
  static async create(groupData: any) {
    try {
      const response = await api.post('/group', groupData);
      return response.data;
    } catch (error) {
      console.error('Error al crear grupo:', error);
      throw error;
    }
  }

  /**
   * Actualiza un grupo existente
   */
  static async update(id: number, groupData: any) {
    try {
      const response = await api.put(`/group/${id}`, groupData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el grupo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina (o desactiva) un grupo
   */
  static async delete(id: number) {
    try {
      const response = await api.delete(`/group/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el grupo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de hermanos asignados a un grupo
   */
  static async getListBrotherAssing(id: number) {
    try {
      const response = await api.get(`/group/${id}/getListBrotherAssing`);
      return response;
    } catch (error) {
      console.error(`Error al obtener hermanos del grupo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Guardado de personal por grupo 
   */
  static async assignMembersToGroup(data: { groupId: number, members: any[] }) {
    try {
      const response = await api.post('/group/assignMembers', data);
      return response.data;
    } catch (error: any) {
      console.error("Error en GroupService.assignMembersToGroup:", error);
      throw error;
    }
  }

  static async getAllImgById(id: number) {
    try {
      // Coincide con: router.get('/getAllImgById/:id', ...)
      const response = await api.get(`/group/getAllImgById/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error(`Error obteniendo imágenes:`, error.message);
      return null;
    }
  }

  static async createImgGroup(groupId: number, file: File, orderimg: number) {
    try {
      const formData = new FormData();
      formData.append('img', file); 
      formData.append('groupId', groupId.toString());
      formData.append('orderimg', orderimg.toString());

      // Coincide con: router.post('/createImgGroup', ...)
      const response = await api.post('/group/createImgGroup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al subir:', error.response?.data);
      throw error;
    }
  }

  static async deleteImgGroup(id: number): Promise<boolean> {
    try {
      // Coincide con: router.delete('/deleteImgGroup/:id', ...)
      const response = await api.delete(`/group/deleteImgGroup/${id}`);
      return response.data.success;
    } catch (error: any) {
      console.error(`Error eliminando:`, error.message);
      return false;
    }
  }
}

export default GroupService;