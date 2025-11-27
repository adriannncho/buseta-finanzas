import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../shared/middleware/validation.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { loginSchema, registerSchema, changePasswordSchema } from './auth.dto';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/login
 * Login de usuario
 */
router.post('/login', validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

/**
 * POST /api/auth/logout
 * Logout (requiere autenticación)
 */
router.post('/logout', authenticate, (req, res, next) =>
  authController.logout(req, res, next)
);

/**
 * GET /api/auth/me
 * Obtener información del usuario actual (requiere autenticación)
 */
router.get('/me', authenticate, (req, res, next) =>
  authController.getCurrentUser(req, res, next)
);

/**
 * POST /api/auth/register
 * Registrar nuevo usuario (solo ADMIN)
 */
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  validate(registerSchema),
  (req, res, next) => authController.register(req, res, next)
);

/**
 * POST /api/auth/change-password
 * Cambiar contraseña (requiere autenticación)
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  (req, res, next) => authController.changePassword(req, res, next)
);

export default router;
