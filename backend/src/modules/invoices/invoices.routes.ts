import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { invoicesController } from './invoices.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/auth.middleware';

const router = Router();

// Configuración de multer para upload de archivos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'invoices'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `invoice-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceptar PDF, imágenes y documentos de office
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo PDF, imágenes y documentos de Office.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
});

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/invoices - Listar facturas (todos los usuarios autenticados)
router.get('/', invoicesController.getInvoices.bind(invoicesController));

// GET /api/invoices/stats - Obtener estadísticas (todos los usuarios)
router.get('/stats', invoicesController.getInvoiceStats.bind(invoicesController));

// GET /api/invoices/:id - Obtener factura por ID (todos los usuarios)
router.get('/:id', invoicesController.getInvoiceById.bind(invoicesController));

// POST /api/invoices - Crear factura con archivo (todos los usuarios autenticados)
router.post(
  '/',
  upload.single('file'),
  invoicesController.createInvoice.bind(invoicesController)
);

// PATCH /api/invoices/:id - Actualizar factura (todos los usuarios autenticados)
router.patch('/:id', invoicesController.updateInvoice.bind(invoicesController));

// DELETE /api/invoices/:id - Eliminar factura (solo ADMIN)
router.delete(
  '/:id',
  authorize('ADMIN'),
  invoicesController.deleteInvoice.bind(invoicesController)
);

export default router;
