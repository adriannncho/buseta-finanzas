import { Request, Response, NextFunction } from 'express';
import { invoicesService } from './invoices.service';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  getInvoicesQuerySchema,
} from './invoices.dto';
import { successResponse } from '../../shared/utils/responses';

export class InvoicesController {
  async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getInvoicesQuerySchema.parse(req.query);
      const result = await invoicesService.getInvoices(query);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const invoice = await invoicesService.getInvoiceById(parseInt(id, 10));
      return successResponse(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      // Verificar que se haya subido un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'Debe subir un archivo' },
        });
      }

      const data = createInvoiceSchema.parse(req.body);
      const uploadedBy = req.user!.id;

      const invoice = await invoicesService.createInvoice(
        data,
        {
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          path: req.file.path,
        },
        uploadedBy
      );

      return successResponse(res, invoice, 'Factura creada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateInvoiceSchema.parse(req.body);
      const updated = await invoicesService.updateInvoice(parseInt(id, 10), data);
      return successResponse(res, updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await invoicesService.deleteInvoice(parseInt(id, 10));
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await invoicesService.getInvoiceStats();
      return successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const invoicesController = new InvoicesController();
