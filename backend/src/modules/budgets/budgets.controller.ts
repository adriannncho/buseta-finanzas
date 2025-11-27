import { Request, Response } from 'express';
import { budgetsService } from './budgets.service';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  CreateBudgetItemDto,
  UpdateBudgetItemDto,
  getBudgetsQuerySchema,
  getBudgetItemsQuerySchema,
} from './budgets.dto';
import { successResponse } from '../../shared/utils/responses';
import { AuthRequest } from '../../shared/types/common.types';

export class BudgetsController {
  // ==================== PRESUPUESTOS ====================

  async getBudgets(req: Request, res: Response) {
    const query = getBudgetsQuerySchema.parse(req.query);
    const result = await budgetsService.getBudgets(query);
    return successResponse(res, result);
  }

  async getBudgetById(req: Request, res: Response) {
    const { id } = req.params;
    const budget = await budgetsService.getBudgetById(parseInt(id, 10));
    return successResponse(res, budget);
  }

  // async getBudgetAnalysis(req: Request, res: Response) {
  //   const { id } = req.params;
  //   const analysis = await budgetsService.getBudgetAnalysis(parseInt(id, 10));
  //   return successResponse(res, analysis);
  // }

  async createBudget(req: AuthRequest, res: Response) {
    const data: CreateBudgetDto = req.body;
    const userId = req.user!.id;
    const budget = await budgetsService.createBudget(data, userId);
    return successResponse(res, budget, 'Presupuesto creado', 201);
  }

  async updateBudget(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data: UpdateBudgetDto = req.body;
    const userId = req.user!.id;
    const budget = await budgetsService.updateBudget(parseInt(id, 10), data, userId);
    return successResponse(res, budget);
  }

  async deleteBudget(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await budgetsService.deleteBudget(parseInt(id, 10), userId);
    return successResponse(res, result);
  }

  // ==================== ITEMS ====================

  async getBudgetItems(req: Request, res: Response) {
    const query = getBudgetItemsQuerySchema.parse(req.query);
    const items = await budgetsService.getBudgetItems(query);
    return successResponse(res, items);
  }

  async getBudgetItemById(req: Request, res: Response) {
    const { id } = req.params;
    const item = await budgetsService.getBudgetItemById(parseInt(id, 10));
    return successResponse(res, item);
  }

  async createBudgetItem(req: AuthRequest, res: Response) {
    const data: CreateBudgetItemDto = req.body;
    const userId = req.user!.id;
    const item = await budgetsService.createBudgetItem(data, userId);
    return successResponse(res, item, 'Item creado', 201);
  }

  async updateBudgetItem(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data: UpdateBudgetItemDto = req.body;
    const userId = req.user!.id;
    const item = await budgetsService.updateBudgetItem(parseInt(id, 10), data, userId);
    return successResponse(res, item);
  }

  async deleteBudgetItem(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await budgetsService.deleteBudgetItem(parseInt(id, 10), userId);
    return successResponse(res, result);
  }
}

export const budgetsController = new BudgetsController();
