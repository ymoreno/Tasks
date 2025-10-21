import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import config from '../config';

// Interfaz para errores personalizados
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

// Middleware para manejo centralizado de errores
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error para debugging
  logger.error('Error en la aplicación', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Error de validación de Joi
  if (err.name === 'ValidationError') {
    const message = 'Datos de entrada inválidos';
    error = { name: 'ValidationError', message, statusCode: 400 };
  }

  // Error de archivo no encontrado
  if (err.code === 'ENOENT') {
    const message = 'Archivo no encontrado';
    error = { name: 'FileNotFound', message, statusCode: 404 };
  }

  if (err.name === 'SyntaxError' && 'body' in err) {
    const message = 'Formato JSON inválido';
    error = { name: 'JSONError', message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error interno del servidor',
    ...(config.server.isDevelopment && { 
      stack: err.stack,
      details: {
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    })
  });
};

// Función helper para crear errores personalizados
export const createError = (message: string, statusCode: number = 500): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode;
  return error;
};