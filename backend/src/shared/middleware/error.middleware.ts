import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/response.utils';
import logger from '../../config/logger';

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware en la cadena
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Si es un error de aplicación (AppError)
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json(
      errorResponse(err.message, err.code, err.details)
    );
    return;
  }

  // Error genérico / no controlado
  logger.error('Unhandled error:', err);

  res.status(500).json(
    errorResponse(
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      'INTERNAL_SERVER_ERROR'
    )
  );
}

/**
 * Middleware para rutas no encontradas (404)
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(
    errorResponse(`Route ${req.method} ${req.path} not found`, 'NOT_FOUND')
  );
}
