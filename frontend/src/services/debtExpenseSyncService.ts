import { Expense, DebtPayment, Debt, BudgetCategory } from '@/types';
import { financeService } from './api';

/**
 * Servicio para sincronizar pagos de deudas con gastos en la categoría de deudas
 * Implementa la creación automática de gastos al registrar pagos de deuda
 * y la eliminación de gastos al revertir pagos
 */
export class DebtExpenseSyncService {
  
  /**
   * Crea un gasto automáticamente al registrar un pago de deuda
   * @param payment - Datos del pago de deuda
   * @param debt - Información de la deuda
   * @param debtCategory - Categoría de deudas del presupuesto
   * @returns El gasto creado
   */
  async createExpenseFromDebtPayment(
    payment: Omit<DebtPayment, 'id' | 'createdAt'>,
    debt: Debt,
    debtCategory: BudgetCategory
  ): Promise<Expense> {
    try {
      // Generar descripción descriptiva del gasto
      const description = this.generateExpenseDescription(payment, debt);
      
      // Crear el gasto en la categoría de deudas
      const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
        categoryId: debtCategory.id,
        amount: payment.amount,
        description,
        date: payment.paymentDate,
      };

      const createdExpense = await financeService.addExpense(expenseData);
      
      console.log(`Gasto creado automáticamente para pago de deuda: ${debt.name}`, {
        expenseId: createdExpense.id,
        amount: payment.amount,
        debtId: debt.id
      });

      return createdExpense;
    } catch (error) {
      console.error('Error creando gasto desde pago de deuda:', error);
      throw new Error(`No se pudo crear el gasto para el pago de deuda: ${error}`);
    }
  }

  /**
   * Elimina un gasto asociado al revertir un pago de deuda
   * @param expenseId - ID del gasto a eliminar
   * @param paymentId - ID del pago de deuda revertido
   */
  async removeExpenseFromRevertedPayment(
    expenseId: string,
    paymentId: string
  ): Promise<void> {
    try {
      await financeService.deleteExpense(expenseId);
      
      console.log(`Gasto eliminado por reversión de pago de deuda`, {
        expenseId,
        paymentId
      });
    } catch (error) {
      console.error('Error eliminando gasto por reversión de pago:', error);
      throw new Error(`No se pudo eliminar el gasto asociado: ${error}`);
    }
  }

  /**
   * Busca gastos asociados a un pago de deuda específico
   * @param paymentId - ID del pago de deuda
   * @param debtName - Nombre de la deuda para filtrar
   * @returns Lista de gastos que coinciden con el pago
   */
  async findExpensesForDebtPayment(
    paymentId: string,
    debtName: string
  ): Promise<Expense[]> {
    try {
      const expenses = await financeService.getExpenses();
      
      // Filtrar gastos que contengan referencia al pago o deuda
      return expenses.filter(expense => 
        expense.description.includes(`Pago de deuda: ${debtName}`) ||
        expense.description.includes(`Payment ID: ${paymentId}`)
      );
    } catch (error) {
      console.error('Error buscando gastos para pago de deuda:', error);
      return [];
    }
  }

  /**
   * Valida si hay presupuesto disponible en la categoría de deudas
   * @param paymentAmount - Monto del pago a realizar
   * @param debtCategory - Categoría de deudas
   * @param currentMonthExpenses - Gastos del mes actual en la categoría
   * @returns Resultado de la validación con información del presupuesto
   */
  validateDebtBudgetAvailability(
    paymentAmount: number,
    debtCategory: BudgetCategory,
    currentMonthExpenses: Expense[]
  ): {
    hasAvailableBudget: boolean;
    availableAmount: number;
    exceededAmount: number;
    utilizationPercentage: number;
    warning?: string;
  } {
    // Calcular gastos del mes actual en la categoría de deudas
    const currentDate = new Date();
    const currentMonthSpent = currentMonthExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expense.categoryId === debtCategory.id &&
               expenseDate.getMonth() === currentDate.getMonth() &&
               expenseDate.getFullYear() === currentDate.getFullYear();
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    const totalAfterPayment = currentMonthSpent + paymentAmount;
    const availableAmount = Math.max(0, debtCategory.budgetAmount - currentMonthSpent);
    const exceededAmount = Math.max(0, totalAfterPayment - debtCategory.budgetAmount);
    const utilizationPercentage = (totalAfterPayment / debtCategory.budgetAmount) * 100;

    let warning: string | undefined;
    if (exceededAmount > 0) {
      warning = `Este pago excederá tu presupuesto de deudas por $${exceededAmount.toLocaleString('es-CO')}`;
    } else if (utilizationPercentage > 80) {
      warning = `Este pago utilizará ${utilizationPercentage.toFixed(1)}% de tu presupuesto de deudas`;
    }

    return {
      hasAvailableBudget: exceededAmount === 0,
      availableAmount,
      exceededAmount,
      utilizationPercentage,
      warning
    };
  }

  /**
   * Genera una descripción descriptiva para el gasto basado en el pago de deuda
   * @param payment - Datos del pago
   * @param debt - Información de la deuda
   * @returns Descripción formateada del gasto
   */
  private generateExpenseDescription(
    payment: Omit<DebtPayment, 'id' | 'createdAt'>,
    debt: Debt
  ): string {
    let description = `Pago de deuda: ${debt.name}`;
    
    // Agregar tipo de pago
    const paymentTypeLabels = {
      minimum: 'Pago mínimo',
      extra: 'Pago extra',
      full: 'Pago completo'
    };
    
    description += ` (${paymentTypeLabels[payment.paymentType]})`;
    
    // Agregar descripción adicional si existe
    if (payment.description) {
      description += ` - ${payment.description}`;
    }
    
    // Agregar información del acreedor
    if (debt.creditor) {
      description += ` | ${debt.creditor}`;
    }
    
    return description;
  }

  /**
   * Calcula el impacto del pago en el presupuesto y genera métricas
   * @param paymentAmount - Monto del pago
   * @param debtCategory - Categoría de deudas
   * @param monthlyIncome - Ingreso mensual del usuario
   * @returns Métricas del impacto del pago
   */
  calculatePaymentImpact(
    paymentAmount: number,
    debtCategory: BudgetCategory,
    monthlyIncome: number
  ): {
    percentageOfIncome: number;
    percentageOfDebtBudget: number;
    remainingDebtBudget: number;
    impactLevel: 'low' | 'medium' | 'high';
    recommendation?: string;
  } {
    const percentageOfIncome = (paymentAmount / monthlyIncome) * 100;
    const percentageOfDebtBudget = (paymentAmount / debtCategory.budgetAmount) * 100;
    const remainingDebtBudget = debtCategory.budgetAmount - debtCategory.spentAmount - paymentAmount;

    let impactLevel: 'low' | 'medium' | 'high' = 'low';
    let recommendation: string | undefined;

    if (percentageOfDebtBudget > 50) {
      impactLevel = 'high';
      recommendation = 'Este pago representa más del 50% de tu presupuesto mensual de deudas. Considera si es sostenible.';
    } else if (percentageOfDebtBudget > 25) {
      impactLevel = 'medium';
      recommendation = 'Pago significativo que utilizará una parte considerable de tu presupuesto de deudas.';
    }

    if (remainingDebtBudget < 0) {
      recommendation = 'Este pago excederá tu presupuesto de deudas. Considera ajustar tu distribución o diferir el pago.';
    }

    return {
      percentageOfIncome,
      percentageOfDebtBudget,
      remainingDebtBudget,
      impactLevel,
      recommendation
    };
  }

  /**
   * Obtiene estadísticas de sincronización para debugging y monitoreo
   * @param debtCategory - Categoría de deudas
   * @returns Estadísticas de sincronización
   */
  async getSyncStatistics(debtCategory: BudgetCategory): Promise<{
    totalDebtExpenses: number;
    totalDebtExpenseAmount: number;
    averagePaymentAmount: number;
    lastSyncDate?: string;
    syncSuccessRate: number;
  }> {
    try {
      const expenses = await financeService.getExpenses();
      
      // Filtrar gastos de la categoría de deudas
      const debtExpenses = expenses.filter(expense => 
        expense.categoryId === debtCategory.id &&
        expense.description.includes('Pago de deuda:')
      );

      const totalDebtExpenseAmount = debtExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const averagePaymentAmount = debtExpenses.length > 0 ? totalDebtExpenseAmount / debtExpenses.length : 0;
      
      // Obtener la fecha del último gasto sincronizado
      const lastSyncDate = debtExpenses.length > 0 
        ? debtExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : undefined;

      return {
        totalDebtExpenses: debtExpenses.length,
        totalDebtExpenseAmount,
        averagePaymentAmount,
        lastSyncDate,
        syncSuccessRate: 100 // Por ahora asumimos 100%, se puede mejorar con tracking de errores
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de sincronización:', error);
      return {
        totalDebtExpenses: 0,
        totalDebtExpenseAmount: 0,
        averagePaymentAmount: 0,
        syncSuccessRate: 0
      };
    }
  }
}

// Instancia singleton del servicio
export const debtExpenseSyncService = new DebtExpenseSyncService();