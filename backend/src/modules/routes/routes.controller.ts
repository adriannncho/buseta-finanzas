import { Request, Response, NextFunction } from 'express';
import { RoutesService } from './routes.service';
import { CreateRouteSchema } from './dto/create-route.dto';
import { UpdateRouteSchema } from './dto/update-route.dto';
import { z } from 'zod';

const routesService = new RoutesService();

export class RoutesController {
  /**
   * Crear una nueva ruta
   * POST /api/routes
   */
  async createRoute(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar datos
      const validatedData = CreateRouteSchema.parse(req.body);

      // Obtener datos del usuario autenticado
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const assignedBusId = (req as any).user?.assignedBusId;

      if (!userId || !userRole) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      // WORKER solo puede crear rutas para su bus asignado
      if (userRole === 'WORKER') {
        if (!assignedBusId) {
          return res
            .status(403)
            .json({ error: 'No tienes un bus asignado' });
        }
        if (validatedData.busId !== assignedBusId) {
          return res
            .status(403)
            .json({ error: 'Solo puedes crear rutas para tu bus asignado' });
        }
        // WORKER solo puede crear rutas para sí mismo
        if (validatedData.workerId !== userId) {
          return res
            .status(403)
            .json({ error: 'Solo puedes crear rutas para ti mismo' });
        }
      }

      const route = await routesService.createRoute(
        validatedData,
        userId,
        userRole
      );

      res.status(201).json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return next(error);
    }
  }

  /**
   * Obtener todas las rutas con filtros
   * GET /api/routes
   */
  async getRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const assignedBusId = (req as any).user?.assignedBusId;

      if (!userId || !userRole) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const filters = {
        busId: req.query.busId ? parseInt(req.query.busId as string) : undefined,
        workerId: req.query.workerId
          ? parseInt(req.query.workerId as string)
          : undefined,
        routeDate: req.query.routeDate as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const routes = await routesService.getRoutes(
        userId,
        userRole,
        assignedBusId,
        filters
      );

      res.json(routes);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Obtener una ruta por ID
   * GET /api/routes/:id
   */
  async getRouteById(req: Request, res: Response, next: NextFunction) {
    try {
      const routeId = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const assignedBusId = (req as any).user?.assignedBusId;

      if (!userId || !userRole) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const route = await routesService.getRouteById(
        routeId,
        userId,
        userRole,
        assignedBusId
      );

      res.json(route);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Actualizar una ruta
   * PUT /api/routes/:id
   * Solo ADMIN
   */
  async updateRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const routeId = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      // Solo ADMIN puede actualizar
      if (userRole !== 'ADMIN') {
        return res
          .status(403)
          .json({ error: 'Solo los administradores pueden editar rutas' });
      }

      const validatedData = UpdateRouteSchema.parse(req.body);

      const route = await routesService.updateRoute(
        routeId,
        validatedData,
        userId,
        userRole
      );

      res.json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return next(error);
    }
  }

  /**
   * Eliminar una ruta
   * DELETE /api/routes/:id
   * Solo ADMIN
   */
  async deleteRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const routeId = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      // Solo ADMIN puede eliminar
      if (userRole !== 'ADMIN') {
        return res
          .status(403)
          .json({ error: 'Solo los administradores pueden eliminar rutas' });
      }

      const result = await routesService.deleteRoute(routeId, userId, userRole);

      res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Obtener estadísticas de rutas
   * GET /api/routes/stats
   */
  async getRouteStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const assignedBusId = (req as any).user?.assignedBusId;

      if (!userId || !userRole) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const filters = {
        busId: req.query.busId ? parseInt(req.query.busId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const stats = await routesService.getRouteStats(
        userId,
        userRole,
        assignedBusId,
        filters
      );

      res.json(stats);
    } catch (error) {
      return next(error);
    }
  }
}
