import { Router } from 'express';
import { busesController } from './buses.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate, validateQuery } from '../../shared/middleware/validation.middleware';
import { createBusSchema, updateBusSchema, getBusesQuerySchema } from './buses.dto';
import { asyncHandler } from '../../shared/utils/errors';

const router = Router();

/**
 * Todas las rutas requieren autenticación
 */
router.use(authenticate);

/**
 * GET /api/buses
 * Obtener listado de buses (todos los usuarios autenticados)
 */
router.get(
  '/',
  validateQuery(getBusesQuerySchema),
  asyncHandler(busesController.getBuses.bind(busesController))
);

/**
 * GET /api/buses/:id
 * Obtener un bus por ID (todos los usuarios autenticados)
 */
router.get(
  '/:id',
  asyncHandler(busesController.getBusById.bind(busesController))
);

/**
 * POST /api/buses
 * Crear un nuevo bus (solo administradores)
 */
router.post(
  '/',
  authorize('ADMIN'),
  validate(createBusSchema),
  asyncHandler(busesController.createBus.bind(busesController))
);

/**
 * PATCH /api/buses/:id
 * Actualizar un bus (solo administradores)
 */
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(updateBusSchema),
  asyncHandler(busesController.updateBus.bind(busesController))
);

/**
 * DELETE /api/buses/:id
 * Eliminar un bus (solo administradores)
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  asyncHandler(busesController.deleteBus.bind(busesController))
);

/**
 * POST /api/buses/:id/activate
 * Activar un bus (solo administradores)
 */
router.post(
  '/:id/activate',
  authorize('ADMIN'),
  asyncHandler(busesController.activateBus.bind(busesController))
);

/**
 * GET /api/buses/:id/monthly-stats
 * Obtener estadísticas mensuales de un bus (todos los usuarios autenticados)
 */
router.get(
  '/:id/monthly-stats',
  asyncHandler(busesController.getMonthlyStats.bind(busesController))
);

export default router;
