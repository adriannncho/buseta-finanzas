import { z } from 'zod';

/**
 * Schema para crear usuario
 */
export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(150),
  email: z.string().email('Invalid email format').optional().nullable(),
  nationalId: z.string().min(1, 'National ID is required').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'WORKER'], {
    errorMap: () => ({ message: 'Role must be ADMIN or WORKER' }),
  }),
  assignedBusId: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema para actualizar usuario
 */
export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(150).optional(),
  email: z.string().email('Invalid email format').optional().nullable(),
  nationalId: z.string().min(1).max(50).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['ADMIN', 'WORKER']).optional(),
  assignedBusId: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Schema para query params de listado
 */
export const getUsersQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  role: z.enum(['ADMIN', 'WORKER']).optional(),
  isActive: z.string().optional(),
  search: z.string().optional(),
});

/**
 * Schema para params con ID
 */
export const userIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid user ID format').transform(Number),
});

// Tipos inferidos
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type GetUsersQueryDto = z.infer<typeof getUsersQuerySchema>;
export type UserIdParamDto = z.infer<typeof userIdParamSchema>;
