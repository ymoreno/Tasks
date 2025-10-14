// Versión stub temporal para evitar errores de compilación
export class DebtBudgetService {
  static async calculateDebtMetrics() {
    return {
      totalDebt: 0,
      totalMinimumPayments: 0,
      debtToIncomeRatio: 0,
      minimumPercentageRequired: 0,
      recommendedPercentage: 10,
      payoffTimeMonths: 0,
      totalInterestProjected: 0,
      averageInterestRate: 0
    };
  }

  static async getRecommendedDistribution() {
    return {
      necessity: 50,
      want: 25,
      saving: 15,
      debt: 10
    };
  }

  static async validateCustomDistribution() {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  static async updateBudgetDistribution() {
    return;
  }
}

export default DebtBudgetService;