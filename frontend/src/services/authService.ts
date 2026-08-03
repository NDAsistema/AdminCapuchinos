import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginData {
  email: string;
  password: string;
}

export interface ProfileUser {
  id: number;
  id_brother: number | null;
  email: string;
  type_user: number;
  status?: number;
  name_brother?: string | null;
  img_brother?: string | null;
  study?: string;
  cv?: string;
  birth_date?: string | null;
  year_profession?: string | null;
  is_group_leader?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user: ProfileUser;
  token: string;
  message?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  study?: string;
  cv?: string;
  birth_date?: string | null;
  year_profession?: string | null;
  img?: File | null;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

  async getProfile(): Promise<ProfileUser> {
    try {
      const response = await api.get('/auth/profile');
      if (!response.data.success) {
        throw new Error(response.data.message || 'No se pudo obtener el perfil');
      }
      return response.data.user;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || 'No se pudo obtener el perfil'
      );
    }
  }

  async updateProfile(data: UpdateProfileData): Promise<ProfileUser> {
    try {
      const formData = new FormData();
      if (data.name !== undefined) formData.append('name', data.name);
      if (data.email !== undefined) formData.append('email', data.email);
      if (data.study !== undefined) formData.append('study', data.study);
      if (data.cv !== undefined) formData.append('cv', data.cv);
      if (data.birth_date !== undefined) {
        formData.append('birth_date', data.birth_date || '');
      }
      if (data.year_profession !== undefined) {
        formData.append('year_profession', data.year_profession || '');
      }
      if (data.img) {
        formData.append('img', data.img);
      }

      const response = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'No se pudo actualizar el perfil');
      }
      return response.data.user;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || 'No se pudo actualizar el perfil'
      );
    }
  }

  async changePassword(data: ChangePasswordData): Promise<string> {
    try {
      const response = await api.put('/auth/change-password', data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'No se pudo cambiar la contraseña');
      }
      return response.data.message || 'Contraseña actualizada';
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || 'No se pudo cambiar la contraseña'
      );
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

  getUser(): ProfileUser | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getUserRole(): number | null {
    const user = this.getUser();
    return user ? user.type_user : null;
  }
}

export default new AuthService();
