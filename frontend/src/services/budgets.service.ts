import apiClient from './api.client';
import { PaginatedResponse } from '../types/common';

// ==================== PRESUPUESTOS ====================

export interface Budget {
  id: number;
  name: string;
  busId?: number | null;
  startDate: string;
  endDate?: string | null;
  totalPlannedIncome: number;
  totalPlannedExpense: number;
  totalCommitted: number;
  totalExecuted: number;
  createdBy?: number | null;
  createdAt: string;
  updatedAt: string;
  bus?: {
    id: number;
    internalCode: string;
    plateNumber: string;
  };
  budgetItems?: BudgetItem[];
  _count?: {
    budgetItems: number;
  };
}

export interface BudgetItem {
  id: number;
  budgetId: number;
  categoryId: number;
  plannedAmount: number;
  committedAmount: number;
  executedAmount: number;
  createdAt: string;
  updatedAt: string;
  budget?: {
    id: number;
    name: string;
    startDate: string;
    endDate?: string | null;
  };
  category?: {
    id: number;
    name: string;
  };
}

export interface CreateBudgetData {
  name: string;
  busId?: number;
  startDate: string;
  endDate?: string;
  totalPlannedIncome?: number;
  totalPlannedExpense?: number;
}

export interface UpdateBudgetData {
  name?: string;
  busId?: number | null;
  startDate?: string;
  endDate?: string | null;
  totalPlannedIncome?: number;
  totalPlannedExpense?: number;
}

export interface CreateBudgetItemData {
  budgetId: number;
  categoryId: number;
  plannedAmount: number;
}

export interface UpdateBudgetItemData {
  plannedAmount?: number;
  committedAmount?: number;
  executedAmount?: number;
}

export interface GetBudgetsParams {
  page?: number;
  limit?: number;
  busId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetBudgetItemsParams {
  budgetId?: string;
  categoryId?: string;
}

export const budgetsService = {
  // ==================== PRESUPUESTOS ====================

  async getBudgets(params?: GetBudgetsParams): Promise<PaginatedResponse<Budget>> {
    const response = await apiClient.get('/budgets', { params });
    return response.data.data;
  },

  async getBudgetById(id: string): Promise<Budget> {
    const response = await apiClient.get(`/budgets/${id}`);
    return response.data.data;
  },

  async createBudget(data: CreateBudgetData): Promise<Budget> {
    const response = await apiClient.post('/budgets', data);
    return response.data.data;
  },

  async updateBudget(id: string, data: UpdateBudgetData): Promise<Budget> {
    const response = await apiClient.patch(`/budgets/${id}`, data);
    return response.data.data;
  },

  async deleteBudget(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/budgets/${id}`);
    return response.data.data;
  },

  // ==================== ITEMS ====================

  async getBudgetItems(params?: GetBudgetItemsParams): Promise<BudgetItem[]> {
    const response = await apiClient.get('/budgets/items/list', { params });
    return response.data.data;
  },

  async getBudgetItemById(id: string): Promise<BudgetItem> {
    const response = await apiClient.get(`/budgets/items/${id}`);
    return response.data.data;
  },

  async createBudgetItem(data: CreateBudgetItemData): Promise<BudgetItem> {
    const response = await apiClient.post('/budgets/items', data);
    return response.data.data;
  },

  async updateBudgetItem(id: string, data: UpdateBudgetItemData): Promise<BudgetItem> {
    const response = await apiClient.patch(`/budgets/items/${id}`, data);
    return response.data.data;
  },

  async deleteBudgetItem(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/budgets/items/${id}`);
    return response.data.data;
  },
};
