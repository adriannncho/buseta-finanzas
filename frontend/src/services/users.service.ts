import apiClient from './api.client';
import { User, PaginatedResponse } from '../types/common';

export interface CreateUserData {
  fullName: string;
  email?: string;
  nationalId: string;
  password: string;
  role: 'ADMIN' | 'WORKER';
  assignedBusId?: number | null;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  nationalId?: string;
  password?: string;
  role?: 'ADMIN' | 'WORKER';
  assignedBusId?: number | null;
  isActive?: boolean;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: 'ADMIN' | 'WORKER';
  isActive?: boolean;
  search?: string;
}

export const usersService = {
  async getUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get('/users', { params });
    return {
      data: response.data.data,
      pagination: {
        page: response.data.meta.page,
        limit: response.data.meta.limit,
        total: response.data.meta.total,
        totalPages: response.data.meta.totalPages,
      },
    };
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  async deleteUser(id: string): Promise<User> {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data.data;
  },

  async activateUser(id: string): Promise<User> {
    const response = await apiClient.post(`/users/${id}/activate`);
    return response.data.data;
  },
};
