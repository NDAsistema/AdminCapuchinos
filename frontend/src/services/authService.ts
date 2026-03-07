import axios from 'axios';

// ✅ CORRECTO - URL directa o variable de entorno
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  id_brother: number | null;
  email: string;
  type_user: number;
  status: number;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

class AuthService {
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error en el login');
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/signin';
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('token') !== null;
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getUserRole(): number | null {
    const user = this.getUser();
    return user ? user.type_user : null;
  }
}

export default new AuthService();