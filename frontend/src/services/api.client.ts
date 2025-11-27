import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Cliente HTTP configurado
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Para enviar cookies
    });

    // Interceptor para agregar token a las peticiones
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para manejar errores de respuesta
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<any>) => {
        // Si el token expiró o no es válido, redirigir al login
        if (error.response?.status === 401) {
          const currentPath = window.location.pathname;
          const isLoginEndpoint = error.config?.url?.includes('/auth/login');
          
          // No redirigir si ya estamos en login o si el error viene del endpoint de login
          if (currentPath !== '/login' && !isLoginEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

const apiClient = new ApiClient();

export default apiClient.getInstance();
