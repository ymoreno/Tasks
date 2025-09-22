// Sistema de logging personalizado para el backend

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    switch (level) {
      case 'error':
        this.logLevel = LogLevel.ERROR;
        break;
      case 'warn':
        this.logLevel = LogLevel.WARN;
        break;
      case 'info':
        this.logLevel = LogLevel.INFO;
        break;
      case 'debug':
        this.logLevel = LogLevel.DEBUG;
        break;
      default:
        this.logLevel = LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  success(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`\x1b[32m${this.formatMessage('success', message, meta)}\x1b[0m`);
    }
  }

  // Método especial para requests HTTP
  request(method: string, url: string, statusCode: number, responseTime?: number): void {
    const message = `${method} ${url} ${statusCode}`;
    const meta = responseTime ? { responseTime: `${responseTime}ms` } : undefined;
    
    if (statusCode >= 500) {
      this.error(message, meta);
    } else if (statusCode >= 400) {
      this.warn(message, meta);
    } else {
      this.info(message, meta);
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Middleware para logging de requests
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.originalUrl, res.statusCode, duration);
  });
  
  next();
};