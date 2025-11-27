import { z } from 'zod';
import { RouteExpenseSchema } from './create-route.dto';

export const UpdateRouteSchema = z.object({
  busId: z.number().int().positive().optional(),
  workerId: z.number().int().positive().optional(),
  routeName: z.string().min(1).optional(),
  routeDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  totalIncome: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  expenses: z.array(RouteExpenseSchema).optional(),
  isLocked: z.boolean().optional(),
});

export type UpdateRouteDto = z.infer<typeof UpdateRouteSchema>;

