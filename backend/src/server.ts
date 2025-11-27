import { createApp } from './app';
import config from './config/env';
import logger from './config/logger';
import prisma from './config/database';

/**
 * Iniciar el servidor
 */
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Crear aplicación Express
    const app = createApp();

    // Iniciar servidor
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Manejo de cierre graceful
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Iniciar
startServer();
