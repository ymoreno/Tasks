import { 
  DebtMetrics, 
  BudgetDistribution, 
  DebtRecommendation, 
  Debt,
  DebtAlertAction 
} from '@/types';
import { debtAwareBudgetCalculator } from './debtAwareBudgetCalculator';

/**
 * Motor de recomendaciones automáticas para gestión de deudas
 * Genera recomendaciones inteligentes basadas en la situación financiera del usuario
 */
export class DebtRecommendationEngine {
  
  /**
   * Genera recomendaciones automáticas basadas en métricas de deudas
   * @param debtMetrics Métricas calculadas de deudas
   * @param budgetDistribution Distribución actual del presupuesto
   * @param debts Array de deudas activas
   * @param monthlyIncome Ingreso mensual del usuario
   * @returns Array de recomendaciones priorizadas
   */
  generateRecommendations(
    debtMetrics: DebtMetrics,
    budgetDistribution: BudgetDistribution,
    debts: Debt[],
    monthlyIncome: number
  ): DebtRecommendation[] {
    const recommendations: DebtRecommendation[] = [];

    // Recomendaciones basadas en nivel de riesgo
    switch (debtMetrics.riskLevel) {
      case 'critical':
        recommendations.push(...this.getCriticalDebtRecommendations(debtMetrics, budgetDistribution, debts, monthlyIncome));
        break;
      case 'high':
        recommendations.push(...this.getHighDebtRecommendations(debtMetrics, budgetDistribution, debts, monthlyIncome));
        break;
      case 'medium':
        recommendations.push(...this.getMediumDebtRecommendations(debtMetrics, budgetDistribution, debts, monthlyIncome));
        break;
      case 'low':
        recommendations.push(...this.getLowDebtRecommendations(debtMetrics, budgetDistribution, debts, monthlyIncome));
        break;
    }

    // Recomendaciones específicas adicionales
    recommendations.push(...this.getSpecificRecommendations(debtMetrics, budgetDistribution, debts, monthlyIncome));

    // Ordenar por impacto y prioridad
    return this.prioritizeRecommendations(recommendations);
  }

  /**
   * Aplica una recomendación específica
   * @param action Acción de la recomendación a aplicar
   * @param currentDistribution Distribución actual del presupuesto
   * @param debtMetrics Métricas de deudas
   * @returns Nueva distribución sugerida o datos de la acción
   */
  applyRecommendation(
    action: DebtAlertAction,
    currentDistribution: BudgetDistribution,
    debtMetrics: DebtMetrics
  ): any {
    switch (action.type) {
      case 'adjust-budget':
        return this.generateBudgetAdjustment(currentDistribution, debtMetrics);
      case 'restructure-debts':
        return this.generateDebtRestructurePlan(action.data);
      case 'optimize-savings':
        return this.generateSavingsOptimization(currentDistribution, debtMetrics);
      case 'increase-income':
        return this.generateIncomeIncreasePlan(action.data);
      case 'reduce-expenses':
        return this.generateExpenseReductionPlan(currentDistribution);
      default:
        return null;
    }
  }

  /**
   * Recomendaciones para situación crítica de deudas (>40% ingreso)
   */
  private getCriticalDebtRecommendations(
    debtMetrics: DebtMetrics,
    budgetDistribution: BudgetDistribution,
    debts: Debt[],
    monthlyIncome: number
  ): DebtRecommendation[] {
    const recommendations: DebtRecommendation[] = [];

    // 1. Plan de emergencia financiera
    recommendations.push({
      id: 'emergency-debt-plan',
      type: 'debt-restructure',
      title: 'Plan de Emergencia Financiera',
      description: 'Tu situación de deudas es crítica. Necesitas un plan de emergencia inmediato para evitar el sobreendeudamiento.',
      impact: 'high',
      difficulty: 'hard',
      estimatedTimeframe: 'Inmediato - 2 semanas',
      projectedImprovement: {
        monthlyPaymentReduction: debtMetrics.totalMinimumPayments * 0.25,
        timeToDebtFree: this.calculatePayoffTime(debts, debtMetrics.totalMinimumPayments * 0.75)
      },
      steps: [
        'URGENTE: Contactar inmediatamente a todos los acreedores',
        'Solicitar planes de pago reducidos o moratorias temporales',
        'Explorar consolidación de deudas de emergencia',
        'Considerar asesoría financiera profesional',
        'Evaluar venta de activos no esenciales',
        'Buscar fuentes adicionales de ingresos inmediatas'
      ]
    });

    // 2. Reestructuración agresiva de presupuesto
    const emergencyDistribution = this.calculateEmergencyDistribution(debtMetrics, monthlyIncome);
    recommendations.push({
      id: 'emergency-budget-restructure',
      type: 'budget-adjustment',
      title: 'Reestructuración Agresiva de Presupuesto',
      description: 'Ajuste drástico del presupuesto para maximizar pagos de deudas y evitar default.',
      impact: 'high',
      difficulty: 'hard',
      estimatedTimeframe: 'Inmediato',
      projectedImprovement: {
        additionalSavings: (emergencyDistribution.debt - budgetDistribution.debt) * monthlyIncome / 100,
        timeToDebtFree: this.calculatePayoffTime(debts, emergencyDistribution.debt * monthlyIncome / 100)
      },
      steps: [
        `Aumentar presupuesto de deudas a ${emergencyDistribution.debt}%`,
        `Reducir gastos no esenciales a ${emergencyDistribution.want}%`,
        'Suspender temporalmente ahorros no críticos',
        'Minimizar gastos de entretenimiento y lujos',
        'Revisar y cancelar suscripciones no esenciales'
      ]
    });

    return recommendations;
  }

  /**
   * Recomendaciones para deudas altas (30-40% ingreso)
   */
  private getHighDebtRecommendations(
    debtMetrics: DebtMetrics,
    _budgetDistribution: BudgetDistribution,
    debts: Debt[],
    _monthlyIncome: number
  ): DebtRecommendation[] {
    const recommendations: DebtRecommendation[] = [];

    // 1. Estrategia de avalancha de deudas
    const highestInterestDebt = debts.reduce((highest, debt) => 
      debt.interestRate > highest.interestRate ? debt : highest
    );

    recommendations.push({
      id: 'debt-avalanche-strategy',
      type: 'debt-restructure',
      title: 'Estrategia de Avalancha de Deudas',
      description: 'Enfócate en pagar primero las deudas con mayor tasa de interés para minimizar el costo total.',
      impact: 'high',
      difficulty: 'medium',
      estimatedTimeframe: '6-18 meses',
      projectedImprovement: {
        debtReduction: this.calculateInterestSavings(debts, 'avalanche'),
        timeToDebtFree: this.calculatePayoffTime(debts, debtMetrics.totalMinimumPayments * 1.2)
      },
      steps: [
        `Priorizar pago extra en "${highestInterestDebt.name}" (${highestInterestDebt.interestRate}% interés)`,
        'Mantener pagos mínimos en todas las demás deudas',
        'Transferir cualquier dinero extra a la deuda prioritaria',
        'Una vez pagada, aplicar el mismo monto a la siguiente deuda más cara',
        'Repetir hasta eliminar todas las deudas'
      ]
    });

    // 2. Consolidación de deudas
    recommendations.push({
      id: 'debt-consolidation',
      type: 'debt-restructure',
      title: 'Consolidación de Deudas',
      description: 'Combina múltiples deudas en una sola con mejor tasa de interés y pago único.',
      impact: 'medium',
      difficulty: 'medium',
      estimatedTimeframe: '2-4 semanas',
      projectedImprovement: {
        monthlyPaymentReduction: debtMetrics.totalMinimumPayments * 0.15,
        debtReduction: this.calculateConsolidationSavings(debts)
      },
      steps: [
        'Investigar opciones de préstamos de consolidación',
        'Comparar tasas de interés y términos',
        'Calcular ahorros totales vs. costos de consolidación',
        'Aplicar para el préstamo de consolidación',
        'Usar fondos para pagar deudas existentes',
        'Mantener disciplina para no acumular nuevas deudas'
      ]
    });

    return recommendations;
  }

  /**
   * Recomendaciones para deudas medias (20-30% ingreso)
   */
  private getMediumDebtRecommendations(
    debtMetrics: DebtMetrics,
    _budgetDistribution: BudgetDistribution,
    debts: Debt[],
    monthlyIncome: number
  ): DebtRecommendation[] {
    const recommendations: DebtRecommendation[] = [];

    // 1. Optimización de pagos
    recommendations.push({
      id: 'payment-optimization',
      type: 'budget-adjustment',
      title: 'Optimización de Pagos de Deudas',
      description: 'Ajusta tu estrategia de pagos para acelerar la eliminación de deudas sin comprometer tu estabilidad.',
      impact: 'medium',
      difficulty: 'easy',
      estimatedTimeframe: '1-3 meses',
      projectedImprovement: {
        timeToDebtFree: this.calculatePayoffTime(debts, debtMetrics.totalMinimumPayments * 1.3),
        additionalSavings: monthlyIncome * 0.05
      },
      steps: [
        'Aumentar pagos de deudas en 20-30% si es posible',
        'Aplicar método de bola de nieve (menor balance primero)',
        'Usar bonificaciones o ingresos extra para pagos adicionales',
        'Revisar y renegociar tasas de interés',
        'Automatizar pagos para evitar cargos por mora'
      ]
    });

    // 2. Estrategia de refinanciamiento
    recommendations.push({
      id: 'refinancing-strategy',
      type: 'debt-restructure',
      title: 'Estrategia de Refinanciamiento',
      description: 'Busca mejores términos para tus deudas existentes para reducir costos y acelerar pagos.',
      impact: 'medium',
      difficulty: 'medium',
      estimatedTimeframe: '1-2 meses',
      projectedImprovement: {
        monthlyPaymentReduction: debtMetrics.totalMinimumPayments * 0.1,
        debtReduction: this.calculateRefinancingSavings(debts)
      },
      steps: [
        'Revisar tu puntaje crediticio actual',
        'Investigar opciones de refinanciamiento disponibles',
        'Solicitar cotizaciones de múltiples prestamistas',
        'Comparar términos y calcular ahorros reales',
        'Proceder con la mejor opción disponible'
      ]
    });

    return recommendations;
  }

  /**
   * Recomendaciones para deudas bajas (<20% ingreso)
   */
  private getLowDebtRecommendations(
    debtMetrics: DebtMetrics,
    budgetDistribution: BudgetDistribution,
    debts: Debt[],
    monthlyIncome: number
  ): DebtRecommendation[] {
    const recommendations: DebtRecommendation[] = [];

    // 1. Aceleración de pagos para libertad financiera
    recommendations.push({
      id: 'accelerate-payoff',
      type: 'savings-optimization',
      title: 'Acelerar Camino a Libertad Financiera',
      description: 'Tus deudas están controladas. Acelera los pagos para alcanzar la libertad financiera más rápido.',
      impact: 'medium',
      difficulty: 'easy',
      estimatedTimeframe: '3-12 meses',
      projectedImprovement: {
        timeToDebtFree: this.calculatePayoffTime(debts, debtMetrics.totalMinimumPayments * 1.5),
        additionalSavings: monthlyIncome * 0.1
      },
      steps: [
        'Aumentar pagos de deudas en 50% para acelerar eliminación',
        'Mantener el mismo presupuesto de deudas después de pagarlas',
        'Redirigir pagos de deudas completadas a ahorros/inversiones',
        'Establecer metas de libertad financiera específicas',
        'Celebrar hitos importantes en el camino'
      ]
    });

    // 2. Optimización de ahorros e inversiones
    if (budgetDistribution.saving < 20) {
      recommendations.push({
        id: 'optimize-savings-investment',
        type: 'savings-optimization',
        title: 'Optimizar Ahorros e Inversiones',
        description: 'Con deudas controladas, es momento de maximizar tu crecimiento financiero a largo plazo.',
        impact: 'high',
        difficulty: 'easy',
        estimatedTimeframe: '1 mes',
        projectedImprovement: {
          additionalSavings: (25 - budgetDistribution.saving) * monthlyIncome / 100,
          timeToDebtFree: this.calculatePayoffTime(debts, debtMetrics.totalMinimumPayments)
        },
        steps: [
          `Aumentar ahorros de ${budgetDistribution.saving}% a 25%`,
          'Diversificar entre ahorros de emergencia e inversiones',
          'Considerar cuentas de alto rendimiento',
          'Explorar inversiones de bajo riesgo (CDTs, fondos indexados)',
          'Automatizar transferencias a ahorros e inversiones'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Recomendaciones específicas basadas en situaciones particulares
   */
  private getSpecificRecommendations(
    _debtMetrics: DebtMetrics,
    _budgetDistribution: BudgetDistribution,
    debts: Debt[],
    _monthlyIncome: number
  ): DebtRecommendation[] {
    const recommendations: DebtRecommendation[] = [];

    // Recomendación para múltiples tarjetas de crédito
    const creditCards = debts.filter(debt => debt.type === 'credit_card');
    if (creditCards.length > 2) {
      recommendations.push({
        id: 'credit-card-optimization',
        type: 'debt-restructure',
        title: 'Optimización de Tarjetas de Crédito',
        description: `Tienes ${creditCards.length} tarjetas de crédito. Simplifica y optimiza tu gestión.`,
        impact: 'medium',
        difficulty: 'medium',
        estimatedTimeframe: '2-6 semanas',
        projectedImprovement: {
          monthlyPaymentReduction: creditCards.reduce((sum, card) => sum + card.minimumPayment, 0) * 0.2
        },
        steps: [
          'Evaluar beneficios y costos de cada tarjeta',
          'Considerar transferencia de saldos a tarjeta con menor tasa',
          'Cancelar tarjetas con altas cuotas anuales sin beneficios',
          'Mantener máximo 2-3 tarjetas activas',
          'Negociar mejores términos con los emisores'
        ]
      });
    }

    // Recomendación para deudas con tasas muy altas
    const highInterestDebts = debts.filter(debt => debt.interestRate > 25);
    if (highInterestDebts.length > 0) {
      recommendations.push({
        id: 'high-interest-emergency',
        type: 'debt-restructure',
        title: 'Emergencia: Deudas con Interés Muy Alto',
        description: 'Tienes deudas con tasas superiores al 25%. Estas requieren atención inmediata.',
        impact: 'high',
        difficulty: 'medium',
        estimatedTimeframe: '1-4 semanas',
        projectedImprovement: {
          debtReduction: highInterestDebts.reduce((sum, debt) => sum + debt.currentBalance * 0.3, 0)
        },
        steps: [
          'Priorizar absolutamente estas deudas sobre cualquier otra',
          'Buscar opciones de refinanciamiento inmediato',
          'Considerar préstamos personales con menor tasa',
          'Negociar planes de pago con los acreedores',
          'Usar cualquier ahorro disponible para reducir estos balances'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Prioriza recomendaciones por impacto y facilidad de implementación
   */
  private prioritizeRecommendations(recommendations: DebtRecommendation[]): DebtRecommendation[] {
    return recommendations.sort((a, b) => {
      // Priorizar por impacto primero
      const impactScore = { high: 3, medium: 2, low: 1 };
      const impactDiff = impactScore[b.impact] - impactScore[a.impact];
      
      if (impactDiff !== 0) return impactDiff;
      
      // Luego por facilidad (dificultad inversa)
      const difficultyScore = { easy: 3, medium: 2, hard: 1 };
      return difficultyScore[b.difficulty] - difficultyScore[a.difficulty];
    });
  }

  /**
   * Genera ajuste de presupuesto automático
   */
  private generateBudgetAdjustment(
    currentDistribution: BudgetDistribution,
    debtMetrics: DebtMetrics
  ): BudgetDistribution {
    return debtAwareBudgetCalculator.suggestDistributionAdjustment(
      currentDistribution,
      debtMetrics.recommendedPercentage
    );
  }

  /**
   * Genera plan de reestructuración de deudas
   */
  private generateDebtRestructurePlan(data: any): any {
    return {
      strategy: 'consolidation',
      steps: [
        'Evaluar opciones de consolidación',
        'Comparar tasas de interés',
        'Aplicar para préstamo de consolidación',
        'Pagar deudas existentes',
        'Mantener disciplina financiera'
      ],
      estimatedSavings: data?.estimatedSavings || 0,
      timeframe: '2-4 semanas'
    };
  }

  /**
   * Genera optimización de ahorros
   */
  private generateSavingsOptimization(
    currentDistribution: BudgetDistribution,
    debtMetrics: DebtMetrics
  ): any {
    const recommendedSavings = Math.max(20, 30 - debtMetrics.minimumPercentageRequired);
    
    return {
      currentSavingsRate: currentDistribution.saving,
      recommendedSavingsRate: recommendedSavings,
      strategies: [
        'Aumentar transferencias automáticas a ahorros',
        'Abrir cuenta de alto rendimiento',
        'Considerar inversiones de bajo riesgo',
        'Establecer metas de ahorro específicas'
      ]
    };
  }

  /**
   * Genera plan de aumento de ingresos
   */
  private generateIncomeIncreasePlan(data: any): any {
    return {
      strategies: [
        'Buscar trabajo de medio tiempo',
        'Desarrollar habilidades para aumento salarial',
        'Explorar ingresos pasivos',
        'Monetizar hobbies',
        'Negociar aumento en trabajo actual'
      ],
      estimatedIncrease: data?.estimatedIncrease || 0.2,
      timeframe: '2-6 meses'
    };
  }

  /**
   * Genera plan de reducción de gastos
   */
  private generateExpenseReductionPlan(currentDistribution: BudgetDistribution): any {
    return {
      currentWantPercentage: currentDistribution.want,
      recommendedWantPercentage: Math.max(10, currentDistribution.want * 0.7),
      strategies: [
        'Revisar y cancelar suscripciones no utilizadas',
        'Reducir gastos de entretenimiento',
        'Optimizar gastos de transporte',
        'Buscar alternativas más económicas',
        'Implementar presupuesto de gastos variables'
      ]
    };
  }

  /**
   * Calcula distribución de emergencia para situaciones críticas
   */
  private calculateEmergencyDistribution(debtMetrics: DebtMetrics, _monthlyIncome: number): BudgetDistribution {
    const minDebtPercentage = Math.min(45, debtMetrics.minimumPercentageRequired + 5);
    
    return {
      necessity: 50,
      want: 5,
      saving: 0,
      debt: minDebtPercentage
    };
  }

  /**
   * Calcula tiempo de pago de deudas
   */
  private calculatePayoffTime(debts: Debt[], monthlyPayment: number): number {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const avgInterestRate = debts.reduce((sum, debt) => 
      sum + (debt.interestRate * debt.currentBalance), 0) / totalDebt;
    
    if (monthlyPayment <= 0) return Infinity;
    
    const monthlyRate = avgInterestRate / 100 / 12;
    if (monthlyRate === 0) {
      return Math.ceil(totalDebt / monthlyPayment);
    }
    
    const months = -Math.log(1 - (totalDebt * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate);
    return Math.ceil(Math.max(0, months));
  }

  /**
   * Calcula ahorros por estrategia de avalancha
   */
  private calculateInterestSavings(debts: Debt[], strategy: 'avalanche' | 'snowball'): number {
    // Implementación simplificada
    const totalInterest = debts.reduce((sum, debt) => 
      sum + (debt.currentBalance * debt.interestRate / 100), 0);
    
    return strategy === 'avalanche' ? totalInterest * 0.3 : totalInterest * 0.2;
  }

  /**
   * Calcula ahorros por consolidación
   */
  private calculateConsolidationSavings(debts: Debt[]): number {
    const currentInterest = debts.reduce((sum, debt) => 
      sum + (debt.currentBalance * debt.interestRate / 100), 0);
    
    // Asume reducción promedio del 20% en intereses
    return currentInterest * 0.2;
  }

  /**
   * Calcula ahorros por refinanciamiento
   */
  private calculateRefinancingSavings(debts: Debt[]): number {
    const currentInterest = debts.reduce((sum, debt) => 
      sum + (debt.currentBalance * debt.interestRate / 100), 0);
    
    // Asume reducción promedio del 15% en intereses
    return currentInterest * 0.15;
  }
}

// Instancia singleton para uso en toda la aplicación
export const debtRecommendationEngine = new DebtRecommendationEngine();