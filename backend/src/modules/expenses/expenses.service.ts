import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  GetExpenseCategoriesQueryDto,
  GetExpensesQueryDto,
} from './expenses.dto';
import { BadRequestError, NotFoundError, ConflictError } from '../../shared/utils/errors';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export class ExpensesService {
  // ==================== CATEGORÍAS ====================

  /**
   * Obtener listado de categorías de gastos
   */
  async getExpenseCategories(query: GetExpenseCategoriesQueryDto) {
    const { page, limit, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseCategoryWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [categories, total] = await Promise.all([
      prisma.expenseCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { busExpenses: true },
          },
        },
      }),
      prisma.expenseCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener una categoría por ID
   */
  async getExpenseCategoryById(id: number) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        busExpenses: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            bus: {
              select: {
                internalCode: true,
                plateNumber: true,
              },
            },
          },
        },
        _count: {
          select: { busExpenses: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    return category;
  }

  /**
   * Crear una categoría de gasto
   */
  async createExpenseCategory(data: CreateExpenseCategoryDto, userId: number) {
    // Verificar que no exista una categoría con el mismo nombre
    const existing = await prisma.expenseCategory.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictError('Ya existe una categoría con ese nombre');
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'CREATE_EXPENSE_CATEGORY',
        entityType: 'ExpenseCategory',
        entityId: category.id,
        metadata: { category },
      },
    });

    logger.info(`Categoría de gasto creada: ${category.name}`, { userId, categoryId: category.id });

    return category;
  }

  /**
   * Actualizar una categoría de gasto
   */
  async updateExpenseCategory(id: number, data: UpdateExpenseCategoryDto, userId: number) {
    const category = await prisma.expenseCategory.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    // Si se está actualizando el nombre, verificar que no exista otra con ese nombre
    if (data.name && data.name !== category.name) {
      const existing = await prisma.expenseCategory.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new ConflictError('Ya existe una categoría con ese nombre');
      }
    }

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'UPDATE_EXPENSE_CATEGORY',
        entityType: 'ExpenseCategory',
        entityId: id,
        metadata: { previous: category, updated },
      },
    });

    logger.info(`Categoría actualizada: ${updated.name}`, { userId, categoryId: id });

    return updated;
  }

  /**
   * Eliminar (soft delete) una categoría
   */
  async deleteExpenseCategory(id: number, userId: number) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { busExpenses: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    if (category._count.busExpenses > 0) {
      throw new BadRequestError(
        'No se puede eliminar la categoría porque tiene gastos asociados'
      );
    }

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'DELETE_EXPENSE_CATEGORY',
        entityType: 'ExpenseCategory',
        entityId: id,
        metadata: { category },
      },
    });

    logger.info(`Categoría eliminada: ${category.name}`, { userId, categoryId: id });

    return updated;
  }

  /**
   * Activar una categoría
   */
  async activateExpenseCategory(id: number, userId: number) {
    const category = await prisma.expenseCategory.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    if (category.isActive) {
      throw new BadRequestError('La categoría ya está activa');
    }

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'ACTIVATE_EXPENSE_CATEGORY',
        entityType: 'ExpenseCategory',
        entityId: id,
        metadata: { category },
      },
    });

    logger.info(`Categoría activada: ${category.name}`, { userId, categoryId: id });

    return updated;
  }

  // ==================== GASTOS ====================

  /**
   * Obtener listado de gastos
   */
  async getExpenses(query: GetExpensesQueryDto) {
    const { page, limit, busId, categoryId, startDate, endDate, minAmount, maxAmount } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BusExpenseWhereInput = {};

    if (busId) {
      where.busId = busId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.expenseDate.lte = new Date(endDate);
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount.lte = maxAmount;
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.busExpense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          bus: {
            select: {
              id: true,
              internalCode: true,
              plateNumber: true,
            },
          },
        },
      }),
      prisma.busExpense.count({ where }),
    ]);

    return {
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un gasto por ID
   */
  async getExpenseById(id: number) {
    const expense = await prisma.busExpense.findUnique({
      where: { id },
      include: {
        category: true,
        bus: {
          select: {
            internalCode: true,
            plateNumber: true,
          },
        },
        creator: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError('Gasto no encontrado');
    }

    return expense;
  }

  /**
   * Crear un gasto
   */
  async createExpense(data: CreateExpenseDto, userId: number) {
    // Verificar que la categoría existe y está activa
    const category = await prisma.expenseCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }

    if (!category.isActive) {
      throw new BadRequestError('La categoría no está activa');
    }

    // Crear el gasto
    const expense = await prisma.busExpense.create({
      data: {
        busId: data.busId,
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        createdBy: userId,
      },
      include: {
        category: true,
        bus: {
          select: {
            internalCode: true,
            plateNumber: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'CREATE_EXPENSE',
        entityType: 'BusExpense',
        entityId: expense.id,
        metadata: { expense },
      },
    });

    logger.info(`Gasto creado: ${expense.amount} en ${expense.category.name}`, {
      userId,
      expenseId: expense.id,
    });

    return expense;
  }

  /**
   * Actualizar un gasto
   */
  async updateExpense(id: number, data: UpdateExpenseDto, userId: number) {
    const expense = await prisma.busExpense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundError('Gasto no encontrado');
    }

    // Si se está actualizando la categoría, verificar que existe y está activa
    if (data.categoryId) {
      const category = await prisma.expenseCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new NotFoundError('Categoría no encontrada');
      }

      if (!category.isActive) {
        throw new BadRequestError('La categoría no está activa');
      }
    }

    // Actualizar el gasto
    const updateData: any = { ...data };
    
    // Convertir expenseDate a Date si viene como string
    if (data.expenseDate) {
      updateData.expenseDate = new Date(data.expenseDate);
    }
    
    const result = await prisma.busExpense.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        bus: {
          select: {
            internalCode: true,
            plateNumber: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'UPDATE_EXPENSE',
        entityType: 'BusExpense',
        entityId: id,
        metadata: { previous: expense, updated: result },
      },
    });

    logger.info(`Gasto actualizado: ${id}`, { userId, expenseId: id });

    return result;
  }

  /**
   * Eliminar un gasto
   */
  async deleteExpense(id: number, userId: number) {
    const expense = await prisma.busExpense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundError('Gasto no encontrado');
    }

    // Eliminar el gasto
    await prisma.busExpense.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'DELETE_EXPENSE',
        entityType: 'BusExpense',
        entityId: id,
        metadata: { expense },
      },
    });

    logger.info(`Gasto eliminado: ${id}`, { userId, expenseId: id });

    return { success: true };
  }

  /**
   * Obtener estadísticas de gastos
   */
  async getExpenseStatistics(categoryId?: number, startDate?: string, endDate?: string) {
    const where: Prisma.BusExpenseWhereInput = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.expenseDate.lte = new Date(endDate);
      }
    }

    const [stats, byCategory] = await Promise.all([
      prisma.busExpense.aggregate({
        where,
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
      prisma.busExpense.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Obtener nombres de categorías
    const categoryIds = byCategory.map((item) => item.categoryId);
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

    return {
      totalExpenses: stats._sum.amount || 0,
      avgExpense: stats._avg.amount || 0,
      totalCount: stats._count,
      byCategory: byCategory.map((item) => ({
        categoryId: item.categoryId,
        categoryName: categoryMap.get(item.categoryId) || 'Desconocida',
        total: item._sum.amount || 0,
        count: item._count,
      })),
    };
  }
}

export const expensesService = new ExpensesService();
