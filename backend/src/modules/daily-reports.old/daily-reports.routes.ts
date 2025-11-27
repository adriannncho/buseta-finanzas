import { Router } from 'express';
import { dailyReportsController } from './daily-reports.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate, validateQuery } from '../../shared/middleware/validation.middleware';
import { createDailyReportSchema, updateDailyReportSchema, getDailyReportsQuerySchema } from './daily-reports.dto';
import { asyncHandler } from '../../shared/utils/errors';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/daily-reports/statistics
 * Obtener estadísticas de reportes (todos los usuarios)
 */
router.get('/statistics', asyncHandler(dailyReportsController.getStatistics.bind(dailyReportsController)));

/**
 * GET /api/daily-reports
 * Obtener listado de reportes (todos los usuarios)
 */
router.get(
  '/',
  validateQuery(getDailyReportsQuerySchema),
  asyncHandler(dailyReportsController.getDailyReports.bind(dailyReportsController))
);

/**
 * GET /api/daily-reports/:id
 * Obtener un reporte por ID (todos los usuarios)
 */
router.get('/:id', asyncHandler(dailyReportsController.getDailyReportById.bind(dailyReportsController)));

/**
 * POST /api/daily-reports
 * Crear un nuevo reporte (ADMIN y WORKER)
 */
router.post(
  '/',
  validate(createDailyReportSchema),
  asyncHandler(dailyReportsController.createDailyReport.bind(dailyReportsController))
);

/**
 * PATCH /api/daily-reports/:id
 * Actualizar un reporte (solo ADMIN)
 */
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(updateDailyReportSchema),
  asyncHandler(dailyReportsController.updateDailyReport.bind(dailyReportsController))
);

/**
 * DELETE /api/daily-reports/:id
 * Eliminar un reporte (solo ADMIN)
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  asyncHandler(dailyReportsController.deleteDailyReport.bind(dailyReportsController))
);

export default router;
