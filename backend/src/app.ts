import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/env';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';

// Importar rutas (se agregarán progresivamente)
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import busRoutes from './modules/buses/buses.routes';
import expenseRoutes from './modules/expenses/expenses.routes';
import budgetRoutes from './modules/budgets/budgets.routes';
import profitSharingRoutes from './modules/profit-sharing/profit-sharing.routes';
import invoiceRoutes from './modules/invoices/invoices.routes';
import routesRoutes from './modules/routes/routes.routes';
import auditRoutes from './modules/audit/audit.routes';
// import dailyReportsRoutes from './modules/daily-reports/daily-reports.routes'; // Comentado: modelo no existe

/**
 * Crea y configura la aplicación Express
 */
export function createApp(): Application {
  const app = express();

  // Middlewares globales
  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Logger de requests (solo en desarrollo)
  if (config.nodeEnv === 'development') {
    app.use((req, _res, next) => {
      logger.debug(`${req.method} ${req.path}`, {
        query: req.query,
        body: req.body,
      });
      next();
    });
  }

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // Rutas de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/buses', busRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/profit-sharing', profitSharingRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/routes', routesRoutes);
  app.use('/api/audit', auditRoutes);

  // Servir archivos estáticos (uploads)
  app.use('/uploads', express.static('uploads'));

  // Manejadores de error (deben ir al final)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
