import { Request, Response, NextFunction } from 'express';
import { profitSharingService } from './profit-sharing.service';
import {
  createProfitSharingGroupSchema,
  updateProfitSharingGroupSchema,
  getProfitSharingGroupsQuerySchema,
  createProfitSharingMemberSchema,
  updateProfitSharingMemberSchema,
  getProfitSharingMembersQuerySchema,
} from './profit-sharing.dto';
import { successResponse } from '../../shared/utils/responses';
import { AuthRequest } from '../../shared/types/common.types';

export class ProfitSharingController {
  // ==================== GRUPOS ====================

  async getProfitSharingGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getProfitSharingGroupsQuerySchema.parse(req.query);
      const result = await profitSharingService.getProfitSharingGroups(query);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getProfitSharingGroupById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const group = await profitSharingService.getProfitSharingGroupById(parseInt(id, 10));
      return successResponse(res, group);
    } catch (error) {
      next(error);
    }
  }

  async createProfitSharingGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createProfitSharingGroupSchema.parse(req.body);
      const createdBy = req.user!.id;
      const group = await profitSharingService.createProfitSharingGroup(data, createdBy);
      return successResponse(res, group, 'Grupo creado', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProfitSharingGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateProfitSharingGroupSchema.parse(req.body);
      const updated = await profitSharingService.updateProfitSharingGroup(parseInt(id, 10), data);
      return successResponse(res, updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteProfitSharingGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await profitSharingService.deleteProfitSharingGroup(parseInt(id, 10));
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== MIEMBROS ====================

  async getProfitSharingMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getProfitSharingMembersQuerySchema.parse(req.query);
      const members = await profitSharingService.getProfitSharingMembers(query);
      return successResponse(res, members);
    } catch (error) {
      next(error);
    }
  }

  async getProfitSharingMemberById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const member = await profitSharingService.getProfitSharingMemberById(parseInt(id, 10));
      return successResponse(res, member);
    } catch (error) {
      next(error);
    }
  }

  async createProfitSharingMember(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProfitSharingMemberSchema.parse(req.body);
      const member = await profitSharingService.createProfitSharingMember(data);
      return successResponse(res, member, 'Miembro creado', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProfitSharingMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateProfitSharingMemberSchema.parse(req.body);
      const updated = await profitSharingService.updateProfitSharingMember(parseInt(id, 10), data);
      return successResponse(res, updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteProfitSharingMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await profitSharingService.deleteProfitSharingMember(parseInt(id, 10));
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== CÁLCULOS ====================

  async getProfitDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      
      const distribution = await profitSharingService.getProfitDistribution(
        parseInt(id, 10),
        startDate as string | undefined,
        endDate as string | undefined
      );
      
      return successResponse(res, distribution);
    } catch (error) {
      next(error);
    }
  }
}

export const profitSharingController = new ProfitSharingController();
