import { create } from 'zustand';
import { AuthUser } from '../types/common';
import { authService } from '../services/auth.service';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  login: (nationalId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  login: async (nationalId, password) => {
    try {
      set({ isLoading: true });
      const result = await authService.login({ nationalId, password });
      
      // Asegurar que el usuario tenga sessionId
      const userWithSession = {
        ...result.user,
        sessionId: result.sessionId
      };
      
      set({ user: userWithSession, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      
      const token = localStorage.getItem('token');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      // Solo limpiar si es un error 401 (no autorizado)
      // No limpiar si es error de red u otro error temporal
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        // Intentar recuperar usuario del localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            set({ user, isAuthenticated: true, isLoading: false });
          } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    }
  },
}));
