import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
});


export interface TypeUserService {
  id: number;
  name: string;
  description?: string;
}

class TypeUserServicesService {
  async getServices(): Promise<TypeUserService[]> {
    const response = await api.get('/brother/getListTypeUserServices');
    return response.data.data;
  }
}

// 👇 Asegúrate de que esta línea esté CORRECTA
export default new TypeUserServicesService();