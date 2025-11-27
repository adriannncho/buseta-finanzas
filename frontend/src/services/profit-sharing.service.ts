import apiClient from './api.client';
import { PaginatedResponse } from '../types/common';

// ==================== GRUPOS DE REPARTO ====================

export type ShareRole = 'OWNER' | 'DRIVER' | 'PARTNER';

export interface ProfitSharingGroup {
  id: number;
  busId: number;
  name?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bus?: {
    id: number;
    internalCode: string;
    plateNumber?: string;
    monthlyTarget?: number;
  };
  members?: ProfitSharingMember[];
  _count?: {
    members: number;
  };
  creator?: {
    id: number;
    fullName: string;
  };
}

export interface ProfitSharingMember {
  id: number;
  groupId: number;
  userId: number;
  roleInShare: ShareRole;
  percentage: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    fullName: string;
    nationalId: string;
    email?: string;
  };
  group?: {
    id: number;
    name?: string;
    busId: number;
    startDate: string;
    endDate?: string;
    bus?: {
      internalCode: string;
      plateNumber?: string;
    };
  };
}

export interface CreateProfitSharingGroupData {
  busId: number;
  name?: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateProfitSharingGroupData {
  name?: string;
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
}

export interface CreateProfitSharingMemberData {
  groupId: number;
  userId: number;
  roleInShare: ShareRole;
  percentage: number;
}

export interface UpdateProfitSharingMemberData {
  roleInShare?: ShareRole;
  percentage?: number;
}

export interface GetProfitSharingGroupsParams {
  page?: number;
  limit?: number;
  busId?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface GetProfitSharingMembersParams {
  groupId?: number;
  userId?: number;
  roleInShare?: ShareRole;
}

export interface ProfitDistribution {
  groupId: number;
  groupName?: string;
  busInfo: {
    id: number;
    internalCode: string;
    plateNumber?: string;
  };
  period: {
    start: string;
    end: string;
  };
  totals: {
    totalIncome: number;
    routeExpenses: number;
    operationalProfit: number;
    administrativeExpenses: number;
    netProfit: number;
    routesCount: number;
  };
  distribution: Array<{
    memberId: number;
    userId: number;
    userName: string;
    roleInShare: ShareRole;
    percentage: number;
    amount: number;
  }>;
  summary: {
    totalPercentageAssigned: number;
    unassignedPercentage: number;
    unassignedAmount: number;
    totalDistributed: number;
  };
}

export const profitSharingService = {
  // ==================== GRUPOS ====================

  async getProfitSharingGroups(
    params?: GetProfitSharingGroupsParams
  ): Promise<PaginatedResponse<ProfitSharingGroup>> {
    const response = await apiClient.get('/profit-sharing/groups', { params });
    return response.data.data;
  },

  async getProfitSharingGroupById(id: string): Promise<ProfitSharingGroup> {
    const response = await apiClient.get(`/profit-sharing/groups/${id}`);
    return response.data.data;
  },

  async createProfitSharingGroup(
    data: CreateProfitSharingGroupData
  ): Promise<ProfitSharingGroup> {
    const response = await apiClient.post('/profit-sharing/groups', data);
    return response.data.data;
  },

  async updateProfitSharingGroup(
    id: string,
    data: UpdateProfitSharingGroupData
  ): Promise<ProfitSharingGroup> {
    const response = await apiClient.patch(`/profit-sharing/groups/${id}`, data);
    return response.data.data;
  },

  async deleteProfitSharingGroup(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/profit-sharing/groups/${id}`);
    return response.data.data;
  },

  // ==================== MIEMBROS ====================

  async getProfitSharingMembers(
    params?: GetProfitSharingMembersParams
  ): Promise<ProfitSharingMember[]> {
    const response = await apiClient.get('/profit-sharing/members/list', { params });
    return response.data.data;
  },

  async getProfitSharingMemberById(id: string): Promise<ProfitSharingMember> {
    const response = await apiClient.get(`/profit-sharing/members/${id}`);
    return response.data.data;
  },

  async createProfitSharingMember(
    data: CreateProfitSharingMemberData
  ): Promise<ProfitSharingMember> {
    const response = await apiClient.post('/profit-sharing/members', data);
    return response.data.data;
  },

  async updateProfitSharingMember(
    id: string,
    data: UpdateProfitSharingMemberData
  ): Promise<ProfitSharingMember> {
    const response = await apiClient.patch(`/profit-sharing/members/${id}`, data);
    return response.data.data;
  },

  async deleteProfitSharingMember(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/profit-sharing/members/${id}`);
    return response.data.data;
  },

  // ==================== CÁLCULOS ====================

  async getProfitDistribution(
    groupId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProfitDistribution> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get(
      `/profit-sharing/groups/${groupId}/distribution`,
      { params }
    );
    return response.data.data;
  },
};
