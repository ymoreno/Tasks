import express from 'express';
import { DebtService } from '../services/debtService';
import { DebtExpenseService } from '../services/debtExpenseService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse, Debt, DebtPayment, DebtSummary, DebtMetrics, BudgetDistribution } from '../types';

const router = express.Router();

// --- Debt CRUD Operations ---

// GET /api/debts - Get all debts
router.get('/', async (req, res, next) => {
  try {
    const debts = await DebtService.getDebts();
    
    const response: ApiResponse<Debt[]> = {
      success: true,
      data: debts,
      message: 'Debts retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(createError('Error retrieving debts', 500));
  }
});

// GET /api/debts/:id - Get specific debt
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const debt = await DebtService.getDebt(id);
    
    if (!debt) {
      throw createError('Debt not found', 404);
    }
    
    const response: ApiResponse<Debt> = {
      success: true,
      data: debt,
      message: 'Debt retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/debts - Create new debt
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      type,
      totalAmount,
      currentBalance,
      interestRate,
      minimumPayment,
      dueDate,
      paymentFrequency,
      creditor,
      description,
      isActive = true
    } = req.body;

    // Validation
    if (!name || !type || !totalAmount || !currentBalance || !minimumPayment || !creditor) {
      throw createError('Missing required fields: name, type, totalAmount, currentBalance, minimumPayment, creditor', 400);
    }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      throw createError('Total amount must be a positive number', 400);
    }

    if (typeof currentBalance !== 'number' || currentBalance < 0) {
      throw createError('Current balance must be a non-negative number', 400);
    }

    if (typeof minimumPayment !== 'number' || minimumPayment <= 0) {
      throw createError('Minimum payment must be a positive number', 400);
    }

    if (typeof interestRate !== 'number' || interestRate < 0) {
      throw createError('Interest rate must be a non-negative number', 400);
    }

    const validTypes = ['credit_card', 'bank_loan', 'personal_loan', 'mortgage', 'vehicle_loan', 'commercial_credit'];
    if (!validTypes.includes(type)) {
      throw createError(`Invalid debt type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    const validFrequencies = ['monthly', 'biweekly', 'weekly'];
    if (paymentFrequency && !validFrequencies.includes(paymentFrequency)) {
      throw createError(`Invalid payment frequency. Must be one of: ${validFrequencies.join(', ')}`, 400);
    }

    const debt = await DebtService.createDebt({
      name,
      type,
      totalAmount,
      currentBalance,
      interestRate,
      minimumPayment,
      dueDate,
      paymentFrequency: paymentFrequency || 'monthly',
      creditor,
      description,
      isActive
    });
    
    const response: ApiResponse<Debt> = {
      success: true,
      data: debt,
      message: 'Debt created successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/debts/:id - Update debt
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate numeric fields if provided
    if (updates.totalAmount !== undefined && (typeof updates.totalAmount !== 'number' || updates.totalAmount <= 0)) {
      throw createError('Total amount must be a positive number', 400);
    }

    if (updates.currentBalance !== undefined && (typeof updates.currentBalance !== 'number' || updates.currentBalance < 0)) {
      throw createError('Current balance must be a non-negative number', 400);
    }

    if (updates.minimumPayment !== undefined && (typeof updates.minimumPayment !== 'number' || updates.minimumPayment <= 0)) {
      throw createError('Minimum payment must be a positive number', 400);
    }

    if (updates.interestRate !== undefined && (typeof updates.interestRate !== 'number' || updates.interestRate < 0)) {
      throw createError('Interest rate must be a non-negative number', 400);
    }

    const updatedDebt = await DebtService.updateDebt(id, updates);
    
    const response: ApiResponse<Debt> = {
      success: true,
      data: updatedDebt,
      message: 'Debt updated successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/debts/:id - Delete debt
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await DebtService.deleteDebt(id);
    
    if (!deleted) {
      throw createError('Debt not found', 404);
    }
    
    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Debt deleted successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// --- Debt Payment Operations ---

// GET /api/debts/:id/payments - Get payments for specific debt
router.get('/:id/payments', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payments = await DebtService.getDebtPayments(id);
    
    const response: ApiResponse<DebtPayment[]> = {
      success: true,
      data: payments,
      message: 'Debt payments retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(createError('Error retrieving debt payments', 500));
  }
});

// POST /api/debts/:id/payments - Add payment to debt
router.post('/:id/payments', async (req, res, next) => {
  try {
    const { id: debtId } = req.params;
    const { amount, paymentDate, paymentType, description } = req.body;

    // Validation
    if (!amount || !paymentDate) {
      throw createError('Missing required fields: amount, paymentDate', 400);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw createError('Payment amount must be a positive number', 400);
    }

    const validPaymentTypes = ['minimum', 'extra', 'full'];
    if (paymentType && !validPaymentTypes.includes(paymentType)) {
      throw createError(`Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}`, 400);
    }

    // Verify debt exists
    const debt = await DebtService.getDebt(debtId);
    if (!debt) {
      throw createError('Debt not found', 404);
    }

    const payment = await DebtService.addDebtPayment({
      debtId,
      amount,
      paymentDate,
      paymentType: paymentType || 'minimum',
      description
    });

    // Create associated expense in debt category
    const expense = await DebtExpenseService.createExpenseFromDebtPayment(payment);
    
    const response: ApiResponse<{ payment: DebtPayment; expense: any }> = {
      success: true,
      data: { payment, expense },
      message: 'Payment added successfully and expense created'
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/debts/payments/:paymentId - Delete payment
router.delete('/payments/:paymentId', async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    
    // Remove associated expense first
    const expenseRemoved = await DebtExpenseService.removeExpenseFromDebtPayment(paymentId);
    
    const deleted = await DebtService.deletePayment(paymentId);
    
    if (!deleted) {
      throw createError('Payment not found', 404);
    }
    
    const response: ApiResponse<{ paymentDeleted: boolean; expenseRemoved: boolean }> = {
      success: true,
      data: { paymentDeleted: deleted, expenseRemoved },
      message: 'Payment and associated expense deleted successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// --- Debt Analytics and Calculations ---

// POST /api/debts/metrics - Calculate debt metrics
router.post('/metrics', async (req, res, next) => {
  try {
    const { monthlyIncome } = req.body;

    if (!monthlyIncome || typeof monthlyIncome !== 'number' || monthlyIncome <= 0) {
      throw createError('Valid monthly income is required', 400);
    }

    const metrics = await DebtService.calculateDebtMetrics(monthlyIncome);
    
    const response: ApiResponse<DebtMetrics> = {
      success: true,
      data: metrics,
      message: 'Debt metrics calculated successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(createError('Error calculating debt metrics', 500));
  }
});

// POST /api/debts/distribution/recommended - Get recommended budget distribution
router.post('/distribution/recommended', async (req, res, next) => {
  try {
    const { monthlyIncome } = req.body;

    if (!monthlyIncome || typeof monthlyIncome !== 'number' || monthlyIncome <= 0) {
      throw createError('Valid monthly income is required', 400);
    }

    const metrics = await DebtService.calculateDebtMetrics(monthlyIncome);
    const distribution = DebtService.calculateRecommendedDistribution(metrics);
    
    const response: ApiResponse<{ distribution: BudgetDistribution; metrics: DebtMetrics }> = {
      success: true,
      data: { distribution, metrics },
      message: 'Recommended distribution calculated successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(createError('Error calculating recommended distribution', 500));
  }
});

// POST /api/debts/distribution/validate - Validate custom budget distribution
router.post('/distribution/validate', async (req, res, next) => {
  try {
    const { distribution, monthlyIncome } = req.body;

    if (!distribution || !monthlyIncome) {
      throw createError('Distribution and monthly income are required', 400);
    }

    if (typeof monthlyIncome !== 'number' || monthlyIncome <= 0) {
      throw createError('Valid monthly income is required', 400);
    }

    // Validate distribution structure
    const requiredKeys = ['necessity', 'want', 'saving', 'debt'];
    for (const key of requiredKeys) {
      if (typeof distribution[key] !== 'number') {
        throw createError(`Distribution must include valid ${key} percentage`, 400);
      }
    }

    const metrics = await DebtService.calculateDebtMetrics(monthlyIncome);
    const validation = DebtService.validateCustomDistribution(distribution, metrics);
    
    const response: ApiResponse<{ validation: any; metrics: DebtMetrics }> = {
      success: true,
      data: { validation, metrics },
      message: 'Distribution validation completed'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/debts/summary - Get debt summary with projections
router.post('/summary', async (req, res, next) => {
  try {
    const { monthlyIncome } = req.body;

    if (!monthlyIncome || typeof monthlyIncome !== 'number' || monthlyIncome <= 0) {
      throw createError('Valid monthly income is required', 400);
    }

    const summary = await DebtService.calculateDebtSummary(monthlyIncome);
    
    const response: ApiResponse<DebtSummary> = {
      success: true,
      data: summary,
      message: 'Debt summary calculated successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(createError('Error calculating debt summary', 500));
  }
});

// --- Debt-Expense Integration Endpoints ---

// POST /api/debts/validate-payment-budget - Validate payment against budget
router.post('/validate-payment-budget', async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw createError('Valid payment amount is required', 400);
    }

    const validation = await DebtExpenseService.validateDebtPaymentBudget(amount);
    
    const response: ApiResponse<any> = {
      success: true,
      data: validation,
      message: 'Payment budget validation completed'
    };
    
    res.json(response);
  } catch (error) {
    next(createError('Error validating payment budget', 500));
  }
});

// GET /api/debts/expense-statistics - Get debt expense statistics
router.get('/expense-statistics', async (req, res, next) => {
  try {
    const statistics = await DebtExpenseService.getDebtExpenseStatistics();
    
    const response: ApiResponse<any> = {
      success: true,
      data: statistics,
      message: 'Debt expense statistics retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(createError('Error retrieving debt expense statistics', 500));
  }
});

// POST /api/debts/ensure-debt-category - Ensure debt category exists
router.post('/ensure-debt-category', async (req, res, next) => {
  try {
    const debtCategory = await DebtExpenseService.ensureDebtCategoryExists();
    
    const response: ApiResponse<any> = {
      success: true,
      data: debtCategory,
      message: debtCategory ? 'Debt category ensured successfully' : 'Failed to create debt category'
    };
    
    res.json(response);
  } catch (error) {
    next(createError('Error ensuring debt category', 500));
  }
});

export default router;