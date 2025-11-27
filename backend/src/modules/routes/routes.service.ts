import { PrismaClient, Prisma } from '@prisma/client';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

const prisma = new PrismaClient();

export class RoutesService {
  /**
   * Crear una nueva ruta con gastos
   * WORKER: Puede crear rutas solo para su bus asignado
   * ADMIN: Puede crear rutas para cualquier bus
   */
  async createRoute(data: CreateRouteDto, _userId: number, _userRole: string) {
    // Convertir nombres de gastos a MAYÚSCULAS
    const expenses = data.expenses.map(expense => ({
      expenseName: expense.expenseName.toUpperCase(),
      amount: new Prisma.Decimal(expense.amount),
    }));

    // Calcular total de gastos
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    // Calcular ingreso neto
    const netIncome = data.totalIncome - totalExpenses;

    // Crear la ruta con gastos en una transacción
    const route = await prisma.route.create({
      data: {
        busId: data.busId,
        workerId: data.workerId,
        routeName: data.routeName,
        routeDate: new Date(data.routeDate),
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        totalIncome: new Prisma.Decimal(data.totalIncome),
        totalExpenses: new Prisma.Decimal(totalExpenses),
        netIncome: new Prisma.Decimal(netIncome),
        notes: data.notes,
        isLocked: data.isLocked ?? true, // Por defecto bloqueada
        routeExpenses: {
          create: expenses,
        },
      },
      include: {
        routeExpenses: true,
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
          },
        },
      },
    });

    return route;
  }

  /**
   * Obtener todas las rutas con filtros
   * WORKER: Solo ve rutas de su bus asignado
   * ADMIN: Ve todas las rutas
   */
  async getRoutes(
    _userId: number,
    userRole: string,
    assignedBusId: number | null,
    filters?: {
      busId?: number;
      workerId?: number;
      routeDate?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const where: Prisma.RouteWhereInput = {};

    // WORKER solo ve rutas de su bus asignado
    if (userRole === 'WORKER' && assignedBusId) {
      where.busId = assignedBusId;
    }

    // Aplicar filtros adicionales
    if (filters?.busId) {
      where.busId = filters.busId;
    }

    if (filters?.workerId) {
      where.workerId = filters.workerId;
    }

    if (filters?.routeDate) {
      where.routeDate = new Date(filters.routeDate);
    }

    if (filters?.startDate || filters?.endDate) {
      where.routeDate = {};
      if (filters.startDate) {
        where.routeDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.routeDate.lte = new Date(filters.endDate);
      }
    }

    const routes = await prisma.route.findMany({
      where,
      include: {
        routeExpenses: true,
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
          },
        },
      },
      orderBy: {
        routeDate: 'desc',
      },
    });

    return routes;
  }

  /**
   * Obtener una ruta por ID
   * WORKER: Solo puede ver rutas de su bus asignado
   * ADMIN: Puede ver cualquier ruta
   */
  async getRouteById(
    routeId: number,
    _userId: number,
    userRole: string,
    assignedBusId: number | null
  ) {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        routeExpenses: true,
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
          },
        },
      },
    });

    if (!route) {
      throw new Error('Ruta no encontrada');
    }

    // WORKER solo puede ver rutas de su bus asignado
    if (userRole === 'WORKER' && route.busId !== assignedBusId) {
      throw new Error('No tienes permiso para ver esta ruta');
    }

    return route;
  }

  /**
   * Actualizar una ruta
   * Solo ADMIN puede actualizar rutas
   * Las rutas bloqueadas no pueden ser editadas
   */
  async updateRoute(
    routeId: number,
    data: UpdateRouteDto,
    _userId: number,
    userRole: string
  ) {
    // Solo ADMIN puede actualizar
    if (userRole !== 'ADMIN') {
      throw new Error('Solo los administradores pueden editar rutas');
    }

    // Verificar que la ruta existe
    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!existingRoute) {
      throw new Error('Ruta no encontrada');
    }

    // ADMIN puede editar cualquier ruta, incluso si está bloqueada
    // No hay restricción adicional para ADMIN

    // Preparar datos de actualización
    const updateData: Prisma.RouteUpdateInput = {};

    if (data.busId !== undefined) {
      updateData.bus = { connect: { id: data.busId } };
    }
    if (data.workerId !== undefined) {
      updateData.worker = { connect: { id: data.workerId } };
    }
    if (data.routeName !== undefined) updateData.routeName = data.routeName;
    if (data.routeDate !== undefined)
      updateData.routeDate = new Date(data.routeDate);
    if (data.startTime !== undefined)
      updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isLocked !== undefined) updateData.isLocked = data.isLocked;

    // Si se actualizan gastos, eliminar los viejos y crear los nuevos
    if (data.expenses) {
      const expenses = data.expenses.map(expense => ({
        expenseName: expense.expenseName.toUpperCase(),
        amount: new Prisma.Decimal(expense.amount),
      }));

      const totalExpenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      );

      updateData.totalExpenses = new Prisma.Decimal(totalExpenses);
      updateData.netIncome = new Prisma.Decimal(
        (data.totalIncome ?? Number(existingRoute.totalIncome)) - totalExpenses
      );

      // Eliminar gastos existentes y crear nuevos
      await prisma.routeExpense.deleteMany({
        where: { routeId },
      });

      updateData.routeExpenses = {
        create: expenses,
      };
    }

    // Si se actualiza el ingreso total, recalcular net income
    if (data.totalIncome !== undefined) {
      updateData.totalIncome = new Prisma.Decimal(data.totalIncome);
      const currentExpenses = data.expenses
        ? data.expenses.reduce((sum, e) => sum + e.amount, 0)
        : Number(existingRoute.totalExpenses);
      updateData.netIncome = new Prisma.Decimal(
        data.totalIncome - currentExpenses
      );
    }

    // Actualizar la ruta
    const route = await prisma.route.update({
      where: { id: routeId },
      data: updateData,
      include: {
        routeExpenses: true,
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
          },
        },
      },
    });

    return route;
  }

  /**
   * Eliminar una ruta
   * Solo ADMIN puede eliminar rutas
   */
  async deleteRoute(
    routeId: number,
    _userId: number,
    userRole: string
  ) {
    // Solo ADMIN puede eliminar
    if (userRole !== 'ADMIN') {
      throw new Error('Solo los administradores pueden eliminar rutas');
    }

    // Verificar que existe
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      throw new Error('Ruta no encontrada');
    }

    // Eliminar la ruta (los gastos se eliminan en cascada)
    await prisma.route.delete({
      where: { id: routeId },
    });

    return { message: 'Ruta eliminada exitosamente' };
  }

  /**
   * Obtener estadísticas de rutas
   * WORKER: Solo de su bus asignado
   * ADMIN: De todos los buses o filtrado por busId
   */
  async getRouteStats(
    _userId: number,
    userRole: string,
    assignedBusId: number | null,
    filters?: {
      busId?: number;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const where: Prisma.RouteWhereInput = {};

    // WORKER solo ve stats de su bus
    if (userRole === 'WORKER' && assignedBusId) {
      where.busId = assignedBusId;
    } else if (filters?.busId) {
      where.busId = filters.busId;
    }

    // Filtros de fecha
    if (filters?.startDate || filters?.endDate) {
      where.routeDate = {};
      if (filters.startDate) {
        where.routeDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.routeDate.lte = new Date(filters.endDate);
      }
    }

    const routes = await prisma.route.findMany({
      where,
      select: {
        totalIncome: true,
        totalExpenses: true,
        netIncome: true,
      },
    });

    const totalIncome = routes.reduce(
      (sum, r) => sum + Number(r.totalIncome),
      0
    );
    const totalExpenses = routes.reduce(
      (sum, r) => sum + Number(r.totalExpenses),
      0
    );
    const netIncome = routes.reduce(
      (sum, r) => sum + Number(r.netIncome),
      0
    );

    return {
      totalRoutes: routes.length,
      totalIncome,
      totalExpenses,
      netIncome,
      averageIncome: routes.length > 0 ? totalIncome / routes.length : 0,
      averageExpenses: routes.length > 0 ? totalExpenses / routes.length : 0,
    };
  }
}
