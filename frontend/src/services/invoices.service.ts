import apiClient from './api.client';
import { PaginatedResponse } from '../types/common';

// ==================== FACTURAS ====================

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  providerName?: string;
  issueDate?: string;
  totalAmount?: number;
  fileUrl: string;
  mimeType?: string;
  uploadedBy?: string;
  createdAt: string;
  uploader?: {
    id: string;
    fullName: string;
    email?: string;
  };
  _count?: {
    expenses: number;
  };
  expenses?: Array<{
    id: string;
    amount: number;
    description?: string;
    category?: {
      id: string;
      name: string;
    };
    dailyReport?: {
      id: string;
      reportDate: string;
      bus?: {
        internalCode: string;
      };
    };
  }>;
}

export interface CreateInvoiceData {
  invoiceNumber?: string;
  providerName?: string;
  issueDate?: string;
  totalAmount?: number;
  file: File;
}

export interface UpdateInvoiceData {
  invoiceNumber?: string | null;
  providerName?: string | null;
  issueDate?: string | null;
  totalAmount?: number | null;
}

export interface GetInvoicesParams {
  page?: number;
  limit?: number;
  providerName?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface InvoiceStats {
  total: number;
  thisMonth: number;
  totalAmount: number;
}

export const invoicesService = {
  async getInvoices(params?: GetInvoicesParams): Promise<PaginatedResponse<Invoice>> {
    const response = await apiClient.get('/invoices', { params });
    return response.data.data;
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data.data;
  },

  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.invoiceNumber) formData.append('invoiceNumber', data.invoiceNumber);
    if (data.providerName) formData.append('providerName', data.providerName);
    if (data.issueDate) formData.append('issueDate', data.issueDate);
    if (data.totalAmount !== undefined)
      formData.append('totalAmount', data.totalAmount.toString());

    const response = await apiClient.post('/invoices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async updateInvoice(id: string, data: UpdateInvoiceData): Promise<Invoice> {
    const response = await apiClient.patch(`/invoices/${id}`, data);
    return response.data.data;
  },

  async deleteInvoice(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/invoices/${id}`);
    return response.data.data;
  },

  async getInvoiceStats(): Promise<InvoiceStats> {
    const response = await apiClient.get('/invoices/stats');
    return response.data.data;
  },

  getFileUrl(fileUrl: string): string {
    // Construir URL completa del archivo
    const baseUrl = apiClient.defaults.baseURL?.replace('/api', '') || '';
    return `${baseUrl}${fileUrl}`;
  },
};
