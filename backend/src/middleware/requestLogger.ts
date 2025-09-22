import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Middleware para logging de requests en desarrollo
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log de request entrante
  logger.debug(`→ ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? req.body : undefined
  });
  
  // Interceptar la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log de respuesta
    logger.request(req.method, req.originalUrl, res.statusCode, duration);
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware para logging de errores de request
export const requestErrorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Request error: ${req.method} ${req.originalUrl}`, {
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next(err);
};