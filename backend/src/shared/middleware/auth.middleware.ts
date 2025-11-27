import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config/env';
import prisma from '../../config/database';
import { UnauthorizedError } from '../utils/errors';
import { AuthRequest, AuthUser } from '../types/common.types';

interface JwtPayload {
  userId: number;
  sessionId: number;
  iat?: number;
  exp?: number;
}

/**
 * Middleware para verificar autenticación
 * Verifica el token JWT y la sesión activa
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Obtener token del header Authorization o de cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.token;

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verificar token JWT
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Verificar que la sesión siga activa en la BD
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            nationalId: true,
            role: true,
            assignedBusId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!session || !session.isActive) {
      throw new UnauthorizedError('Session is not active');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedError('User is not active');
    }

    // Verificar que la sesión no haya expirado
    if (session.expiresAt && session.expiresAt < new Date()) {
      // Marcar sesión como expirada
      await prisma.session.update({
        where: { id: session.id },
        data: { isActive: false, endedAt: new Date() },
      });
      throw new UnauthorizedError('Session has expired');
    }

    // Adjuntar usuario autenticado a la request
    const authUser: AuthUser = {
      id: session.user.id,
      fullName: session.user.fullName,
      email: session.user.email,
      nationalId: session.user.nationalId,
      role: session.user.role as 'ADMIN' | 'WORKER',
      assignedBusId: session.user.assignedBusId,
      isActive: session.user.isActive,
      createdAt: session.user.createdAt.toISOString(),
      updatedAt: session.user.updatedAt.toISOString(),
      sessionId: session.id,
    };

    (req as AuthRequest).user = authUser;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware para verificar roles
 * Debe usarse después del middleware authenticate
 */
export function authorize(...allowedRoles: Array<'ADMIN' | 'WORKER'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    const userRole = authReq.user.role as string;
    if (!allowedRoles.includes(userRole as 'ADMIN' | 'WORKER')) {
      return next(
        new UnauthorizedError(
          `Role ${authReq.user.role} is not authorized for this action`
        )
      );
    }

    next();
  };
}
