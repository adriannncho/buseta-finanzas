import { z } from 'zod';

/**
 * Schema para crear un reporte diario
 */
export const createDailyReportSchema = z.object({
  busId: z.number().int().positive('ID de bus inválido'),
  workerId: z.number().int().positive('ID de trabajador inválido'),
  reportDate: z.string().datetime('Fecha inválida'),
  totalIncome: z.number().nonnegative('El ingreso total debe ser positivo'),
  totalExpenses: z.number().nonnegative('Los gastos totales deben ser positivos'),
  notes: z.string().optional(),
});

/**
 * Schema para actualizar un reporte diario
 */
export const updateDailyReportSchema = z.object({
  busId: z.number().int().positive().optional(),
  workerId: z.number().int().positive().optional(),
  reportDate: z.string().datetime().optional(),
  totalIncome: z.number().nonnegative().optional(),
  totalExpenses: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Schema para query parameters al listar reportes
 */
export const getDailyReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  busId: z.coerce.number().int().positive().optional(),
  workerId: z.coerce.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['reportDate', 'totalIncome', 'netIncome']).default('reportDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateDailyReportDto = z.infer<typeof createDailyReportSchema>;
export type UpdateDailyReportDto = z.infer<typeof updateDailyReportSchema>;
export type GetDailyReportsQueryDto = z.infer<typeof getDailyReportsQuerySchema>;
