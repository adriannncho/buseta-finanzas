import { PrismaClient, Prisma } from '@prisma/client';
import { CreateDailyReportDto, UpdateDailyReportDto, GetDailyReportsQueryDto } from './daily-reports.dto';
import { BadRequestError, NotFoundError } from '../../shared/utils/errors';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export class DailyReportsService {
  /**
   * Obtener listado de reportes diarios con paginación y filtros
   */
  async getDailyReports(query: GetDailyReportsQueryDto) {
    const { page, limit, busId, workerId, startDate, endDate, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.DailyReportWhereInput = {};

    if (busId) {
      where.busId = busId;
    }

    if (workerId) {
      where.workerId = workerId;
    }

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) {
        where.reportDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.reportDate.lte = new Date(endDate);
      }
    }

    // Construir ordenamiento
    const orderBy: Prisma.DailyReportOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // Ejecutar queries en paralelo
    const [reports, total] = await Promise.all([
      prisma.dailyReport.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          bus: {
            select: {
              id: true,
              internalCode: true,
              plateNumber: true,
            },
          },
          worker: {
            select: {
              id: true,
              fullName: true,
              nationalId: true,
            },
          },
          busExpenses: {
            select: {
              id: true,
              amount: true,
              description: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.dailyReport.count({ where }),
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un reporte diario por ID
   */
  async getDailyReportById(id: number) {
    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        bus: {
          select: {
            id: true,
            internalCode: true,
            plateNumber: true,
            description: true,
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            email: true,
          },
        },
        busExpenses: {
          include: {
            category: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundError('Reporte diario no encontrado');
    }

    return report;
  }

  /**
   * Obtener estadísticas de reportes
   */
  async getStatistics(busId?: number, startDate?: string, endDate?: string) {
    const where: Prisma.DailyReportWhereInput = {};

    if (busId) {
      where.busId = busId;
    }

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) {
        where.reportDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.reportDate.lte = new Date(endDate);
      }
    }

    const stats = await prisma.dailyReport.aggregate({
      where,
      _sum: {
        totalIncome: true,
        totalExpenses: true,
        netIncome: true,
      },
      _avg: {
        totalIncome: true,
        totalExpenses: true,
        netIncome: true,
      },
      _count: true,
    });

    return {
      totalReports: stats._count,
      totalIncome: stats._sum.totalIncome || 0,
      totalExpenses: stats._sum.totalExpenses || 0,
      totalNetIncome: stats._sum.netIncome || 0,
      avgIncome: stats._avg.totalIncome || 0,
      avgExpenses: stats._avg.totalExpenses || 0,
      avgNetIncome: stats._avg.netIncome || 0,
    };
  }

  /**
   * Crear un nuevo reporte diario
   */
  async createDailyReport(data: CreateDailyReportDto, userId: number) {
    // Verificar que el bus existe y está activo
    const bus = await prisma.bus.findUnique({
      where: { id: data.busId },
    });

    if (!bus) {
      throw new NotFoundError('Bus no encontrado');
    }

    if (!bus.isActive) {
      throw new BadRequestError('El bus no está activo');
    }

    // Verificar que el trabajador existe y está activo
    const worker = await prisma.user.findUnique({
      where: { id: data.workerId },
    });

    if (!worker) {
      throw new NotFoundError('Trabajador no encontrado');
    }

    if (!worker.isActive) {
      throw new BadRequestError('El trabajador no está activo');
    }

    // Calcular el ingreso neto
    const netIncome = data.totalIncome - data.totalExpenses;

    // Crear el reporte
    const report = await prisma.dailyReport.create({
      data: {
        busId: data.busId,
        workerId: data.workerId,
        reportDate: new Date(data.reportDate),
        totalIncome: data.totalIncome,
        totalExpenses: data.totalExpenses,
        netIncome,
        notes: data.notes,
      },
      include: {
        bus: {
          select: {
            internalCode: true,
            plateNumber: true,
          },
        },
        worker: {
          select: {
            fullName: true,
          },
        },
      },
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'CREATE_DAILY_REPORT',
        entityType: 'DailyReport',
        entityId: report.id,
        metadata: { report },
      },
    });

    logger.info(`Reporte diario creado para bus ${report.bus.internalCode}`, {
      userId,
      reportId: report.id,
      reportDate: report.reportDate,
    });

    return report;
  }

  /**
   * Actualizar un reporte diario
   */
  async updateDailyReport(id: number, data: UpdateDailyReportDto, userId: number) {
    const report = await prisma.dailyReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError('Reporte diario no encontrado');
    }

    // Si se está actualizando el bus, verificar que existe y está activo
    if (data.busId) {
      const bus = await prisma.bus.findUnique({
        where: { id: data.busId },
      });

      if (!bus) {
        throw new NotFoundError('Bus no encontrado');
      }

      if (!bus.isActive) {
        throw new BadRequestError('El bus no está activo');
      }
    }

    // Si se está actualizando el trabajador, verificar que existe y está activo
    if (data.workerId) {
      const worker = await prisma.user.findUnique({
        where: { id: data.workerId },
      });

      if (!worker) {
        throw new NotFoundError('Trabajador no encontrado');
      }

      if (!worker.isActive) {
        throw new BadRequestError('El trabajador no está activo');
      }
    }

    // Calcular el nuevo ingreso neto si cambian los valores
    const totalIncome = data.totalIncome ?? report.totalIncome;
    const totalExpenses = data.totalExpenses ?? report.totalExpenses;
    const netIncome = totalIncome - totalExpenses;

    const updateData: any = {
      ...data,
      netIncome,
    };

    if (data.reportDate) {
      updateData.reportDate = new Date(data.reportDate);
    }

    const updated = await prisma.dailyReport.update({
      where: { id },
      data: updateData,
      include: {
        bus: {
          select: {
            internalCode: true,
            plateNumber: true,
          },
        },
        worker: {
          select: {
            fullName: true,
          },
        },
      },
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'UPDATE_DAILY_REPORT',
        entityType: 'DailyReport',
        entityId: id,
        metadata: { previous: report, updated },
      },
    });

    logger.info(`Reporte diario actualizado: ${id}`, {
      userId,
      reportId: id,
    });

    return updated;
  }

  /**
   * Eliminar un reporte diario
   */
  async deleteDailyReport(id: number, userId: number) {
    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        busExpenses: true,
      },
    });

    if (!report) {
      throw new NotFoundError('Reporte diario no encontrado');
    }

    // Verificar que no tenga gastos asociados
    if (report.busExpenses.length > 0) {
      throw new BadRequestError(
        'No se puede eliminar el reporte porque tiene gastos asociados. Elimina los gastos primero.'
      );
    }

    await prisma.dailyReport.delete({
      where: { id },
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'DELETE_DAILY_REPORT',
        entityType: 'DailyReport',
        entityId: id,
        metadata: { report },
      },
    });

    logger.info(`Reporte diario eliminado: ${id}`, {
      userId,
      reportId: id,
    });

    return { success: true };
  }
}

export const dailyReportsService = new DailyReportsService();
