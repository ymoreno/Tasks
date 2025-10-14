import { ERROR_CODES } from '../types';

// Enhanced error codes for backend
export const BACKEND_ERROR_CODES = {
  ...ERROR_CODES,
  // File system errors
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_PERMISSION_ERROR: 'FILE_PERMISSION_ERROR',
  
  // Data validation errors
  INVALID_JSON: 'INVALID_JSON',
  DATA_CORRUPTION: 'DATA_CORRUPTION',
  SCHEMA_VALIDATION_FAILED: 'SCHEMA_VALIDATION_FAILED',
  INVALID_INPUT_DATA: 'INVALID_INPUT_DATA',
  
  // Business logic errors
  DEBT_NOT_FOUND: 'DEBT_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_PAYMENT_AMOUNT: 'INVALID_PAYMENT_AMOUNT',
  
  // Calculation errors
  DIVISION_BY_ZERO: 'DIVISION_BY_ZERO',
  
  // System errors
  MEMORY_ERROR: 'MEMORY_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION'
} as const;

export type BackendErrorCode = typeof BACKEND_ERROR_CODES[keyof typeof BACKEND_ERROR_CODES];

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  operation: string;
  timestamp: number;
  userId?: string;
  requestId?: string;
  filePath?: string;
  inputData?: any;
  stackTrace?: string;
  debtId?: string;
  currentBalance?: number;
  monthlyIncome?: number;
  missingField?: string;
  invalidField?: string;
  validTypes?: string[];
  balance?: number;
  [key: string]: any; // Allow additional properties
}

export class BackendDebtError extends Error {
  public readonly code: BackendErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly recoverable: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    code: BackendErrorCode,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    details?: any,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'BackendDebtError';
    this.code = code;
    this.severity = severity;
    this.recoverable = recoverable;
    this.details = details;
    
    this.context = {
      operation: 'unknown',
      timestamp: Date.now(),
      ...context
    };

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BackendDebtError);
    }
    this.context.stackTrace = this.stack;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      recoverable: this.recoverable,
      context: this.context,
      details: this.details
    };
  }
}

export interface RecoveryStrategy {
  canRecover: (error: BackendDebtError) => boolean;
  recover: (error: BackendDebtError) => Promise<any>;
  description: string;
}

export class BackendErrorHandler {
  private static recoveryStrategies: RecoveryStrategy[] = [];
  private static errorLog: BackendDebtError[] = [];
  private static maxLogSize = 100;

  static {
    this.initializeRecoveryStrategies();
  }

  /**
   * Handle errors with automatic recovery attempts
   */
  static async handleError<T>(
    error: unknown,
    operation: string,
    context: Partial<ErrorContext> = {},
    fallbackValue?: T
  ): Promise<T> {
    let backendError: BackendDebtError;

    // Convert to backend error if needed
    if (error instanceof BackendDebtError) {
      backendError = error;
    } else if (error instanceof Error) {
      // Determine error code based on error type and message
      const errorCode = this.determineErrorCode(error);
      const severity = this.determineSeverity(error, errorCode);
      
      backendError = new BackendDebtError(
        error.message,
        errorCode,
        severity,
        { ...context, operation },
        { originalError: error.message, stack: error.stack }
      );
    } else {
      backendError = new BackendDebtError(
        'Unknown error occurred',
        BACKEND_ERROR_CODES.INTEGRATION_ERROR,
        ErrorSeverity.HIGH,
        { ...context, operation },
        { originalError: error }
      );
    }

    // Log the error
    this.logError(backendError);

    // Attempt recovery if possible
    if (backendError.recoverable) {
      try {
        const recoveredValue = await this.attemptRecovery<T>(backendError);
        if (recoveredValue !== undefined) {
          console.warn(`Recovered from error: ${backendError.code}`, recoveredValue);
          return recoveredValue;
        }
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      }
    }

    // Return fallback value if provided
    if (fallbackValue !== undefined) {
      console.warn(`Using fallback value for error: ${backendError.code}`, fallbackValue);
      return fallbackValue;
    }

    // Re-throw the backend error
    throw backendError;
  }

  /**
   * Determine error code based on error characteristics
   */
  private static determineErrorCode(error: Error): BackendErrorCode {
    const message = error.message.toLowerCase();
    
    if (message.includes('enoent') || message.includes('file not found')) {
      return BACKEND_ERROR_CODES.FILE_NOT_FOUND;
    }
    if (message.includes('eacces') || message.includes('permission')) {
      return BACKEND_ERROR_CODES.FILE_PERMISSION_ERROR;
    }
    if (message.includes('json') || message.includes('parse')) {
      return BACKEND_ERROR_CODES.INVALID_JSON;
    }
    if (message.includes('debt not found')) {
      return BACKEND_ERROR_CODES.DEBT_NOT_FOUND;
    }
    if (message.includes('payment not found')) {
      return BACKEND_ERROR_CODES.PAYMENT_NOT_FOUND;
    }
    if (message.includes('timeout')) {
      return BACKEND_ERROR_CODES.TIMEOUT_ERROR;
    }
    
    return BACKEND_ERROR_CODES.INTEGRATION_ERROR;
  }

  /**
   * Determine error severity based on error type
   */
  private static determineSeverity(error: Error, code: BackendErrorCode): ErrorSeverity {
    const criticalCodes: BackendErrorCode[] = [
      BACKEND_ERROR_CODES.DATA_CORRUPTION,
      BACKEND_ERROR_CODES.FILE_PERMISSION_ERROR,
      BACKEND_ERROR_CODES.MEMORY_ERROR
    ];
    
    const highCodes: BackendErrorCode[] = [
      BACKEND_ERROR_CODES.FILE_WRITE_ERROR,
      BACKEND_ERROR_CODES.CONCURRENT_MODIFICATION
    ];
    
    const mediumCodes: BackendErrorCode[] = [
      BACKEND_ERROR_CODES.FILE_READ_ERROR,
      BACKEND_ERROR_CODES.INVALID_JSON,
      BACKEND_ERROR_CODES.DEBT_NOT_FOUND
    ];

    if (criticalCodes.includes(code)) return ErrorSeverity.CRITICAL;
    if (highCodes.includes(code)) return ErrorSeverity.HIGH;
    if (mediumCodes.includes(code)) return ErrorSeverity.MEDIUM;
    
    return ErrorSeverity.LOW;
  }

  /**
   * Attempt to recover from an error using registered strategies
   */
  private static async attemptRecovery<T>(error: BackendDebtError): Promise<T | undefined> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          console.log(`Attempting recovery with strategy: ${strategy.description}`);
          const result = await strategy.recover(error);
          return result;
        } catch (recoveryError) {
          console.warn(`Recovery strategy failed: ${strategy.description}`, recoveryError);
          continue;
        }
      }
    }
    return undefined;
  }

  /**
   * Initialize recovery strategies
   */
  private static initializeRecoveryStrategies(): void {
    // Strategy for file not found
    this.recoveryStrategies.push({
      canRecover: (error) => error.code === BACKEND_ERROR_CODES.FILE_NOT_FOUND,
      recover: async (error) => {
        if (error.context.filePath) {
          // Create empty file with default structure
          const fs = require('fs/promises');
          await fs.writeFile(error.context.filePath, JSON.stringify([], null, 2));
          return [] as any;
        }
        return [] as any;
      },
      description: 'Create missing file with default structure'
    });

    // Strategy for invalid JSON
    this.recoveryStrategies.push({
      canRecover: (error) => error.code === BACKEND_ERROR_CODES.INVALID_JSON,
      recover: async (error) => {
        if (error.context.filePath) {
          // Create backup and reset file
          const fs = require('fs/promises');
          const path = require('path');
          
          const backupPath = `${error.context.filePath}.backup-${Date.now()}`;
          try {
            await fs.copyFile(error.context.filePath, backupPath);
          } catch (copyError) {
            console.warn('Could not create backup:', copyError);
          }
          
          await fs.writeFile(error.context.filePath, JSON.stringify([], null, 2));
          return [];
        }
        return [];
      },
      description: 'Backup corrupted file and create new one'
    });

    // Strategy for debt not found
    this.recoveryStrategies.push({
      canRecover: (error) => error.code === BACKEND_ERROR_CODES.DEBT_NOT_FOUND,
      recover: async () => null,
      description: 'Return null for missing debt'
    });

    // Strategy for payment not found
    this.recoveryStrategies.push({
      canRecover: (error) => error.code === BACKEND_ERROR_CODES.PAYMENT_NOT_FOUND,
      recover: async () => false,
      description: 'Return false for missing payment'
    });
  }

  /**
   * Log error for debugging and monitoring
   */
  private static logError(error: BackendDebtError): void {
    // Add to in-memory log
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop();
    }

    // Log to console based on severity
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.code}] ${error.message}`, {
      context: error.context,
      details: error.details
    });

    // Log critical errors to file if possible
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.logCriticalError(error);
    }
  }

  /**
   * Log critical errors to file
   */
  private static async logCriticalError(error: BackendDebtError): Promise<void> {
    try {
      const fs = require('fs/promises');
      const path = require('path');
      
      const logDir = path.join(__dirname, '../../logs');
      const logFile = path.join(logDir, 'critical-errors.log');
      
      // Ensure log directory exists
      try {
        await fs.mkdir(logDir, { recursive: true });
      } catch (mkdirError) {
        // Ignore if directory already exists
      }
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        error: error.toJSON()
      };
      
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (logError) {
      console.error('Failed to log critical error to file:', logError);
    }
  }

  /**
   * Get appropriate console log method based on severity
   */
  private static getLogMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.info;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Wrap async operations with error handling
   */
  static async wrapAsync<T>(
    operation: () => Promise<T>,
    operationName: string,
    context: Partial<ErrorContext> = {},
    fallbackValue?: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return await this.handleError(error, operationName, context, fallbackValue);
    }
  }

  /**
   * Wrap sync operations with error handling
   */
  static wrapSync<T>(
    operation: () => T,
    operationName: string,
    context: Partial<ErrorContext> = {},
    fallbackValue?: T
  ): T {
    try {
      return operation();
    } catch (error) {
      const backendError = new BackendDebtError(
        error instanceof Error ? error.message : 'Unknown error',
        this.determineErrorCode(error instanceof Error ? error : new Error(String(error))),
        ErrorSeverity.MEDIUM,
        { ...context, operation: operationName },
        { originalError: error }
      );
      
      this.logError(backendError);
      
      if (fallbackValue !== undefined) {
        console.warn(`Using fallback value for sync operation: ${operationName}`, fallbackValue);
        return fallbackValue;
      }
      
      throw backendError;
    }
  }

  /**
   * Create error with context
   */
  static createError(
    message: string,
    code: BackendErrorCode,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    details?: any
  ): BackendDebtError {
    return new BackendDebtError(message, code, severity, context, details);
  }

  /**
   * Get error statistics for monitoring
   */
  static getErrorStatistics(): {
    totalErrors: number;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCode: Record<string, number>;
    recentErrors: BackendDebtError[];
  } {
    const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = this.errorLog.filter(e => e.severity === severity).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const errorsByCode = this.errorLog.reduce((acc, error) => {
      acc[error.code] = (acc[error.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errorLog.length,
      errorsBySeverity,
      errorsByCode,
      recentErrors: this.errorLog.slice(0, 10)
    };
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Validate system health
   */
  static validateSystemHealth(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check error rate
    const recentErrors = this.errorLog.filter(e => 
      Date.now() - e.context.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentErrors.length > 10) {
      issues.push('High error rate detected');
      recommendations.push('Check file system permissions and data integrity');
    }

    // Check for critical errors
    const criticalErrors = this.errorLog.filter(e => e.severity === ErrorSeverity.CRITICAL);
    if (criticalErrors.length > 0) {
      issues.push('Critical errors detected');
      recommendations.push('Review critical error logs and check system resources');
    }

    // Check for file system errors
    const fileErrors = this.errorLog.filter(e => 
      e.code.includes('FILE_') || e.code === BACKEND_ERROR_CODES.DATA_CORRUPTION
    );
    if (fileErrors.length > 3) {
      issues.push('Multiple file system errors');
      recommendations.push('Check disk space and file permissions');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}