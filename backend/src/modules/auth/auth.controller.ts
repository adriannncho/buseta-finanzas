import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto } from './auth.dto';
import { successResponse } from '../../shared/utils/response.utils';
import { AuthRequest } from '../../shared/types/common.types';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/login
   * Login de usuario
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginDto = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(data, ipAddress, userAgent);

      // Opcional: enviar token también como cookie httpOnly
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: result.expiresAt,
      });

      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout de usuario
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        res.json(successResponse({ message: 'Already logged out' }));
        return;
      }

      await authService.logout(authReq.user.sessionId, authReq.user.id);

      // Limpiar cookie
      res.clearCookie('token');

      res.json(successResponse({ message: 'Logged out successfully' }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Obtener información del usuario autenticado
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // El usuario ya viene completo del middleware con sessionId
      res.json(successResponse(authReq.user));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/register
   * Registrar nuevo usuario (solo ADMIN)
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const data: RegisterDto = req.body;

      const result = await authService.register(data, authReq.user?.id);

      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña del usuario autenticado
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const data: ChangePasswordDto = req.body;

      if (!authReq.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      await authService.changePassword(authReq.user.id, data);

      res.json(successResponse({ message: 'Password changed successfully' }));
    } catch (error) {
      next(error);
    }
  }
}
