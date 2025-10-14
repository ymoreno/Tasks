// Versión stub temporal para evitar errores de compilación
export interface DetailedValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DebtDistributionValidator {
  static validateDistribution(): DetailedValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }
}

export default DebtDistributionValidator;