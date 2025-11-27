import apiClient from './api.client';
import { PaginatedResponse } from '../types/common';

export interface Bus {
  id: number;
  internalCode: string;
  plateNumber: string;
  description?: string;
  monthlyTarget?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusData {
  internalCode: string;
  plateNumber: string;
  description?: string;
  monthlyTarget?: number;
}

export interface UpdateBusData {
  internalCode?: string;
  plateNumber?: string;
  description?: string | null;
  monthlyTarget?: number;
  isActive?: boolean;
}

export interface GetBusesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const busesService = {
  async getBuses(params?: GetBusesParams): Promise<PaginatedResponse<Bus>> {
    const response = await apiClient.get('/buses', { params });
    return response.data.data;
  },

  async getBusById(id: string): Promise<Bus> {
    const response = await apiClient.get(`/buses/${id}`);
    return response.data.data;
  },

  async createBus(data: CreateBusData): Promise<Bus> {
    const response = await apiClient.post('/buses', data);
    return response.data.data;
  },

  async updateBus(id: string, data: UpdateBusData): Promise<Bus> {
    const response = await apiClient.patch(`/buses/${id}`, data);
    return response.data.data;
  },

  async deleteBus(id: string): Promise<Bus> {
    const response = await apiClient.delete(`/buses/${id}`);
    return response.data.data;
  },

  async activateBus(id: string): Promise<Bus> {
    const response = await apiClient.post(`/buses/${id}/activate`);
    return response.data.data;
  },
};
