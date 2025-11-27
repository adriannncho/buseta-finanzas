import apiClient from './api.client';
import { PaginatedResponse } from '../types/common';

export interface AuditLog {
  id: number;
  actorUserId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  description: string | null;
  metadata: any;
  createdAt: string;
  actor: {
    id: number;
    fullName: string;
    nationalId: string;
    role: string;
  } | null;
}

export interface AuditStats {
  totalLogs: number;
  byAction: Array<{
    action: string;
    count: number;
  }>;
  byEntity: Array<{
    entityType: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: number | null;
    userName: string;
    role: string;
    count: number;
  }>;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

class AuditService {
  /**
   * Obtener logs de auditoría
   */
  async getAuditLogs(params?: GetAuditLogsParams): Promise<PaginatedResponse<AuditLog>> {
    const response = await apiClient.get('/audit/logs', { params });
    return response.data;
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getAuditStats(params?: { startDate?: string; endDate?: string }): Promise<AuditStats> {
    const response = await apiClient.get('/audit/stats', { params });
    return response.data;
  }
}

export default new AuditService();
