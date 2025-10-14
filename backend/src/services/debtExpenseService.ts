import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FinanceService } from './dataService';
import { DebtService } from './debtService';
import { Expense, DebtPayment, BudgetCategory } from '../types';

const DATA_DIR = path.join(__dirname, '../../data');

interface DebtExpenseTracking {
  id: string;
  debtId: string;
  paymentId: string;
  expenseId: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}

export class DebtExpenseService {
  private static readonly DEBT_EXPENSE_TRACKING_FILE = path.join(DATA_DIR, 'debt-expense-tracking.json');

  // --- Tracking Operations ---

  static async getTrackingRecords(): Promise<DebtExpenseTracking[]> {
    try {
      if (!fsSync.existsSync(this.DEBT_EXPENSE_TRACKING_FILE)) {
        await fs.writeFile(this.DEBT_EXPENSE_TRACKING_FILE, JSON.stringify([], null, 2));
        return [];
      }
      const data = await fs.readFile(this.DEBT_EXPENSE_TRACKING_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading debt expense tracking:', error);
      return [];
    }
  }

  static async addTrackingRecord(record: Omit<DebtExpenseTracking, 'id' | 'createdAt'>): Promise<DebtExpenseTracking> {
    const records = await this.getTrackingRecords();
    const newRecord: DebtExpenseTracking = {
      ...record,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    records.push(newRecord);
    await fs.writeFile(this.DEBT_EXPENSE_TRACKING_FILE, JSON.stringify(records, null, 2));
    
    return newRecord;
  }

  static async removeTrackingRecord(paymentId: string): Promise<boolean> {
    const records = await this.getTrackingRecords();
    const recordIndex = records.findIndex(record => record.paymentId === paymentId);
    
    if (recordIndex === -1) {
      return false;
    }

    records.splice(recordIndex, 1);
    await fs.writeFile(this.DEBT_EXPENSE_TRACKING_FILE, JSON.stringify(records, null, 2));
    
    return true;
  }

  static async getTrackingByPaymentId(paymentId: string): Promise<DebtExpenseTracking | null> {
    const records = await this.getTrackingRecords();
    return records.find(record => record.paymentId === paymentId) || null;
  }

  // --- Integration Methods ---

  static async createExpenseFromDebtPayment(payment: DebtPayment): Promise<Expense | null> {
    try {
      // Get financial profile to find debt category
      const profile = await FinanceService.getProfile();
      if (!profile) {
        console.warn('No financial profile found, cannot create expense from debt payment');
        return null;
      }

      // Find debt category
      const debtCategory = profile.categories.find(cat => cat.type === 'debt' || cat.isDebtCategory);
      if (!debtCategory) {
        console.warn('No debt category found, cannot create expense from debt payment');
        return null;
      }

      // Get debt information for better description
      const debt = await DebtService.getDebt(payment.debtId);
      const debtName = debt ? debt.name : 'Deuda desconocida';

      // Create expense
      const expenseData = {
        categoryId: debtCategory.id,
        amount: payment.amount,
        description: `Pago de deuda: ${debtName}${payment.description ? ` - ${payment.description}` : ''}`,
        date: payment.paymentDate
      };

      const expense = await FinanceService.addExpense(expenseData);

      // Create tracking record
      await this.addTrackingRecord({
        debtId: payment.debtId,
        paymentId: payment.id,
        expenseId: expense.id,
        amount: payment.amount,
        paymentDate: payment.paymentDate
      });

      return expense;
    } catch (error) {
      console.error('Error creating expense from debt payment:', error);
      return null;
    }
  }

  static async removeExpenseFromDebtPayment(paymentId: string): Promise<boolean> {
    try {
      // Find tracking record
      const trackingRecord = await this.getTrackingByPaymentId(paymentId);
      if (!trackingRecord) {
        console.warn(`No tracking record found for payment ${paymentId}`);
        return false;
      }

      // Remove expense
      const expenseDeleted = await FinanceService.deleteExpense(trackingRecord.expenseId);
      if (!expenseDeleted) {
        console.warn(`Failed to delete expense ${trackingRecord.expenseId}`);
      }

      // Remove tracking record
      const trackingDeleted = await this.removeTrackingRecord(paymentId);
      
      return expenseDeleted && trackingDeleted;
    } catch (error) {
      console.error('Error removing expense from debt payment:', error);
      return false;
    }
  }

  static async ensureDebtCategoryExists(): Promise<BudgetCategory | null> {
    try {
      const profile = await FinanceService.getProfile();
      if (!profile) {
        return null;
      }

      // Check if debt category exists
      let debtCategory = profile.categories.find(cat => cat.type === 'debt' || cat.isDebtCategory);
      
      if (!debtCategory) {
        // Create debt category by ensuring it exists
        const updatedProfile = await FinanceService.ensureDebtCategory();
        debtCategory = updatedProfile.categories.find(cat => cat.type === 'debt' || cat.isDebtCategory);
      }

      return debtCategory || null;
    } catch (error) {
      console.error('Error ensuring debt category exists:', error);
      return null;
    }
  }

  // --- Validation Methods ---

  static async validateDebtPaymentBudget(paymentAmount: number): Promise<{
    isValid: boolean;
    availableBudget: number;
    exceedsBy?: number;
    warning?: string;
  }> {
    try {
      const profile = await FinanceService.getProfile();
      if (!profile) {
        return {
          isValid: false,
          availableBudget: 0,
          warning: 'No financial profile found'
        };
      }

      const debtCategory = profile.categories.find(cat => cat.type === 'debt' || cat.isDebtCategory);
      if (!debtCategory) {
        return {
          isValid: true, // Allow payment if no debt category (will be created)
          availableBudget: 0,
          warning: 'No debt category found, will be created automatically'
        };
      }

      const availableBudget = debtCategory.budgetAmount - debtCategory.spentAmount;
      const isValid = paymentAmount <= availableBudget;
      
      if (!isValid) {
        return {
          isValid: false,
          availableBudget,
          exceedsBy: paymentAmount - availableBudget,
          warning: `Payment exceeds available debt budget by ${(paymentAmount - availableBudget).toLocaleString()}`
        };
      }

      return {
        isValid: true,
        availableBudget
      };
    } catch (error) {
      console.error('Error validating debt payment budget:', error);
      return {
        isValid: false,
        availableBudget: 0,
        warning: 'Error validating budget'
      };
    }
  }

  // --- Statistics and Reporting ---

  static async getDebtExpenseStatistics(): Promise<{
    totalDebtPayments: number;
    totalDebtExpenses: number;
    currentMonthPayments: number;
    averagePaymentAmount: number;
    paymentsByDebt: { debtId: string; totalPaid: number; paymentCount: number }[];
  }> {
    try {
      const trackingRecords = await this.getTrackingRecords();
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const totalDebtPayments = trackingRecords.length;
      const totalDebtExpenses = trackingRecords.reduce((sum, record) => sum + record.amount, 0);
      
      const currentMonthRecords = trackingRecords.filter(record => 
        record.paymentDate.startsWith(currentMonth)
      );
      const currentMonthPayments = currentMonthRecords.reduce((sum, record) => sum + record.amount, 0);
      
      const averagePaymentAmount = totalDebtPayments > 0 ? totalDebtExpenses / totalDebtPayments : 0;

      // Group by debt
      const paymentsByDebt = trackingRecords.reduce((acc, record) => {
        const existing = acc.find(item => item.debtId === record.debtId);
        if (existing) {
          existing.totalPaid += record.amount;
          existing.paymentCount += 1;
        } else {
          acc.push({
            debtId: record.debtId,
            totalPaid: record.amount,
            paymentCount: 1
          });
        }
        return acc;
      }, [] as { debtId: string; totalPaid: number; paymentCount: number }[]);

      return {
        totalDebtPayments,
        totalDebtExpenses,
        currentMonthPayments,
        averagePaymentAmount,
        paymentsByDebt
      };
    } catch (error) {
      console.error('Error calculating debt expense statistics:', error);
      return {
        totalDebtPayments: 0,
        totalDebtExpenses: 0,
        currentMonthPayments: 0,
        averagePaymentAmount: 0,
        paymentsByDebt: []
      };
    }
  }
}