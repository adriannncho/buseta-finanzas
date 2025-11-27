import prisma from '../../config/database';
import { GetAuditLogsQueryDto } from './audit.dto';

export class AuditService {
  /**
   * Obtener logs de auditoría con paginación y filtros
   */
  async getAuditLogs(query: GetAuditLogsQueryDto) {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      action, 
      entityType, 
      startDate, 
      endDate 
    } = query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Construir filtros
    const where: any = {};

    if (userId) {
      where.actorUserId = Number(userId);
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Obtener logs y total
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              nationalId: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getAuditStats(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Contar logs por acción
    const logsByAction = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Contar logs por tipo de entidad
    const logsByEntity = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Total de logs
    const totalLogs = await prisma.auditLog.count({ where });

    // Usuarios más activos
    const topUsers = await prisma.auditLog.groupBy({
      by: ['actorUserId'],
      where: {
        ...where,
        actorUserId: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Obtener información de usuarios
    const userIds = topUsers.map((u) => u.actorUserId).filter((id): id is number => id !== null);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        fullName: true,
        role: true,
      },
    });

    const topUsersWithInfo = topUsers.map((u) => {
      const user = users.find((usr) => usr.id === u.actorUserId);
      return {
        userId: u.actorUserId,
        userName: user?.fullName || 'Unknown',
        role: user?.role || 'Unknown',
        count: u._count.id,
      };
    });

    return {
      totalLogs,
      byAction: logsByAction.map((item) => ({
        action: item.action,
        count: item._count.id,
      })),
      byEntity: logsByEntity.map((item) => ({
        entityType: item.entityType,
        count: item._count.id,
      })),
      topUsers: topUsersWithInfo,
    };
  }
}

export const auditService = new AuditService();
