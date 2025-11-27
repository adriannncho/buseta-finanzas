import { z } from 'zod';

/**
 * Schema de validación para login
 */
export const loginSchema = z.object({
  nationalId: z.string().min(1, 'National ID is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Schema de validación para registro de usuario
 */
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email format').optional().nullable(),
  nationalId: z.string().min(1, 'National ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'WORKER'], {
    errorMap: () => ({ message: 'Role must be ADMIN or WORKER' }),
  }),
});

/**
 * Schema de validación para cambio de contraseña
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Tipos inferidos de los schemas
export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
