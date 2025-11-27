import { z } from 'zod';

export const RouteExpenseSchema = z.object({
  expenseName: z.string().min(1, 'El nombre del gasto es requerido'),
  amount: z.number().positive('El monto debe ser positivo'),
});

export const CreateRouteSchema = z.object({
  busId: z.number().int().positive(),
  workerId: z.number().int().positive(),
  routeName: z.string().min(1, 'El nombre de la ruta es requerido'),
  routeDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  totalIncome: z.number().nonnegative('El ingreso total no puede ser negativo'),
  notes: z.string().optional(),
  expenses: z.array(RouteExpenseSchema).default([]),
  isLocked: z.boolean().default(true).optional(),
});

export type CreateRouteDto = z.infer<typeof CreateRouteSchema>;
export type RouteExpenseDto = z.infer<typeof RouteExpenseSchema>;

