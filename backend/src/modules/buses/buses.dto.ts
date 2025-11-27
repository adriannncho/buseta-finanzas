import { z } from 'zod';

/**
 * Schema para crear un bus
 */
export const createBusSchema = z.object({
  internalCode: z.string().min(1, 'El código interno es requerido'),
  plateNumber: z.string().min(1, 'La placa es requerida'),
  description: z.string().optional(),
  monthlyTarget: z.coerce.number().nonnegative().optional().default(0),
});

/**
 * Schema para actualizar un bus
 */
export const updateBusSchema = z.object({
  internalCode: z.string().min(1).optional(),
  plateNumber: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  monthlyTarget: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema para query parameters al listar buses
 */
export const getBusesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export type CreateBusDto = z.infer<typeof createBusSchema>;
export type UpdateBusDto = z.infer<typeof updateBusSchema>;
export type GetBusesQueryDto = z.infer<typeof getBusesQuerySchema>;
