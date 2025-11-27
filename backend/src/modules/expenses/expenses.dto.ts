import { z } from 'zod';

/**
 * Schema para crear una categoría de gasto
 */
export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
});

/**
 * Schema para actualizar una categoría de gasto
 */
export const updateExpenseCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema para crear un gasto
 */
export const createExpenseSchema = z.object({
  busId: z.coerce.number().int().positive('ID de bus inválido'),
  categoryId: z.coerce.number().int().positive('ID de categoría inválido'),
  amount: z.number().positive('El monto debe ser positivo'),
  description: z.string().optional(),
  expenseDate: z.string().optional(), // Acepta formato YYYY-MM-DD
});

/**
 * Schema para actualizar un gasto
 */
export const updateExpenseSchema = z.object({
  busId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  amount: z.number().positive().optional(),
  expenseDate: z.string().optional(),
  description: z.string().nullable().optional(),
});

/**
 * Schema para query parameters al listar categorías
 */
export const getExpenseCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

/**
 * Schema para query parameters al listar gastos
 */
export const getExpensesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  busId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
});

export type CreateExpenseCategoryDto = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryDto = z.infer<typeof updateExpenseCategorySchema>;
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
export type GetExpenseCategoriesQueryDto = z.infer<typeof getExpenseCategoriesQuerySchema>;
export type GetExpensesQueryDto = z.infer<typeof getExpensesQuerySchema>;
