import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validateQuery } from '../../shared/middleware/validation.middleware';
import { getAuditLogsQuerySchema } from './audit.dto';

const router = Router();

/**
 * GET /api/audit/logs
 * Obtener logs de auditoría (solo ADMIN)
 */
router.get(
  '/logs',
  authenticate,
  authorize('ADMIN'),
  validateQuery(getAuditLogsQuerySchema),
  (req, res, next) => auditController.getAuditLogs(req, res, next)
);

/**
 * GET /api/audit/stats
 * Obtener estadísticas de auditoría (solo ADMIN)
 */
router.get(
  '/stats',
  authenticate,
  authorize('ADMIN'),
  (req, res, next) => auditController.getAuditStats(req, res, next)
);

export default router;
