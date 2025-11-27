import api from './api.client';

export interface RouteExpense {
  id?: number;
  expenseName: string;
  amount: number;
}

export interface Route {
  id: number;
  busId: number;
  workerId: number;
  routeName: string;
  routeDate: string;
  startTime?: string;
  endTime?: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  notes?: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  bus: {
    id: number;
    internalCode: string;
    plateNumber: string;
  };
  worker: {
    id: number;
    fullName: string;
  };
  routeExpenses: RouteExpense[];
}

export interface CreateRouteData {
  busId: number;
  workerId: number;
  routeName: string;
  routeDate: string;
  startTime?: string;
  endTime?: string;
  totalIncome: number;
  notes?: string;
  expenses: RouteExpense[];
  isLocked?: boolean;
}

export interface UpdateRouteData {
  busId?: number;
  workerId?: number;
  routeName?: string;
  routeDate?: string;
  startTime?: string;
  endTime?: string;
  totalIncome?: number;
  notes?: string;
  expenses?: RouteExpense[];
  isLocked?: boolean;
}

export interface RouteFilters {
  busId?: number;
  workerId?: number;
  routeDate?: string;
  startDate?: string;
  endDate?: string;
}

export interface RouteStats {
  totalRoutes: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  averageIncome: number;
  averageExpenses: number;
}

class RoutesService {
  /**
   * Crear una nueva ruta
   */
  async createRoute(data: CreateRouteData): Promise<Route> {
    const response = await api.post('/routes', data);
    return response.data;
  }

  /**
   * Obtener todas las rutas con filtros
   */
  async getRoutes(filters?: RouteFilters): Promise<Route[]> {
    const params = new URLSearchParams();
    
    if (filters?.busId) params.append('busId', filters.busId.toString());
    if (filters?.workerId) params.append('workerId', filters.workerId.toString());
    if (filters?.routeDate) params.append('routeDate', filters.routeDate);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/routes?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtener una ruta por ID
   */
  async getRouteById(id: number): Promise<Route> {
    const response = await api.get(`/routes/${id}`);
    return response.data;
  }

  /**
   * Actualizar una ruta (solo ADMIN)
   */
  async updateRoute(id: number, data: UpdateRouteData): Promise<Route> {
    const response = await api.put(`/routes/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar una ruta (solo ADMIN)
   */
  async deleteRoute(id: number): Promise<void> {
    await api.delete(`/routes/${id}`);
  }

  /**
   * Obtener estadísticas de rutas
   */
  async getRouteStats(filters?: {
    busId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<RouteStats> {
    const params = new URLSearchParams();
    
    if (filters?.busId) params.append('busId', filters.busId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/routes/stats?${params.toString()}`);
    return response.data;
  }
}

export default new RoutesService();
