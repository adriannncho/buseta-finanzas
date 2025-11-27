import apiClient from './api.client';
import { PaginatedResponse } from '../types/common';

// ==================== CATEGORÍAS ====================

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    expenses: number;
  };
}

export interface CreateExpenseCategoryData {
  name: string;
  description?: string;
}

export interface UpdateExpenseCategoryData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface GetExpenseCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

// ==================== GASTOS ====================

export interface Expense {
  id: string;
  busId: string;
  categoryId: string;
  amount: number;
  description?: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
  bus?: {
    id: string;
    internalCode: string;
    plateNumber: string;
  };
}

export interface CreateExpenseData {
  busId: number;
  categoryId: number;
  amount: number;
  description?: string;
  expenseDate?: string;
}

export interface UpdateExpenseData {
  busId?: number;
  categoryId?: number;
  amount?: number;
  expenseDate?: string;
  description?: string | null;
}

export interface GetExpensesParams {
  page?: number;
  limit?: number;
  busId?: number;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ExpenseStatistics {
  totalExpenses: number;
  avgExpense: number;
  totalCount: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    total: number;
    count: number;
  }>;
}

export const expensesService = {
  // ==================== CATEGORÍAS ====================

  async getExpenseCategories(
    params?: GetExpenseCategoriesParams
  ): Promise<PaginatedResponse<ExpenseCategory>> {
    const response = await apiClient.get('/expenses/categories', { params });
    return response.data.data;
  },

  async getExpenseCategoryById(id: string): Promise<ExpenseCategory> {
    const response = await apiClient.get(`/expenses/categories/${id}`);
    return response.data.data;
  },

  async createExpenseCategory(data: CreateExpenseCategoryData): Promise<ExpenseCategory> {
    const response = await apiClient.post('/expenses/categories', data);
    return response.data.data;
  },

  async updateExpenseCategory(
    id: string,
    data: UpdateExpenseCategoryData
  ): Promise<ExpenseCategory> {
    const response = await apiClient.patch(`/expenses/categories/${id}`, data);
    return response.data.data;
  },

  async deleteExpenseCategory(id: string): Promise<ExpenseCategory> {
    const response = await apiClient.delete(`/expenses/categories/${id}`);
    return response.data.data;
  },

  async activateExpenseCategory(id: string): Promise<ExpenseCategory> {
    const response = await apiClient.post(`/expenses/categories/${id}/activate`);
    return response.data.data;
  },

  // ==================== GASTOS ====================

  async getExpenses(params?: GetExpensesParams): Promise<PaginatedResponse<Expense>> {
    const response = await apiClient.get('/expenses', { params });
    return response.data.data;
  },

  async getExpenseById(id: string): Promise<Expense> {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data.data;
  },

  async getExpenseStatistics(params?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ExpenseStatistics> {
    const response = await apiClient.get('/expenses/statistics', { params });
    return response.data.data;
  },

  async createExpense(data: CreateExpenseData): Promise<Expense> {
    const response = await apiClient.post('/expenses', data);
    return response.data.data;
  },

  async updateExpense(id: string, data: UpdateExpenseData): Promise<Expense> {
    const response = await apiClient.patch(`/expenses/${id}`, data);
    return response.data.data;
  },

  async deleteExpense(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data.data;
  },
};
