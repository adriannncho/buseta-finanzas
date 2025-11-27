import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  CreateBudgetItemDto,
  UpdateBudgetItemDto,
  GetBudgetsQueryDto,
  GetBudgetItemsQueryDto,
} from './budgets.dto';
import { BadRequestError, NotFoundError } from '../../shared/utils/errors';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export class BudgetsService {
  // ==================== PRESUPUESTOS ====================

  /**
   * Obtener listado de presupuestos
   */
  async getBudgets(query: GetBudgetsQueryDto) {
    const { page, limit, busId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BudgetWhereInput = {};

    if (busId) {
      where.busId = busId;
    }

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({
          OR: [
            { startDate: { gte: new Date(startDate) } },
            { endDate: { gte: new Date(startDate) } },
          ],
        });
      }
      if (endDate) {
        where.AND.push({
          startDate: { lte: new Date(endDate) },
        });
      }
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bus: {
            select: {
              id: true,
              internalCode: true,
              plateNumber: true,
            },
          },
          budgetItems: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: { budgetItems: true },
          },
        },
      }),
      prisma.budget.count({ where }),
    ]);

    return {
      data: budgets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un presupuesto por ID
   */
  async getBudgetById(id: number) {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        bus: true,
        budgetItems: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundError('Presupuesto no encontrado');
    }

    return budget;
  }

  /**
   * Crear un presupuesto
   */
  async createBudget(data: CreateBudgetDto, userId: number) {
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    // Validar que la fecha de fin sea posterior a la de inicio (solo si se proporciona)
    if (endDate && endDate <= startDate) {
      throw new BadRequestError('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const budget = await prisma.budget.create({
      data: {
        name: data.name,
        busId: data.busId,
        startDate,
        endDate,
        totalPlannedIncome: data.totalPlannedIncome || 0,
        totalPlannedExpense: data.totalPlannedExpense || 0,
        createdBy: userId,
      },
      include: {
        budgetItems: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'CREATE_BUDGET',
        entityType: 'Budget',
        entityId: budget.id,
        metadata: { budget },
      },
    });

    logger.info(`Presupuesto creado: ${budget.name}`, { userId, budgetId: budget.id });

    return budget;
  }

  /**
   * Actualizar un presupuesto
   */
  async updateBudget(id: number, data: UpdateBudgetDto, userId: number) {
    const budget = await prisma.budget.findUnique({ where: { id } });

    if (!budget) {
      throw new NotFoundError('Presupuesto no encontrado');
    }

    // Validar fechas si se están actualizando
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      if (endDate <= startDate) {
        throw new BadRequestError('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    } else if (data.startDate) {
      const startDate = new Date(data.startDate);
      // Solo validar si existe una fecha de fin
      if (budget.endDate && budget.endDate <= startDate) {
        throw new BadRequestError('La fecha de inicio debe ser anterior a la fecha de fin actual');
      }
    } else if (data.endDate) {
      const endDate = new Date(data.endDate);
      if (endDate <= budget.startDate) {
        throw new BadRequestError('La fecha de fin debe ser posterior a la fecha de inicio actual');
      }
    }

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) {
      // Si endDate es null o cadena vacía, establecerlo como null
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        budgetItems: {
          include: {
            category: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'UPDATE_BUDGET',
        entityType: 'Budget',
        entityId: id,
        metadata: { previous: budget, updated },
      },
    });

    logger.info(`Presupuesto actualizado: ${id}`, { userId, budgetId: id });

    return updated;
  }

  /**
   * Eliminar un presupuesto
   */
  async deleteBudget(id: number, userId: number) {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        budgetItems: true,
      },
    });

    if (!budget) {
      throw new NotFoundError('Presupuesto no encontrado');
    }

    // Eliminar items primero, luego el presupuesto
    await prisma.$transaction(async (tx) => {
      await tx.budgetItem.deleteMany({
        where: { budgetId: id },
      });

      await tx.budget.delete({
        where: { id },
      });
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'DELETE_BUDGET',
        entityType: 'Budget',
        entityId: id,
        metadata: { budget },
      },
    });

    logger.info(`Presupuesto eliminado: ${id}`, { userId, budgetId: id });

    return { success: true };
  }

  // ==================== ITEMS DE PRESUPUESTO ====================

  /**
   * Obtener items de presupuesto
   */
  async getBudgetItems(query: GetBudgetItemsQueryDto) {
    const where: Prisma.BudgetItemWhereInput = {};

    if (query.budgetId) {
      where.budgetId = query.budgetId;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    const items = await prisma.budgetItem.findMany({
      where,
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        category: true,
      },
      orderBy: [{ budget: { startDate: 'desc' } }, { category: { name: 'asc' } }],
    });

    return items;
  }

  /**
   * Obtener item de presupuesto por ID
   */
  async getBudgetItemById(id: number) {
    const item = await prisma.budgetItem.findUnique({
      where: { id },
      include: {
        budget: true,
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Item de presupuesto no encontrado');
    }

    return item;
  }

  /**
   * Crear item de presupuesto
   */
  async createBudgetItem(data: CreateBudgetItemDto, userId: number) {
    // Verificar que el presupuesto existe
    const budget = await prisma.budget.findUnique({
      where: { id: data.budgetId },
    });

    if (!budget) {
      throw new NotFoundError('Presupuesto no encontrado');
    }

    // Verificar que la categoría existe
    const category = await prisma.expenseCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    // Verificar que no exista ya un item con la misma categoría en este presupuesto
    const existing = await prisma.budgetItem.findFirst({
      where: {
        budgetId: data.budgetId,
        categoryId: data.categoryId,
      },
    });

    if (existing) {
      throw new BadRequestError('Ya existe un item con esta categoría en el presupuesto');
    }

    const item = await prisma.budgetItem.create({
      data: {
        budgetId: data.budgetId,
        categoryId: data.categoryId,
        plannedAmount: data.plannedAmount,
      },
      include: {
        budget: true,
        category: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'CREATE_BUDGET_ITEM',
        entityType: 'BudgetItem',
        entityId: item.id,
        metadata: { item },
      },
    });

    logger.info(`Item de presupuesto creado`, { userId, itemId: item.id });

    return item;
  }

  /**
   * Actualizar item de presupuesto
   */
  async updateBudgetItem(id: number, data: UpdateBudgetItemDto, userId: number) {
    const item = await prisma.budgetItem.findUnique({
      where: { id },
      include: {
        budget: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Item de presupuesto no encontrado');
    }

    const updated = await prisma.budgetItem.update({
      where: { id },
      data,
      include: {
        budget: true,
        category: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'UPDATE_BUDGET_ITEM',
        entityType: 'BudgetItem',
        entityId: id,
        metadata: { previous: item, updated },
      },
    });

    logger.info(`Item de presupuesto actualizado: ${id}`, { userId, itemId: id });

    return updated;
  }

  /**
   * Eliminar item de presupuesto
   */
  async deleteBudgetItem(id: number, userId: number) {
    const item = await prisma.budgetItem.findUnique({
      where: { id },
      include: {
        budget: true,
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Item de presupuesto no encontrado');
    }

    await prisma.budgetItem.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'DELETE_BUDGET_ITEM',
        entityType: 'BudgetItem',
        entityId: id,
        metadata: { item },
      },
    });

    logger.info(`Item de presupuesto eliminado: ${id}`, { userId, itemId: id });

    return { success: true };
  }

  /**
   * Obtener resumen estadístico de presupuestos
   */
  async getBudgetStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.BudgetWhereInput = {};

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({
          OR: [
            { startDate: { gte: startDate } },
            { endDate: { gte: startDate } },
          ],
        });
      }
      if (endDate) {
        where.AND.push({
          startDate: { lte: endDate },
        });
      }
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        budgetItems: true,
      },
    });

    const totalBudgets = budgets.length;
    const totalPlannedIncome = budgets.reduce((sum, b) => sum + Number(b.totalPlannedIncome), 0);
    const totalPlannedExpense = budgets.reduce((sum, b) => sum + Number(b.totalPlannedExpense), 0);
    const totalCommitted = budgets.reduce((sum, b) => sum + Number(b.totalCommitted), 0);
    const totalExecuted = budgets.reduce((sum, b) => sum + Number(b.totalExecuted), 0);

    return {
      totalBudgets,
      totalPlannedIncome,
      totalPlannedExpense,
      totalCommitted,
      totalExecuted,
      budgets,
    };
  }
}

export const budgetsService = new BudgetsService();
