import { PrismaClient, Prisma } from '@prisma/client';
import { CreateInvoiceDto, UpdateInvoiceDto, GetInvoicesQueryDto } from './invoices.dto';
import { AppError } from '../../shared/utils/errors';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

export class InvoicesService {
  private uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');

  constructor() {
    // Crear directorio de uploads si no existe
    this.ensureUploadsDirExists();
  }

  private async ensureUploadsDirExists() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }
  }

  async getInvoices(query: GetInvoicesQueryDto) {
    const { page = 1, limit = 10, providerName, startDate, endDate, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    if (providerName) {
      where.providerName = {
        contains: providerName,
        mode: 'insensitive',
      };
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        {
          invoiceNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          providerName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          uploader: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              expenses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoiceById(id: number) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        expenses: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            dailyReport: {
              select: {
                id: true,
                reportDate: true,
                bus: {
                  select: {
                    internalCode: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Factura no encontrada', 404);
    }

    return invoice;
  }

  async createInvoice(
    data: CreateInvoiceDto,
    fileInfo: { filename: string; mimetype: string; path: string },
    uploadedBy: number
  ) {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber || null,
        providerName: data.providerName || null,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        totalAmount: data.totalAmount || null,
        fileUrl: `/uploads/invoices/${fileInfo.filename}`,
        mimeType: fileInfo.mimetype,
        uploadedBy,
      },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return invoice;
  }

  async updateInvoice(id: number, data: UpdateInvoiceDto) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Factura no encontrada', 404);
    }

    const updateData: Prisma.InvoiceUpdateInput = {};

    if (data.invoiceNumber !== undefined) {
      updateData.invoiceNumber = data.invoiceNumber;
    }
    if (data.providerName !== undefined) {
      updateData.providerName = data.providerName;
    }
    if (data.issueDate !== undefined) {
      updateData.issueDate = data.issueDate ? new Date(data.issueDate) : null;
    }
    if (data.totalAmount !== undefined) {
      updateData.totalAmount = data.totalAmount;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return updated;
  }

  async deleteInvoice(id: number) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Factura no encontrada', 404);
    }

    // Verificar si tiene gastos asociados
    if (existing._count.expenses > 0) {
      throw new AppError(
        'No se puede eliminar la factura porque tiene gastos asociados',
        400
      );
    }

    // Eliminar archivo físico
    if (existing.fileUrl) {
      try {
        const filePath = path.join(process.cwd(), existing.fileUrl);
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continuar con la eliminación del registro aunque falle la eliminación del archivo
      }
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return { success: true };
  }

  async getInvoiceStats() {
    const [total, thisMonth, totalAmount] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.invoice.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          totalAmount: {
            not: null,
          },
        },
      }),
    ]);

    return {
      total,
      thisMonth,
      totalAmount: totalAmount._sum.totalAmount || 0,
    };
  }
}

export const invoicesService = new InvoicesService();
