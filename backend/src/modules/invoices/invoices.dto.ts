import { z } from 'zod';

// ==================== FACTURAS ====================

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().max(100).optional(),
  providerName: z.string().max(200).optional(),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .optional(),
  totalAmount: z.number().min(0).optional(),
  // fileUrl será manejado por multer
  mimeType: z.string().max(100).optional(),
});

export const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().max(100).optional().nullable(),
  providerName: z.string().max(200).optional().nullable(),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .optional()
    .nullable(),
  totalAmount: z.number().min(0).optional().nullable(),
});

export const getInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  providerName: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
});

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
export type GetInvoicesQueryDto = z.infer<typeof getInvoicesQuerySchema>;
