// Versión stub temporal para evitar errores de compilación
export class DebtBudgetErrorHandler {
  static wrapAsync<T>(fn: () => Promise<T>, _operation: string, _context: any, fallback: T): Promise<T> {
    return fn().catch(() => fallback);
  }
}

export default DebtBudgetErrorHandler;