import { z } from 'zod';

/**
 * Schema para query parameters al listar logs de auditoría
 */
export const getAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  userId: z.coerce.number().int().positive().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type GetAuditLogsQueryDto = z.infer<typeof getAuditLogsQuerySchema>;
