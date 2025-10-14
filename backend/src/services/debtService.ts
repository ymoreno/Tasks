import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  Debt, 
  DebtPayment, 
  DebtSummary, 
  DebtMetrics, 
  BudgetDistribution, 
  ValidationResult,
  DEFAULT_DEBT_SETTINGS,
  ERROR_CODES
} from '../types';
import { 
  BackendErrorHandler, 
  BackendDebtError, 
  BACKEND_ERROR_CODES, 
  ErrorSeverity 
} from './errorHandler';

const DATA_DIR = path.join(__dirname, '../../data');

export class DebtService {
  private static readonly DEBTS_FILE = path.join(DATA_DIR, 'debts.json');
  private static readonly DEBT_PAYMENTS_FILE = path.join(DATA_DIR, 'debt-payments.json');

  // --- CRUD Operations for Debts ---

  static async getDebts(): Promise<Debt[]> {
    return BackendErrorHandler.wrapAsync(async () => {
      if (!fsSync.existsSync(this.DEBTS_FILE)) {
        await fs.writeFile(this.DEBTS_FILE, JSON.stringify([], null, 2));
        return [];
      }
      
      const data = await fs.readFile(this.DEBTS_FILE, 'utf8');
      
      try {
        const debts = JSON.parse(data);
        
        // Validate data structure
        if (!Array.isArray(debts)) {
          throw new BackendDebtError(
            'Debts file contains invalid data structure',
            BACKEND_ERROR_CODES.DATA_CORRUPTION,
            ErrorSeverity.HIGH,
            { operation: 'getDebts', filePath: this.DEBTS_FILE }
          );
        }
        
        // Validate each debt object
        const validatedDebts = debts.filter(debt => this.validateDebtObject(debt));
        
        if (validatedDebts.length !== debts.length) {
          console.warn(`Filtered out ${debts.length - validatedDebts.length} invalid debt records`);
        }
        
        return validatedDebts;
      } catch (parseError) {
        throw new BackendDebtError(
          'Failed to parse debts file',
          BACKEND_ERROR_CODES.INVALID_JSON,
          ErrorSeverity.MEDIUM,
          { operation: 'getDebts', filePath: this.DEBTS_FILE },
          { parseError: parseError instanceof Error ? parseError.message : parseError }
        );
      }
    }, 'getDebts', { filePath: this.DEBTS_FILE }, []);
  }

  static async getDebt(debtId: string): Promise<Debt | null> {
    return BackendErrorHandler.wrapAsync(async () => {
      if (!debtId || typeof debtId !== 'string') {
        throw new BackendDebtError(
          'Invalid debt ID provided',
          BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
          ErrorSeverity.MEDIUM,
          { operation: 'getDebt', inputData: { debtId } }
        );
      }

      const debts = await this.getDebts();
      const debt = debts.find(debt => debt.id === debtId);
      
      if (!debt) {
        throw new BackendDebtError(
          `Debt with ID ${debtId} not found`,
          BACKEND_ERROR_CODES.DEBT_NOT_FOUND,
          ErrorSeverity.LOW,
          { operation: 'getDebt', inputData: { debtId } }
        );
      }
      
      return debt;
    }, 'getDebt', { debtId }, null);
  }

  static async createDebt(debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    return BackendErrorHandler.wrapAsync(async () => {
      // Validate input data
      this.validateDebtInput(debtData);

      const debts = await this.getDebts();
      const newDebt: Debt = {
        ...debtData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      debts.push(newDebt);
      
      try {
        await fs.writeFile(this.DEBTS_FILE, JSON.stringify(debts, null, 2));
      } catch (writeError) {
        throw new BackendDebtError(
          'Failed to save debt to file',
          BACKEND_ERROR_CODES.FILE_WRITE_ERROR,
          ErrorSeverity.HIGH,
          { operation: 'createDebt', filePath: this.DEBTS_FILE, inputData: debtData },
          { writeError: writeError instanceof Error ? writeError.message : writeError }
        );
      }
      
      return newDebt;
    }, 'createDebt', { inputData: debtData });
  }

  static async updateDebt(debtId: string, updates: Partial<Debt>): Promise<Debt> {
    const debts = await this.getDebts();
    const debtIndex = debts.findIndex(debt => debt.id === debtId);
    
    if (debtIndex === -1) {
      throw new Error('Debt not found');
    }

    debts[debtIndex] = { 
      ...debts[debtIndex], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    
    await fs.writeFile(this.DEBTS_FILE, JSON.stringify(debts, null, 2));
    return debts[debtIndex];
  }

  static async deleteDebt(debtId: string): Promise<boolean> {
    const debts = await this.getDebts();
    const debtIndex = debts.findIndex(debt => debt.id === debtId);
    
    if (debtIndex === -1) {
      return false;
    }

    debts.splice(debtIndex, 1);
    await fs.writeFile(this.DEBTS_FILE, JSON.stringify(debts, null, 2));
    
    // Also remove associated payments
    await this.deletePaymentsByDebtId(debtId);
    
    return true;
  }

  // --- CRUD Operations for Debt Payments ---

  static async getDebtPayments(debtId?: string): Promise<DebtPayment[]> {
    try {
      if (!fsSync.existsSync(this.DEBT_PAYMENTS_FILE)) {
        await fs.writeFile(this.DEBT_PAYMENTS_FILE, JSON.stringify([], null, 2));
        return [];
      }
      const data = await fs.readFile(this.DEBT_PAYMENTS_FILE, 'utf8');
      const payments: DebtPayment[] = JSON.parse(data);
      
      if (debtId) {
        return payments.filter(payment => payment.debtId === debtId);
      }
      
      return payments;
    } catch (error) {
      console.error('Error reading debt payments:', error);
      return [];
    }
  }

  static async addDebtPayment(paymentData: Omit<DebtPayment, 'id' | 'createdAt'>): Promise<DebtPayment> {
    return BackendErrorHandler.wrapAsync(async () => {
      // Validate input data
      this.validatePaymentInput(paymentData);

      // Check if debt exists and get current balance
      const debt = await this.getDebt(paymentData.debtId);
      if (!debt) {
        throw new BackendDebtError(
          `Cannot add payment: debt ${paymentData.debtId} not found`,
          BACKEND_ERROR_CODES.DEBT_NOT_FOUND,
          ErrorSeverity.MEDIUM,
          { operation: 'addDebtPayment', inputData: paymentData }
        );
      }

      // Validate payment amount against current balance
      if (paymentData.amount > debt.currentBalance) {
        throw new BackendDebtError(
          `Payment amount (${paymentData.amount}) exceeds current balance (${debt.currentBalance})`,
          BACKEND_ERROR_CODES.INVALID_PAYMENT_AMOUNT,
          ErrorSeverity.MEDIUM,
          { operation: 'addDebtPayment', inputData: paymentData, currentBalance: debt.currentBalance }
        );
      }

      const payments = await this.getDebtPayments();
      const newPayment: DebtPayment = {
        ...paymentData,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      };

      payments.push(newPayment);
      
      try {
        await fs.writeFile(this.DEBT_PAYMENTS_FILE, JSON.stringify(payments, null, 2));
      } catch (writeError) {
        throw new BackendDebtError(
          'Failed to save payment to file',
          BACKEND_ERROR_CODES.FILE_WRITE_ERROR,
          ErrorSeverity.HIGH,
          { operation: 'addDebtPayment', filePath: this.DEBT_PAYMENTS_FILE, inputData: paymentData },
          { writeError: writeError instanceof Error ? writeError.message : writeError }
        );
      }
      
      // Update debt balance
      await this.updateDebtBalance(paymentData.debtId, paymentData.amount);
      
      return newPayment;
    }, 'addDebtPayment', { inputData: paymentData });
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    const payments = await this.getDebtPayments();
    const paymentIndex = payments.findIndex(payment => payment.id === paymentId);
    
    if (paymentIndex === -1) {
      return false;
    }

    const payment = payments[paymentIndex];
    payments.splice(paymentIndex, 1);
    await fs.writeFile(this.DEBT_PAYMENTS_FILE, JSON.stringify(payments, null, 2));
    
    // Revert debt balance
    await this.updateDebtBalance(payment.debtId, -payment.amount);
    
    return true;
  }

  private static async deletePaymentsByDebtId(debtId: string): Promise<void> {
    const payments = await this.getDebtPayments();
    const filteredPayments = payments.filter(payment => payment.debtId !== debtId);
    await fs.writeFile(this.DEBT_PAYMENTS_FILE, JSON.stringify(filteredPayments, null, 2));
  }

  private static async updateDebtBalance(debtId: string, paymentAmount: number): Promise<void> {
    const debt = await this.getDebt(debtId);
    if (!debt) return;

    const newBalance = Math.max(0, debt.currentBalance - paymentAmount);
    await this.updateDebt(debtId, { currentBalance: newBalance });
  }

  // --- Debt Metrics and Calculations ---

  static async calculateDebtMetrics(monthlyIncome: number): Promise<DebtMetrics> {
    return BackendErrorHandler.wrapAsync(async () => {
      // Validate input
      if (typeof monthlyIncome !== 'number' || !isFinite(monthlyIncome) || monthlyIncome < 0) {
        throw new BackendDebtError(
          'Invalid monthly income for debt metrics calculation',
          BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
          ErrorSeverity.MEDIUM,
          { operation: 'calculateDebtMetrics', inputData: { monthlyIncome } }
        );
      }

      const debts = await this.getDebts();
      const activeDebts = debts.filter(debt => debt.isActive);

      // Validate debt data before calculations
      for (const debt of activeDebts) {
        if (!this.validateDebtObject(debt)) {
          console.warn(`Skipping invalid debt object: ${(debt as any)?.id || 'unknown'}`);
          continue;
        }
      }

      const validActiveDebts = activeDebts.filter(debt => this.validateDebtObject(debt));

      const totalDebt = validActiveDebts.reduce((sum, debt) => {
        const balance = debt.currentBalance;
        if (typeof balance !== 'number' || !isFinite(balance)) {
          console.warn(`Invalid balance for debt ${debt.id}: ${balance}`);
          return sum;
        }
        return sum + balance;
      }, 0);

      const totalMinimumPayments = validActiveDebts.reduce((sum, debt) => {
        const payment = debt.minimumPayment;
        if (typeof payment !== 'number' || !isFinite(payment)) {
          console.warn(`Invalid minimum payment for debt ${debt.id}: ${payment}`);
          return sum;
        }
        return sum + payment;
      }, 0);

      const minimumPercentageRequired = monthlyIncome > 0 ? (totalMinimumPayments / monthlyIncome) * 100 : 0;
      
      // Validate calculated values
      if (!isFinite(minimumPercentageRequired) || minimumPercentageRequired < 0) {
        throw new BackendDebtError(
          'Invalid percentage calculation result',
          BACKEND_ERROR_CODES.DEBT_CALCULATION_FAILED,
          ErrorSeverity.MEDIUM,
          { operation: 'calculateDebtMetrics', inputData: { monthlyIncome, totalMinimumPayments, minimumPercentageRequired } }
        );
      }

      const recommendedPercentage = this.calculateRecommendedDebtPercentage(minimumPercentageRequired);
      const debtToIncomeRatio = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0;
      
      return {
        totalDebt,
        totalMinimumPayments,
        minimumPercentageRequired,
        recommendedPercentage,
        debtToIncomeRatio,
        riskLevel: this.assessRiskLevel(minimumPercentageRequired)
      };
    }, 'calculateDebtMetrics', { monthlyIncome }, {
      totalDebt: 0,
      totalMinimumPayments: 0,
      minimumPercentageRequired: 0,
      recommendedPercentage: 0,
      debtToIncomeRatio: 0,
      riskLevel: 'low' as const
    });
  }

  static calculateRecommendedDistribution(debtMetrics: DebtMetrics): BudgetDistribution {
    const debtPercentage = Math.max(debtMetrics.minimumPercentageRequired, debtMetrics.recommendedPercentage);
    
    if (debtPercentage < 20) {
      return {
        necessity: 50,
        want: 25,
        saving: 15,
        debt: 10
      };
    } else if (debtPercentage <= 30) {
      return {
        necessity: 50,
        want: 20,
        saving: 10,
        debt: 20
      };
    } else {
      return {
        necessity: 60,
        want: 10,
        saving: 5,
        debt: 25
      };
    }
  }

  static validateCustomDistribution(distribution: BudgetDistribution, debtMetrics: DebtMetrics): ValidationResult {
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    const warnings: string[] = [];
    
    if (Math.abs(total - 100) > 0.01) {
      return { 
        isValid: false, 
        error: `La suma de porcentajes debe ser 100%. Actual: ${total.toFixed(2)}%` 
      };
    }
    
    if (distribution.debt < debtMetrics.minimumPercentageRequired) {
      warnings.push(
        `El porcentaje de deudas (${distribution.debt}%) es menor al mínimo requerido (${debtMetrics.minimumPercentageRequired.toFixed(1)}%)`
      );
    }
    
    // Validate that all percentages are non-negative
    for (const [category, percentage] of Object.entries(distribution)) {
      if (percentage < 0) {
        return {
          isValid: false,
          error: `El porcentaje de ${category} no puede ser negativo`
        };
      }
    }
    
    return { isValid: true, warnings };
  }

  private static calculateRecommendedDebtPercentage(minimumRequired: number): number {
    // Add a buffer of 5% above minimum, but cap at reasonable levels
    const buffered = minimumRequired + 5;
    
    if (buffered < 10) return 10;
    if (buffered < 20) return Math.ceil(buffered);
    if (buffered < 30) return Math.ceil(buffered / 5) * 5; // Round to nearest 5%
    return Math.min(35, Math.ceil(buffered / 5) * 5);
  }

  private static assessRiskLevel(debtPercentage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (debtPercentage < 15) return 'low';
    if (debtPercentage < 25) return 'medium';
    if (debtPercentage < 35) return 'high';
    return 'critical';
  }

  // --- Debt Summary and Projections ---

  static async calculateDebtSummary(monthlyIncome: number): Promise<DebtSummary> {
    const debts = await this.getDebts();
    const activeDebts = debts.filter(debt => debt.isActive);

    const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalMinimumPayments = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const averageInterestRate = activeDebts.length > 0 
      ? activeDebts.reduce((sum, debt) => sum + debt.interestRate, 0) / activeDebts.length 
      : 0;

    const payoffProjections = activeDebts.map(debt => {
      const monthsToPayoff = this.calculatePayoffTime(debt.currentBalance, debt.minimumPayment, debt.interestRate);
      const totalInterestToPay = (debt.minimumPayment * monthsToPayoff) - debt.currentBalance;
      
      return {
        debtId: debt.id,
        debtName: debt.name,
        monthsToPayoff,
        totalInterestToPay: Math.max(0, totalInterestToPay)
      };
    });

    return {
      totalDebt,
      totalMinimumPayments,
      totalInterestRate: averageInterestRate,
      monthlyDebtLoad: totalMinimumPayments,
      debtToIncomeRatio: monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0,
      payoffProjections
    };
  }

  private static calculatePayoffTime(balance: number, monthlyPayment: number, annualInterestRate: number): number {
    return BackendErrorHandler.wrapSync(() => {
      if (monthlyPayment <= 0 || balance <= 0) return 0;
      
      const monthlyInterestRate = annualInterestRate / 100 / 12;
      
      if (monthlyInterestRate === 0) {
        return Math.ceil(balance / monthlyPayment);
      }
      
      // Validate inputs to prevent math errors
      if (!isFinite(balance) || !isFinite(monthlyPayment) || !isFinite(annualInterestRate)) {
        throw new BackendDebtError(
          'Invalid numeric values for payoff calculation',
          BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
          ErrorSeverity.MEDIUM,
          { operation: 'calculatePayoffTime', inputData: { balance, monthlyPayment, annualInterestRate } }
        );
      }
      
      // Check for potential division by zero
      const interestPortion = balance * monthlyInterestRate;
      if (monthlyPayment <= interestPortion) {
        // Payment is less than or equal to interest, debt will never be paid off
        return Infinity;
      }
      
      // Formula for loan payoff time
      const numerator = Math.log(1 + interestPortion / monthlyPayment);
      const denominator = Math.log(1 + monthlyInterestRate);
      
      if (denominator === 0) {
        throw new BackendDebtError(
          'Division by zero in payoff calculation',
          BACKEND_ERROR_CODES.DIVISION_BY_ZERO,
          ErrorSeverity.MEDIUM,
          { operation: 'calculatePayoffTime', inputData: { balance, monthlyPayment, annualInterestRate } }
        );
      }
      
      const result = numerator / denominator;
      
      if (!isFinite(result) || result < 0) {
        throw new BackendDebtError(
          'Invalid payoff calculation result',
          BACKEND_ERROR_CODES.DEBT_CALCULATION_FAILED,
          ErrorSeverity.MEDIUM,
          { operation: 'calculatePayoffTime', inputData: { balance, monthlyPayment, annualInterestRate, result } }
        );
      }
      
      return Math.ceil(result);
    }, 'calculatePayoffTime', { balance, monthlyPayment, annualInterestRate }, 0);
  }

  // --- Validation Methods ---

  private static validateDebtObject(debt: any): debt is Debt {
    if (!debt || typeof debt !== 'object') return false;
    
    const requiredFields = [
      'id', 'name', 'type', 'totalAmount', 'currentBalance', 
      'interestRate', 'minimumPayment', 'dueDate', 'paymentFrequency', 
      'creditor', 'isActive', 'createdAt'
    ];
    
    for (const field of requiredFields) {
      if (!(field in debt)) return false;
    }
    
    // Validate numeric fields
    const numericFields = ['totalAmount', 'currentBalance', 'interestRate', 'minimumPayment'];
    for (const field of numericFields) {
      const value = debt[field];
      if (typeof value !== 'number' || !isFinite(value) || value < 0) {
        return false;
      }
    }
    
    // Validate string fields
    const stringFields = ['id', 'name', 'type', 'creditor', 'paymentFrequency'];
    for (const field of stringFields) {
      if (typeof debt[field] !== 'string' || debt[field].trim() === '') {
        return false;
      }
    }
    
    // Validate boolean fields
    if (typeof debt.isActive !== 'boolean') return false;
    
    // Validate dates
    try {
      new Date(debt.dueDate);
      new Date(debt.createdAt);
    } catch {
      return false;
    }
    
    return true;
  }

  private static validateDebtInput(debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!debtData || typeof debtData !== 'object') {
      throw new BackendDebtError(
        'Invalid debt data provided',
        BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
        ErrorSeverity.MEDIUM,
        { operation: 'validateDebtInput', inputData: debtData }
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'type', 'totalAmount', 'currentBalance', 'interestRate', 'minimumPayment', 'dueDate', 'paymentFrequency', 'creditor'];
    for (const field of requiredFields) {
      if (!(field in debtData) || debtData[field as keyof typeof debtData] === undefined || debtData[field as keyof typeof debtData] === null) {
        throw new BackendDebtError(
          `Missing required field: ${field}`,
          BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
          ErrorSeverity.MEDIUM,
          { operation: 'validateDebtInput', inputData: debtData, missingField: field }
        );
      }
    }

    // Validate numeric fields
    const numericFields = ['totalAmount', 'currentBalance', 'interestRate', 'minimumPayment'];
    for (const field of numericFields) {
      const value = debtData[field as keyof typeof debtData] as number;
      if (typeof value !== 'number' || !isFinite(value) || value < 0) {
        throw new BackendDebtError(
          `Invalid ${field}: must be a positive number`,
          BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
          ErrorSeverity.MEDIUM,
          { operation: 'validateDebtInput', inputData: debtData, invalidField: field, value }
        );
      }
    }

    // Validate string fields
    const stringFields = ['name', 'type', 'creditor', 'paymentFrequency'];
    for (const field of stringFields) {
      const value = debtData[field as keyof typeof debtData] as string;
      if (typeof value !== 'string' || value.trim() === '') {
        throw new BackendDebtError(
          `Invalid ${field}: must be a non-empty string`,
          BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
          ErrorSeverity.MEDIUM,
          { operation: 'validateDebtInput', inputData: debtData, invalidField: field, value }
        );
      }
    }

    // Validate business logic
    if (debtData.currentBalance > debtData.totalAmount) {
      throw new BackendDebtError(
        'Current balance cannot exceed total amount',
        BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
        ErrorSeverity.MEDIUM,
        { operation: 'validateDebtInput', inputData: debtData }
      );
    }

    if (debtData.minimumPayment > debtData.currentBalance && debtData.currentBalance > 0) {
      throw new BackendDebtError(
        'Minimum payment cannot exceed current balance',
        BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
        ErrorSeverity.MEDIUM,
        { operation: 'validateDebtInput', inputData: debtData }
      );
    }

    // Validate date format
    try {
      new Date(debtData.dueDate);
    } catch {
      throw new BackendDebtError(
        'Invalid due date format',
        BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
        ErrorSeverity.MEDIUM,
        { operation: 'validateDebtInput', inputData: debtData, invalidField: 'dueDate' }
      );
    }
  }

  private static validatePaymentInput(paymentData: Omit<DebtPayment, 'id' | 'createdAt'>): void {
    if (!paymentData || typeof paymentData !== 'object') {
      throw new BackendDebtError(
        'Invalid payment data provided',
        BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
        ErrorSeverity.MEDIUM,
        { operation: 'validatePaymentInput', inputData: paymentData }
      );
    }

    // Validate required fields
    const requiredFields = ['debtId', 'amount', 'paymentDate', 'paymentType'];
    for (const field of requiredFields) {
      if (!(field in paymentData) || paymentData[field as keyof typeof paymentData] === undefined || paymentData[field as keyof typeof paymentData] === null) {
        throw new BackendDebtError(
          `Missing required field: ${field}`,
          BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
          ErrorSeverity.MEDIUM,
          { operation: 'validatePaymentInput', inputData: paymentData, missingField: field }
        );
      }
    }

    // Validate amount
    if (typeof paymentData.amount !== 'number' || !isFinite(paymentData.amount) || paymentData.amount <= 0) {
      throw new BackendDebtError(
        'Payment amount must be a positive number',
        BACKEND_ERROR_CODES.INVALID_PAYMENT_AMOUNT,
        ErrorSeverity.MEDIUM,
        { operation: 'validatePaymentInput', inputData: paymentData }
      );
    }

    // Validate payment type
    const validPaymentTypes = ['minimum', 'extra', 'full'];
    if (!validPaymentTypes.includes(paymentData.paymentType)) {
      throw new BackendDebtError(
        'Invalid payment type',
        BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
        ErrorSeverity.MEDIUM,
        { operation: 'validatePaymentInput', inputData: paymentData, validTypes: validPaymentTypes }
      );
    }

    // Validate date
    try {
      new Date(paymentData.paymentDate);
    } catch {
      throw new BackendDebtError(
        'Invalid payment date format',
        BACKEND_ERROR_CODES.INVALID_INPUT_DATA,
        ErrorSeverity.MEDIUM,
        { operation: 'validatePaymentInput', inputData: paymentData, invalidField: 'paymentDate' }
      );
    }
  }

  // --- System Health and Diagnostics ---

  static getSystemHealth(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
    errorStatistics: any;
  } {
    const health = BackendErrorHandler.validateSystemHealth();
    const errorStats = BackendErrorHandler.getErrorStatistics();
    
    return {
      ...health,
      errorStatistics: errorStats
    };
  }

  static clearErrorLog(): void {
    BackendErrorHandler.clearErrorLog();
  }
}