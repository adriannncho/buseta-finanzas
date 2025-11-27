import apiClient from './api.client';
import { LoginCredentials, AuthUser, ApiResponse } from '../types/common';

interface LoginResponse {
  token: string;
  user: AuthUser;
  sessionId: string;
  expiresAt: string;
}

export const authService = {
  /**
   * Login
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      // Crear usuario completo con sessionId
      const userWithSession = {
        ...response.data.data.user,
        sessionId: response.data.data.sessionId
      };
      
      // Guardar token y usuario en localStorage
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(userWithSession));
      
      return {
        ...response.data.data,
        user: userWithSession as any
      };
    }
    
    throw new Error('Login failed');
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Limpiar localStorage siempre
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      // Actualizar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    throw new Error('Failed to get current user');
  },

  /**
   * Obtener token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
