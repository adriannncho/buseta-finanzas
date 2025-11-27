/**
 * Tipos compartidos del frontend
 */

export type UserRole = 'ADMIN' | 'WORKER';

export interface User {
  id: number;
  fullName: string;
  email: string | null;
  nationalId: string;
  role: UserRole;
  assignedBusId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  sessionId: string;
  assignedBusId: number | null;
}

export interface LoginCredentials {
  nationalId: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
