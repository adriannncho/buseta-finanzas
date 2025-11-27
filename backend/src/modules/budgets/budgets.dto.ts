import { z } from 'zod';

/**
 * Schema para crear un presupuesto
 */
export const createBudgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  busId: z.number().int().positive().optional().nullable(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de inicio inválida',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de fin inválida',
  }).optional().nullable(),
  totalPlannedIncome: z.number().nonnegative().optional().default(0),
  totalPlannedExpense: z.number().nonnegative().optional().default(0),
});

/**
 * Schema para actualizar un presupuesto
 */
export const updateBudgetSchema = z.object({
  name: z.string().min(1).optional(),
  busId: z.number().int().positive().nullable().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de inicio inválida',
  }).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de fin inválida',
  }).optional().nullable(),
  totalPlannedIncome: z.number().nonnegative().optional(),
  totalPlannedExpense: z.number().nonnegative().optional(),
});

/**
 * Schema para crear un item de presupuesto
 */
export const createBudgetItemSchema = z.object({
  budgetId: z.number().int().positive('ID de presupuesto inválido'),
  categoryId: z.number().int().positive('ID de categoría inválido'),
  plannedAmount: z.number().positive('El monto planeado debe ser positivo'),
});

/**
 * Schema para actualizar un item de presupuesto
 */
export const updateBudgetItemSchema = z.object({
  plannedAmount: z.number().positive().optional(),
  committedAmount: z.number().optional(),
  executedAmount: z.number().optional(),
});

/**
 * Schema para query parameters al listar presupuestos
 */
export const getBudgetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  busId: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * Schema para query parameters al listar items
 */
export const getBudgetItemsQuerySchema = z.object({
  budgetId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;
export type CreateBudgetItemDto = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemDto = z.infer<typeof updateBudgetItemSchema>;
export type GetBudgetsQueryDto = z.infer<typeof getBudgetsQuerySchema>;
export type GetBudgetItemsQueryDto = z.infer<typeof getBudgetItemsQuerySchema>;
