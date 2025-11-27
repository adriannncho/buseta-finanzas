import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, GetUsersQueryDto } from './users.dto';
import { successResponse } from '../../shared/utils/responses';
import { AuthRequest } from '../../shared/types/common.types';

const usersService = new UsersService();

export class UsersController {
  /**
   * GET /api/users
   * Listar usuarios con filtros y paginación
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const query: GetUsersQueryDto = req.query as any;

      const result = await usersService.getUsers(query, authReq.user!.id);

      successResponse(res, result.users, undefined, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Obtener un usuario por ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await usersService.getUserById(parseInt(id, 10));

      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   * Crear nuevo usuario
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const data: CreateUserDto = req.body;

      const result = await usersService.createUser(data, authReq.user!.id);

      successResponse(res, result, 'Usuario creado', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   * Actualizar usuario
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const data: UpdateUserDto = req.body;

      await usersService.updateUser(parseInt(id, 10), data, authReq.user!.id);

      successResponse(res, { message: 'User updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Eliminar (desactivar) usuario
   */
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      await usersService.deleteUser(parseInt(id, 10), authReq.user!.id);

      successResponse(res, { message: 'User deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/activate
   * Reactivar usuario
   */
  async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      await usersService.activateUser(parseInt(id, 10), authReq.user!.id);

      successResponse(res, { message: 'User activated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
