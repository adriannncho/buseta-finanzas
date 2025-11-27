import { Request, Response } from 'express';
import { busesService } from './buses.service';
import { CreateBusDto, UpdateBusDto, getBusesQuerySchema } from './buses.dto';
import { successResponse } from '../../shared/utils/responses';
import { AuthRequest } from '../../shared/types/common.types';

export class BusesController {
  /**
   * GET /api/buses
   * Obtener listado de buses
   */
  async getBuses(req: Request, res: Response) {
    const query = getBusesQuerySchema.parse(req.query);
    const result = await busesService.getBuses(query);
    return successResponse(res, result, 'Buses obtenidos exitosamente');
  }

  /**
   * GET /api/buses/:id
   * Obtener un bus por ID
   */
  async getBusById(req: Request, res: Response) {
    const { id } = req.params;
    const bus = await busesService.getBusById(parseInt(id, 10));
    return successResponse(res, bus, 'Bus obtenido exitosamente');
  }

  /**
   * POST /api/buses
   * Crear un nuevo bus
   */
  async createBus(req: AuthRequest, res: Response) {
    const data: CreateBusDto = req.body;
    const userId = req.user!.id;
    const bus = await busesService.createBus(data, userId);
    return successResponse(res, bus, 'Bus creado exitosamente', 201);
  }

  /**
   * PATCH /api/buses/:id
   * Actualizar un bus
   */
  async updateBus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data: UpdateBusDto = req.body;
    const userId = req.user!.id;
    const bus = await busesService.updateBus(parseInt(id, 10), data, userId);
    return successResponse(res, bus, 'Bus actualizado exitosamente');
  }

  /**
   * DELETE /api/buses/:id
   * Eliminar (soft delete) un bus
   */
  async deleteBus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const bus = await busesService.deleteBus(parseInt(id, 10), userId);
    return successResponse(res, bus, 'Bus eliminado exitosamente');
  }

  /**
   * POST /api/buses/:id/activate
   * Activar un bus
   */
  async activateBus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const bus = await busesService.activateBus(parseInt(id, 10), userId);
    return successResponse(res, bus, 'Bus activado exitosamente');
  }

  /**
   * GET /api/buses/:id/monthly-stats
   * Obtener estadísticas mensuales de un bus
   */
  async getMonthlyStats(req: Request, res: Response) {
    const { id } = req.params;
    const { year, month } = req.query;
    const stats = await busesService.getMonthlyStats(
      parseInt(id, 10),
      year ? parseInt(year as string) : undefined,
      month ? parseInt(month as string) : undefined
    );
    return successResponse(res, stats, 'Estadísticas obtenidas exitosamente');
  }
}

export const busesController = new BusesController();
