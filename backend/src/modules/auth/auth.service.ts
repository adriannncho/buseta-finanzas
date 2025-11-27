import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import config from '../../config/env';
import { LoginDto, RegisterDto, ChangePasswordDto } from './auth.dto';
import { UnauthorizedError, ConflictError, BadRequestError } from '../../shared/utils/errors';
import { AuthUser } from '../../shared/types/common.types';
import logger from '../../config/logger';

const SALT_ROUNDS = 10;

interface LoginResponse {
  token: string;
  user: {
    id: number;
    fullName: string;
    email: string | null;
    nationalId: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  sessionId: number;
  expiresAt: Date;
}

export class AuthService {
  /**
   * Login de usuario
   */
  async login(data: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    // Buscar usuario por nationalId
    const user = await prisma.user.findUnique({
      where: { nationalId: data.nationalId },
    });

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días por defecto

    // Crear sesión en la BD
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
        isActive: true,
      },
    });

    // Generar JWT
    const token = jwt.sign(
      {
        userId: user.id,
        sessionId: session.id,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      } as jwt.SignOptions
    );

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'LOGIN',
        entityType: 'SESSION',
        entityId: session.id,
        description: `User ${user.fullName} logged in`,
        metadata: { ipAddress, userAgent },
      },
    });

    logger.info(`User ${user.nationalId} logged in successfully`, {
      userId: user.id,
      sessionId: session.id,
    });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        nationalId: user.nationalId,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      sessionId: session.id,
      expiresAt: session.expiresAt!,
    };
  }

  /**
   * Logout de usuario
   */
  async logout(sessionId: number, userId: number): Promise<void> {
    // Marcar sesión como inactiva
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'LOGOUT',
        entityType: 'SESSION',
        entityId: sessionId,
        description: 'User logged out',
      },
    });

    logger.info(`User logged out`, { userId, sessionId });
  }

  /**
   * Obtener usuario actual por sesión
   */
  async getCurrentUser(userId: number): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        nationalId: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // El sessionId se obtiene del middleware de autenticación
    return user as any as AuthUser;
  }

  /**
   * Registrar nuevo usuario (solo para ADMIN)
   */
  async register(data: RegisterDto, creatorId?: number): Promise<{ id: number; nationalId: string }> {
    // Verificar si ya existe usuario con ese nationalId
    const existingUser = await prisma.user.findUnique({
      where: { nationalId: data.nationalId },
    });

    if (existingUser) {
      throw new ConflictError('User with this national ID already exists');
    }

    // Verificar email si se proporciona
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new ConflictError('User with this email already exists');
      }
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email || null,
        nationalId: data.nationalId,
        passwordHash,
        role: data.role,
        isActive: true,
      },
    });

    // Registrar en auditoría
    if (creatorId) {
      await prisma.auditLog.create({
        data: {
          actorUserId: creatorId,
          action: 'CREATE',
          entityType: 'USER',
          entityId: user.id,
          description: `User ${user.fullName} created`,
        },
      });
    }

    logger.info(`User created: ${user.nationalId}`, { userId: user.id });

    return {
      id: user.id,
      nationalId: user.nationalId,
    };
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(
    userId: number,
    data: ChangePasswordDto
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidar todas las sesiones activas del usuario (por seguridad)
    await prisma.session.updateMany({
      where: {
        userId: userId,
        isActive: true,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: userId,
        description: 'Password changed',
      },
    });

    logger.info(`Password changed for user`, { userId });
  }
}
