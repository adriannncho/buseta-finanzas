import { Request, Response } from 'express';
import { expensesService } from './expenses.service';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  getExpenseCategoriesQuerySchema,
  getExpensesQuerySchema,
} from './expenses.dto';
import { successResponse } from '../../shared/utils/responses';
import { AuthRequest } from '../../shared/types/common.types';

export class ExpensesController {
  // ==================== CATEGORÍAS ====================

  async getExpenseCategories(req: Request, res: Response) {
    const query = getExpenseCategoriesQuerySchema.parse(req.query);
    const result = await expensesService.getExpenseCategories(query);
    return successResponse(res, result);
  }

  async getExpenseCategoryById(req: Request, res: Response) {
    const { id } = req.params;
    const category = await expensesService.getExpenseCategoryById(parseInt(id, 10));
    return successResponse(res, category);
  }

  async createExpenseCategory(req: AuthRequest, res: Response) {
    const data: CreateExpenseCategoryDto = req.body;
    const userId = req.user!.id;
    const category = await expensesService.createExpenseCategory(data, userId);
    return successResponse(res, category, 'Categoría creada', 201);
  }

  async updateExpenseCategory(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data: UpdateExpenseCategoryDto = req.body;
    const userId = req.user!.id;
    const category = await expensesService.updateExpenseCategory(parseInt(id, 10), data, userId);
    return successResponse(res, category);
  }

  async deleteExpenseCategory(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const category = await expensesService.deleteExpenseCategory(parseInt(id, 10), userId);
    return successResponse(res, category);
  }

  async activateExpenseCategory(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const category = await expensesService.activateExpenseCategory(parseInt(id, 10), userId);
    return successResponse(res, category);
  }

  // ==================== GASTOS ====================

  async getExpenses(req: Request, res: Response) {
    const query = getExpensesQuerySchema.parse(req.query);
    const result = await expensesService.getExpenses(query);
    return successResponse(res, result);
  }

  async getExpenseStatistics(req: Request, res: Response) {
    const { categoryId, startDate, endDate } = req.query;
    const stats = await expensesService.getExpenseStatistics(
      categoryId ? parseInt(categoryId as string, 10) : undefined,
      startDate as string | undefined,
      endDate as string | undefined
    );
    return successResponse(res, stats);
  }

  async getExpenseById(req: Request, res: Response) {
    const { id } = req.params;
    const expense = await expensesService.getExpenseById(parseInt(id, 10));
    return successResponse(res, expense);
  }

  async createExpense(req: AuthRequest, res: Response) {
    const data: CreateExpenseDto = req.body;
    const userId = req.user!.id;
    const expense = await expensesService.createExpense(data, userId);
    return successResponse(res, expense, 'Gasto creado', 201);
  }

  async updateExpense(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data: UpdateExpenseDto = req.body;
    const userId = req.user!.id;
    const expense = await expensesService.updateExpense(parseInt(id, 10), data, userId);
    return successResponse(res, expense);
  }

  async deleteExpense(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await expensesService.deleteExpense(parseInt(id, 10), userId);
    return successResponse(res, result);
  }
}

export const expensesController = new ExpensesController();
