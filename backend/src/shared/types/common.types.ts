import { Request } from 'express';

/**
 * Usuario autenticado en la request
 */
export interface AuthUser {
  id: number;
  fullName: string;
  email: string | null;
  nationalId: string;
  role: 'ADMIN' | 'WORKER';
  assignedBusId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sessionId: number;
}

/**
 * Request extendida con usuario autenticado
 */
export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Respuesta estándar de la API
 */
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

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Filtro por rango de fechas
 */
export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}
