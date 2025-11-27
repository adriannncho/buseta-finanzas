import { Router } from 'express';
import { UsersController } from './users.controller';
import { validate, validateQuery, validateParams } from '../../shared/middleware/validation.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  userIdParamSchema,
} from './users.dto';

const router = Router();
const usersController = new UsersController();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/users
 * Listar usuarios con filtros (accesible para todos los usuarios autenticados)
 */
router.get('/', validateQuery(getUsersQuerySchema), (req, res, next) =>
  usersController.getUsers(req, res, next)
);

/**
 * GET /api/users/:id
 * Obtener usuario por ID (accesible para todos los usuarios autenticados)
 */
router.get('/:id', validateParams(userIdParamSchema), (req, res, next) =>
  usersController.getUserById(req, res, next)
);

/**
 * POST /api/users
 * Crear nuevo usuario (solo ADMIN)
 */
router.post('/', authorize('ADMIN'), validate(createUserSchema), (req, res, next) =>
  usersController.createUser(req, res, next)
);

/**
 * PUT /api/users/:id
 * Actualizar usuario (solo ADMIN)
 */
router.put(
  '/:id',
  authorize('ADMIN'),
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  (req, res, next) => usersController.updateUser(req, res, next)
);

/**
 * DELETE /api/users/:id
 * Desactivar usuario (solo ADMIN)
 */
router.delete('/:id', authorize('ADMIN'), validateParams(userIdParamSchema), (req, res, next) =>
  usersController.deleteUser(req, res, next)
);

/**
 * POST /api/users/:id/activate
 * Reactivar usuario (solo ADMIN)
 */
router.post('/:id/activate', authorize('ADMIN'), validateParams(userIdParamSchema), (req, res, next) =>
  usersController.activateUser(req, res, next)
);

export default router;
