import { PrismaClient } from '@prisma/client';
import { CreateBusDto, UpdateBusDto, GetBusesQueryDto } from './buses.dto';
import { BadRequestError, NotFoundError, ConflictError } from '../../shared/utils/errors';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export class BusesService {
  /**
   * Obtener listado de buses con paginación y filtros
   */
  async getBuses(query: GetBusesQueryDto) {
    const { page, limit, search, isActive } = query;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { internalCode: { contains: search, mode: 'insensitive' } },
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Ejecutar queries en paralelo
    const [buses, total] = await Promise.all([
      prisma.bus.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bus.count({ where }),
    ]);

    return {
      data: buses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un bus por ID
   */
  async getBusById(id: number) {
    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        routes: {
          orderBy: { routeDate: 'desc' },
          take: 5,
        },
        assignedWorkers: true,
      },
    });

    if (!bus) {
      throw new NotFoundError('Bus no encontrado');
    }

    return bus;
  }

  /**
   * Crear un nuevo bus
   */
  async createBus(data: CreateBusDto, userId: number) {
    // Verificar que no exista un bus con el mismo código interno
    const existingByCode = await prisma.bus.findUnique({
      where: { internalCode: data.internalCode },
    });

    if (existingByCode) {
      throw new ConflictError('Ya existe un bus con ese código interno');
    }

    // Verificar que no exista un bus con la misma placa
    const existingByPlate = data.plateNumber ? await prisma.bus.findFirst({
      where: { plateNumber: data.plateNumber },
    }) : null;

    if (existingByPlate) {
      throw new ConflictError('Ya existe un bus con esa placa');
    }

    const bus = await prisma.bus.create({
      data: {
        internalCode: data.internalCode,
        plateNumber: data.plateNumber,
        description: data.description,
        monthlyTarget: data.monthlyTarget || 0,
      },
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'CREATE_BUS',
        entityType: 'Bus',
        entityId: bus.id,
        metadata: { bus },
      },
    });

    logger.info(`Bus creado: ${bus.internalCode}`, { userId, busId: bus.id });

    return bus;
  }

  /**
   * Actualizar un bus
   */
  async updateBus(id: number, data: UpdateBusDto, userId: number) {
    const bus = await prisma.bus.findUnique({ where: { id } });

    if (!bus) {
      throw new NotFoundError('Bus no encontrado');
    }

    // Si se está actualizando el código interno, verificar que no exista otro con ese código
    if (data.internalCode && data.internalCode !== bus.internalCode) {
      const existing = await prisma.bus.findUnique({
        where: { internalCode: data.internalCode },
      });

      if (existing) {
        throw new ConflictError('Ya existe un bus con ese código interno');
      }
    }

    // Si se está actualizando la placa, verificar que no exista otro con esa placa
    if (data.plateNumber && data.plateNumber !== bus.plateNumber) {
      const existing = await prisma.bus.findFirst({
        where: { plateNumber: data.plateNumber },
      });

      if (existing) {
        throw new ConflictError('Ya existe un bus con esa placa');
      }
    }

    const updated = await prisma.bus.update({
      where: { id },
      data,
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'UPDATE_BUS',
        entityType: 'Bus',
        entityId: id,
        metadata: { previous: bus, updated },
      },
    });

    logger.info(`Bus actualizado: ${updated.internalCode}`, { userId, busId: id });

    return updated;
  }

  /**
   * Eliminar (soft delete) un bus
   */
  async deleteBus(id: number, userId: number) {
    const bus = await prisma.bus.findUnique({ where: { id } });

    if (!bus) {
      throw new NotFoundError('Bus no encontrado');
    }

    if (!bus.isActive) {
      throw new BadRequestError('El bus ya está inactivo');
    }

    const updated = await prisma.bus.update({
      where: { id },
      data: { isActive: false },
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'DELETE_BUS',
        entityType: 'Bus',
        entityId: id,
        metadata: { bus },
      },
    });

    logger.info(`Bus eliminado (soft): ${bus.internalCode}`, { userId, busId: id });

    return updated;
  }

  /**
   * Activar un bus
   */
  async activateBus(id: number, userId: number) {
    const bus = await prisma.bus.findUnique({ where: { id } });

    if (!bus) {
      throw new NotFoundError('Bus no encontrado');
    }

    if (bus.isActive) {
      throw new BadRequestError('El bus ya está activo');
    }

    const updated = await prisma.bus.update({
      where: { id },
      data: { isActive: true },
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'ACTIVATE_BUS',
        entityType: 'Bus',
        entityId: id,
        metadata: { bus },
      },
    });

    logger.info(`Bus activado: ${bus.internalCode}`, { userId, busId: id });

    return updated;
  }

  /**
   * Obtener estadísticas mensuales de un bus
   */
  async getMonthlyStats(busId: number, year?: number, month?: number) {
    const bus = await prisma.bus.findUnique({ where: { id: busId } });

    if (!bus) {
      throw new NotFoundError('Bus no encontrado');
    }

    // Usar mes/año actual si no se especifican
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1; // getMonth() es 0-indexed

    // Calcular primer y último día del mes
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Obtener todas las rutas del mes para este bus
    const routes = await prisma.route.findMany({
      where: {
        busId,
        routeDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalIncome: true,
        totalExpenses: true,
        netIncome: true,
      },
    });

    // Obtener gastos administrativos del mes
    const busExpenses = await prisma.busExpense.findMany({
      where: {
        busId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    });

    // Calcular totales de rutas
    const totalIncome = routes.reduce(
      (sum, route) => sum + (Number(route.totalIncome) || 0),
      0
    );

    const totalExpenses = routes.reduce(
      (sum, route) => sum + (Number(route.totalExpenses) || 0),
      0
    );

    // Calcular gastos administrativos
    const administrativeExpenses = busExpenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0),
      0
    );

    // Calcular utilidades
    const operationalProfit = totalIncome - totalExpenses;
    const netProfit = operationalProfit - administrativeExpenses;
    const monthlyTarget = Number(bus.monthlyTarget) || 0;
    const targetProgress = monthlyTarget > 0 ? (netProfit / monthlyTarget) * 100 : 0;

    return {
      busId: bus.id,
      busCode: bus.internalCode,
      year: targetYear,
      month: targetMonth,
      totalIncome,
      totalExpenses, // Gastos de rutas
      operationalProfit, // Utilidad operacional (ingresos - gastos de rutas)
      administrativeExpenses, // Gastos administrativos (SOAT, mantenimiento, etc)
      netProfit, // Utilidad neta real (operacional - administrativos)
      monthlyTarget,
      targetProgress: Math.min(targetProgress, 100), // Cap at 100%
      routesCount: routes.length,
    };
  }
}

export const busesService = new BusesService();
