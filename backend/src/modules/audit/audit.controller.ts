import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { GetAuditLogsQueryDto } from './audit.dto';

export class AuditController {
  /**
   * GET /api/audit/logs
   * Obtener logs de auditoría
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as GetAuditLogsQueryDto;
      const result = await auditService.getAuditLogs(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit/stats
   * Obtener estadísticas de auditoría
   */
  async getAuditStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const stats = await auditService.getAuditStats(
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
