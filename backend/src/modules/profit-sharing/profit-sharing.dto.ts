import { z } from 'zod';

// ==================== GRUPOS DE REPARTO ====================

export const createProfitSharingGroupSchema = z.object({
  busId: z.number().int().positive({ message: 'ID de bus inválido' }),
  name: z.string().min(1, 'El nombre es requerido').max(150).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),
});

export const updateProfitSharingGroupSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

export const getProfitSharingGroupsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  busId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateProfitSharingGroupDto = z.infer<typeof createProfitSharingGroupSchema>;
export type UpdateProfitSharingGroupDto = z.infer<typeof updateProfitSharingGroupSchema>;
export type GetProfitSharingGroupsQueryDto = z.infer<typeof getProfitSharingGroupsQuerySchema>;

// ==================== MIEMBROS DE REPARTO ====================

export const shareRoleSchema = z.enum(['OWNER', 'DRIVER', 'PARTNER'], {
  errorMap: () => ({ message: 'Rol inválido. Debe ser OWNER, DRIVER o PARTNER' }),
});

export const createProfitSharingMemberSchema = z.object({
  groupId: z.coerce.number().int().positive({ message: 'ID de grupo inválido' }),
  userId: z.coerce.number().int().positive({ message: 'ID de usuario inválido' }),
  roleInShare: shareRoleSchema,
  percentage: z
    .number()
    .min(0, 'El porcentaje debe ser mayor o igual a 0')
    .max(100, 'El porcentaje debe ser menor o igual a 100'),
});

export const updateProfitSharingMemberSchema = z.object({
  roleInShare: shareRoleSchema.optional(),
  percentage: z.number().min(0).max(100).optional(),
});

export const getProfitSharingMembersQuerySchema = z.object({
  groupId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  roleInShare: shareRoleSchema.optional(),
});

export type CreateProfitSharingMemberDto = z.infer<typeof createProfitSharingMemberSchema>;
export type UpdateProfitSharingMemberDto = z.infer<typeof updateProfitSharingMemberSchema>;
export type GetProfitSharingMembersQueryDto = z.infer<typeof getProfitSharingMembersQuerySchema>;
