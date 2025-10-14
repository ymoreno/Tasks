import { 
  Debt, 
  DebtMetrics, 
  BudgetDistribution, 
  ValidationResult,
  DebtBudgetError,
  ERROR_CODES 
} from '../types';

/**
 * Servicio para cálculo de presupuesto consciente de deudas
 * Implementa lógica inteligente para distribución de presupuesto considerando obligaciones de deuda
 */
export class DebtAwareBudgetCalculator {
  
  /**
   * Calcula métricas de deudas basadas en las deudas registradas y el ingreso mensual
   * @param debts Array de deudas registradas
   * @param monthlyIncome Ingreso mensual del usuario
   * @returns Métricas calculadas de deudas
   */
  calculateDebtMetrics(debts: Debt[], monthlyIncome: number): DebtMetrics {
    try {
      // Validar entrada
      if (monthlyIncome <= 0) {
        throw new DebtBudgetError(
          'El ingreso mensual debe ser mayor a cero',
          ERROR_CODES.DEBT_CALCULATION_FAILED
        );
      }

      // Filtrar solo deudas activas
      const activeDebts = debts.filter(debt => debt.isActive);

      // Calcular totales
      const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
      const totalMinimumPayments = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
      
      // Calcular porcentajes
      const minimumPercentageRequired = (totalMinimumPayments / monthlyIncome) * 100;
      const recommendedPercentage = this.calculateRecommendedDebtPercentage(minimumPercentageRequired);
      
      // Calcular ratio deuda/ingreso anual
      const debtToIncomeRatio = (totalDebt / (monthlyIncome * 12)) * 100;
      
      // Evaluar nivel de riesgo
      const riskLevel = this.assessRiskLevel(minimumPercentageRequired);

      return {
        totalDebt,
        totalMinimumPayments,
        minimumPercentageRequired: Math.round(minimumPercentageRequired * 100) / 100, // Redondear a 2 decimales
        recommendedPercentage,
        debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100,
        riskLevel
      };
    } catch (error) {
      if (error instanceof DebtBudgetError) {
        throw error;
      }
      throw new DebtBudgetError(
        'Error al calcular métricas de deudas',
        ERROR_CODES.DEBT_CALCULATION_FAILED,
        error
      );
    }
  }

  /**
   * Calcula la distribución recomendada basada en las métricas de deudas
   * @param debtMetrics Métricas de deudas calculadas
   * @returns Distribución recomendada de presupuesto
   */
  calculateRecommendedDistribution(debtMetrics: DebtMetrics): BudgetDistribution {
    const minimumRequired = debtMetrics.minimumPercentageRequired;
    
    // Si no hay deudas, usar distribución tradicional 50/30/20
    if (minimumRequired === 0) {
      return {
        necessity: 50,
        want: 30,
        saving: 20,
        debt: 0
      };
    }
    
    // Distribución para deudas < 20%: 50/25/15/10
    if (minimumRequired < 20) {
      return this.calculateLowDebtDistribution(minimumRequired);
    } 
    // Distribución para deudas 20-30%: 50/20/10/20
    else if (minimumRequired <= 30) {
      return this.calculateMediumDebtDistribution(minimumRequired);
    } 
    // Distribución para deudas > 30%: 60/10/5/25
    else {
      return this.calculateHighDebtDistribution(minimumRequired);
    }
  }

  /**
   * Valida una distribución personalizada de presupuesto
   * @param distribution Distribución personalizada a validar
   * @param debtMetrics Métricas de deudas para validación
   * @returns Resultado de validación con errores y advertencias
   */
  validateCustomDistribution(distribution: BudgetDistribution, debtMetrics: DebtMetrics): ValidationResult {
    const warnings: string[] = [];
    
    // Validar que todos los porcentajes sean números válidos
    const values = Object.values(distribution);
    if (values.some(val => val < 0 || !Number.isFinite(val))) {
      return { 
        isValid: false, 
        error: 'Todos los porcentajes deben ser números positivos' 
      };
    }
    
    // Validar que la suma sea exactamente 100%
    const total = values.reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) { // Permitir pequeña tolerancia por redondeo
      return { 
        isValid: false, 
        error: `La suma de porcentajes debe ser 100%. Actual: ${total.toFixed(2)}%` 
      };
    }
    
    // Advertencia si el porcentaje de deudas es menor al mínimo requerido
    if (distribution.debt < debtMetrics.minimumPercentageRequired) {
      warnings.push(
        `El porcentaje de deudas (${distribution.debt}%) es menor al mínimo requerido (${debtMetrics.minimumPercentageRequired.toFixed(1)}%) para cubrir pagos mínimos`
      );
    }
    
    // Advertencia si el porcentaje de necesidades es muy bajo
    if (distribution.necessity < 40) {
      warnings.push(
        `El porcentaje para necesidades (${distribution.necessity}%) es muy bajo. Se recomienda al menos 40%`
      );
    }
    
    // Advertencia si no se asigna nada a ahorros
    if (distribution.saving === 0) {
      warnings.push(
        'No se ha asignado presupuesto para ahorros. Se recomienda al menos 5% para emergencias'
      );
    }

    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  }

  /**
   * Evalúa el nivel de riesgo basado en el porcentaje de deudas
   * @param debtPercentage Porcentaje de ingresos destinado a deudas
   * @returns Nivel de riesgo financiero
   */
  assessRiskLevel(debtPercentage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (debtPercentage < 15) {
      return 'low';
    } else if (debtPercentage < 25) {
      return 'medium';
    } else if (debtPercentage < 40) {
      return 'high';
    } else {
      return 'critical';
    }
  }

  /**
   * Calcula el porcentaje recomendado para deudas basado en el mínimo requerido
   * @param minimumRequired Porcentaje mínimo requerido para cubrir pagos
   * @returns Porcentaje recomendado (siempre mayor o igual al mínimo)
   */
  private calculateRecommendedDebtPercentage(minimumRequired: number): number {
    // Si no hay deudas, recomendar 10% para emergencias
    if (minimumRequired === 0) {
      return 10;
    }
    
    // Agregar un buffer del 20% sobre el mínimo requerido para pagos extra
    const recommendedWithBuffer = minimumRequired * 1.2;
    
    // Asegurar que esté dentro de rangos razonables
    const minRecommended = Math.max(minimumRequired, 10); // Mínimo 10%
    const maxRecommended = 40; // Máximo 40% para evitar sobreendeudamiento
    
    return Math.min(Math.max(recommendedWithBuffer, minRecommended), maxRecommended);
  }

  /**
   * Calcula el porcentaje mínimo requerido basado en pagos mínimos de deudas
   * @param debts Array de deudas activas
   * @param monthlyIncome Ingreso mensual
   * @returns Porcentaje mínimo requerido
   */
  calculateMinimumDebtPercentage(debts: Debt[], monthlyIncome: number): number {
    const activeDebts = debts.filter(debt => debt.isActive);
    const totalMinimumPayments = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    
    if (monthlyIncome <= 0) {
      return 0;
    }
    
    return (totalMinimumPayments / monthlyIncome) * 100;
  }

  /**
   * Verifica si una distribución puede cubrir los pagos mínimos de deudas
   * @param distribution Distribución de presupuesto
   * @param monthlyIncome Ingreso mensual
   * @param debts Array de deudas
   * @returns True si puede cubrir los pagos mínimos
   */
  canCoverMinimumPayments(distribution: BudgetDistribution, monthlyIncome: number, debts: Debt[]): boolean {
    const debtBudget = (distribution.debt / 100) * monthlyIncome;
    const totalMinimumPayments = debts
      .filter(debt => debt.isActive)
      .reduce((sum, debt) => sum + debt.minimumPayment, 0);
    
    return debtBudget >= totalMinimumPayments;
  }

  /**
   * Calcula distribución específica para deudas bajas (< 20%)
   * @param minimumRequired Porcentaje mínimo requerido
   * @returns Distribución 50/25/15/10 ajustada
   */
  calculateLowDebtDistribution(minimumRequired: number): BudgetDistribution {
    const debtPercentage = Math.max(10, Math.ceil(minimumRequired));
    const remaining = 100 - debtPercentage;
    
    return {
      necessity: Math.floor(remaining * 0.556), // ~50% del total
      want: Math.floor(remaining * 0.278), // ~25% del total
      saving: 100 - debtPercentage - Math.floor(remaining * 0.556) - Math.floor(remaining * 0.278), // El resto
      debt: debtPercentage
    };
  }

  /**
   * Calcula distribución específica para deudas medias (20-30%)
   * @param minimumRequired Porcentaje mínimo requerido
   * @returns Distribución 50/20/10/20 ajustada
   */
  calculateMediumDebtDistribution(minimumRequired: number): BudgetDistribution {
    const debtPercentage = Math.max(20, Math.ceil(minimumRequired));
    const remaining = 100 - debtPercentage;
    
    return {
      necessity: Math.floor(remaining * 0.625), // ~50% del total
      want: Math.floor(remaining * 0.25), // ~20% del total
      saving: 100 - debtPercentage - Math.floor(remaining * 0.625) - Math.floor(remaining * 0.25), // El resto
      debt: debtPercentage
    };
  }

  /**
   * Calcula distribución específica para deudas altas (> 30%)
   * @param minimumRequired Porcentaje mínimo requerido
   * @returns Distribución 60/10/5/25 ajustada
   */
  calculateHighDebtDistribution(minimumRequired: number): BudgetDistribution {
    const debtPercentage = Math.min(Math.max(25, Math.ceil(minimumRequired)), 40);
    const remaining = 100 - debtPercentage;
    
    return {
      necessity: Math.max(50, Math.floor(remaining * 0.75)), // Al menos 50%, preferiblemente 60%
      want: Math.floor(remaining * 0.125), // ~10% del total
      saving: 100 - debtPercentage - Math.max(50, Math.floor(remaining * 0.75)) - Math.floor(remaining * 0.125), // El resto, mínimo 5%
      debt: debtPercentage
    };
  }

  /**
   * Calcula el monto mensual disponible para pagos extra de deudas
   * @param distribution Distribución actual
   * @param monthlyIncome Ingreso mensual
   * @param debts Array de deudas
   * @returns Monto disponible para pagos extra
   */
  calculateExtraPaymentCapacity(distribution: BudgetDistribution, monthlyIncome: number, debts: Debt[]): number {
    const debtBudget = (distribution.debt / 100) * monthlyIncome;
    const totalMinimumPayments = debts
      .filter(debt => debt.isActive)
      .reduce((sum, debt) => sum + debt.minimumPayment, 0);
    
    return Math.max(0, debtBudget - totalMinimumPayments);
  }

  /**
   * Sugiere ajustes a la distribución cuando el presupuesto de deudas es insuficiente
   * @param currentDistribution Distribución actual
   * @param requiredDebtPercentage Porcentaje requerido para deudas
   * @returns Nueva distribución ajustada
   */
  suggestDistributionAdjustment(currentDistribution: BudgetDistribution, requiredDebtPercentage: number): BudgetDistribution {
    const deficit = requiredDebtPercentage - currentDistribution.debt;
    
    if (deficit <= 0) {
      return currentDistribution; // No necesita ajuste
    }
    
    // Priorizar reducir gastos no esenciales primero
    let adjustedDistribution = { ...currentDistribution };
    let remainingDeficit = deficit;
    
    // 1. Reducir "deseos" primero (hasta un mínimo de 5%)
    const wantReduction = Math.min(remainingDeficit, Math.max(0, adjustedDistribution.want - 5));
    adjustedDistribution.want -= wantReduction;
    remainingDeficit -= wantReduction;
    
    // 2. Reducir ahorros si es necesario (hasta un mínimo de 5%)
    if (remainingDeficit > 0) {
      const savingReduction = Math.min(remainingDeficit, Math.max(0, adjustedDistribution.saving - 5));
      adjustedDistribution.saving -= savingReduction;
      remainingDeficit -= savingReduction;
    }
    
    // 3. Como último recurso, reducir necesidades (hasta un mínimo de 40%)
    if (remainingDeficit > 0) {
      const necessityReduction = Math.min(remainingDeficit, Math.max(0, adjustedDistribution.necessity - 40));
      adjustedDistribution.necessity -= necessityReduction;
      remainingDeficit -= necessityReduction;
    }
    
    // Asignar el déficit cubierto a deudas
    adjustedDistribution.debt = requiredDebtPercentage - remainingDeficit;
    
    return adjustedDistribution;
  }
}

// Instancia singleton para uso en toda la aplicación
export const debtAwareBudgetCalculator = new DebtAwareBudgetCalculator();