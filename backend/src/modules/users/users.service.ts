import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { CreateUserDto, UpdateUserDto, GetUsersQueryDto } from './users.dto';
import { ConflictError, NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { parsePaginationParams } from '../../shared/utils/response.utils';
import logger from '../../config/logger';

const SALT_ROUNDS = 10;

interface UserListResponse {
  users: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UsersService {
  /**
   * Listar usuarios con paginación y filtros
   */
  async getUsers(query: GetUsersQueryDto, actorId: number): Promise<UserListResponse> {
    const { page, limit, offset } = parsePaginationParams(query.page, query.limit);

    // Construir filtros
    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { nationalId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Obtener total
    const total = await prisma.user.count({ where });

    // Obtener usuarios
    const users = await prisma.user.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    logger.info(`User ${actorId} listed users`, { total, filters: query });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener un usuario por ID
   */
  async getUserById(userId: number): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(data: CreateUserDto, actorId: number): Promise<{ id: number; nationalId: string }> {
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
        assignedBusId: data.assignedBusId || null,
        isActive: data.isActive ?? true,
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'CREATE',
        entityType: 'USER',
        entityId: user.id,
        description: `User ${user.fullName} created`,
        metadata: { role: user.role, nationalId: user.nationalId },
      },
    });

    logger.info(`User created by ${actorId}`, { userId: user.id, nationalId: user.nationalId });

    return {
      id: user.id,
      nationalId: user.nationalId,
    };
  }

  /**
   * Actualizar usuario
   */
  async updateUser(userId: number, data: UpdateUserDto, actorId: number): Promise<void> {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verificar email si se está actualizando
    if (data.email && data.email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new ConflictError('Email already in use by another user');
      }
    }

    // Verificar nationalId si se está actualizando
    if (data.nationalId && data.nationalId !== user.nationalId) {
      const existingNationalId = await prisma.user.findUnique({
        where: { nationalId: data.nationalId },
      });

      if (existingNationalId) {
        throw new ConflictError('National ID already in use by another user');
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.nationalId && { nationalId: data.nationalId }),
      ...(data.role && { role: data.role }),
      ...(data.assignedBusId !== undefined && { assignedBusId: data.assignedBusId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    // Si se proporciona una nueva contraseña, hashearla
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: userId,
        description: `User ${user.fullName} updated`,
        metadata: { changes: data },
      },
    });

    logger.info(`User updated by ${actorId}`, { userId });
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async deleteUser(userId: number, actorId: number): Promise<void> {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // No permitir eliminar el propio usuario
    if (userId === actorId) {
      throw new BadRequestError('Cannot delete your own user account');
    }

    // Soft delete (desactivar)
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Invalidar sesiones del usuario
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'DELETE',
        entityType: 'USER',
        entityId: userId,
        description: `User ${user.fullName} deactivated`,
      },
    });

    logger.info(`User deleted by ${actorId}`, { userId });
  }

  /**
   * Reactivar usuario
   */
  async activateUser(userId: number, actorId: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: userId,
        description: `User ${user.fullName} activated`,
      },
    });

    logger.info(`User activated by ${actorId}`, { userId });
  }
}
