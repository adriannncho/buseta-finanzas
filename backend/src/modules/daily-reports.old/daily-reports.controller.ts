import { Request, Response } from 'express';
import { dailyReportsService } from './daily-reports.service';
import {
  CreateDailyReportDto,
  UpdateDailyReportDto,
  getDailyReportsQuerySchema,
} from './daily-reports.dto';
import { successResponse } from '../../shared/utils/responses';
import { AuthRequest } from '../../shared/types/common.types';

export class DailyReportsController {
  /**
   * GET /api/daily-reports
   * Obtener listado de reportes diarios
   */
  async getDailyReports(req: Request, res: Response) {
    const query = getDailyReportsQuerySchema.parse(req.query);
    const result = await dailyReportsService.getDailyReports(query);
    return successResponse(res, result);
  }

  /**
   * GET /api/daily-reports/statistics
   * Obtener estadísticas de reportes
   */
  async getStatistics(req: Request, res: Response) {
    const { busId, startDate, endDate } = req.query;
    const stats = await dailyReportsService.getStatistics(
      busId ? parseInt(busId as string, 10) : undefined,
      startDate as string | undefined,
      endDate as string | undefined
    );
    return successResponse(res, stats);
  }

  /**
   * GET /api/daily-reports/:id
   * Obtener un reporte diario por ID
   */
  async getDailyReportById(req: Request, res: Response) {
    const { id } = req.params;
    const report = await dailyReportsService.getDailyReportById(parseInt(id, 10));
    return successResponse(res, report);
  }

  /**
   * POST /api/daily-reports
   * Crear un nuevo reporte diario
   */
  async createDailyReport(req: AuthRequest, res: Response) {
    const data: CreateDailyReportDto = req.body;
    const userId = req.user!.id;
    const report = await dailyReportsService.createDailyReport(data, userId);
    return successResponse(res, report, 'Reporte diario creado', 201);
  }

  /**
   * PATCH /api/daily-reports/:id
   * Actualizar un reporte diario
   */
  async updateDailyReport(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data: UpdateDailyReportDto = req.body;
    const userId = req.user!.id;
    const report = await dailyReportsService.updateDailyReport(parseInt(id, 10), data, userId);
    return successResponse(res, report);
  }

  /**
   * DELETE /api/daily-reports/:id
   * Eliminar un reporte diario
   */
  async deleteDailyReport(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await dailyReportsService.deleteDailyReport(parseInt(id, 10), userId);
    return successResponse(res, result);
  }
}

export const dailyReportsController = new DailyReportsController();
