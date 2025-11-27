import { Router } from 'express';
import { RoutesController } from './routes.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();
const routesController = new RoutesController();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/routes/stats
 * Obtener estadísticas de rutas
 * WORKER: Solo de su bus asignado
 * ADMIN: De todos los buses o filtrado
 */
router.get('/stats', (req, res, next) =>
  routesController.getRouteStats(req, res, next)
);

/**
 * POST /api/routes
 * Crear una nueva ruta
 * WORKER: Solo para su bus asignado y como conductor
 * ADMIN: Para cualquier bus y conductor
 */
router.post('/', (req, res, next) =>
  routesController.createRoute(req, res, next)
);

/**
 * GET /api/routes
 * Obtener todas las rutas con filtros opcionales
 * WORKER: Solo rutas de su bus asignado
 * ADMIN: Todas las rutas o filtradas
 */
router.get('/', (req, res, next) =>
  routesController.getRoutes(req, res, next)
);

/**
 * GET /api/routes/:id
 * Obtener una ruta específica por ID
 * WORKER: Solo si es de su bus asignado
 * ADMIN: Cualquier ruta
 */
router.get('/:id', (req, res, next) =>
  routesController.getRouteById(req, res, next)
);

/**
 * PUT /api/routes/:id
 * Actualizar una ruta
 * Solo ADMIN puede actualizar rutas
 * No se pueden editar rutas bloqueadas (isLocked=true)
 */
router.put('/:id', (req, res, next) =>
  routesController.updateRoute(req, res, next)
);

/**
 * DELETE /api/routes/:id
 * Eliminar una ruta
 * Solo ADMIN puede eliminar rutas
 */
router.delete('/:id', (req, res, next) =>
  routesController.deleteRoute(req, res, next)
);

export default router;
