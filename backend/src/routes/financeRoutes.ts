import express from 'express';
import { FinanceService } from '../services/dataService';
import { DebtService } from '../services/debtService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse, FinancialProfile, Expense, FinancialSummary, BudgetDistribution, DebtBudgetSettings, DebtMetrics } from '../types';

const router = express.Router();

// GET /api/finance/profile - Obtener perfil financiero
router.get('/profile', async (req, res, next) => {
  try {
    const profile = await FinanceService.getProfile();
    
    const response: ApiResponse<FinancialProfile | null> = {
      success: true,
      data: profile,
      message: profile ? 'Perfil financiero obtenido exitosamente' : 'No hay perfil financiero configurado'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/finance/profile - Crear perfil financiero
router.post('/profile', async (req, res, next) => {
  try {
    const { monthlyIncome, distributionType } = req.body;

    if (!monthlyIncome || monthlyIncome <= 0) {
      throw createError('El ingreso mensual debe ser mayor a 0', 400);
    }

    if (!['recommended', 'custom', 'debt-aware'].includes(distributionType)) {
      throw createError('Tipo de distribución inválido', 400);
    }

    const profile = await FinanceService.createProfile(monthlyIncome, distributionType);
    
    const response: ApiResponse<FinancialProfile> = {
      success: true,
      data: profile,
      message: 'Perfil financiero creado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/finance/profile - Actualizar perfil financiero
router.put('/profile', async (req, res, next) => {
  try {
    const updates = req.body;
    const updatedProfile = await FinanceService.updateProfile(updates);
    
    const response: ApiResponse<FinancialProfile> = {
      success: true,
      data: updatedProfile,
      message: 'Perfil financiero actualizado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/finance/expenses - Obtener gastos
router.get('/expenses', async (req, res, next) => {
  try {
    const expenses = await FinanceService.getExpenses();
    
    const response: ApiResponse<Expense[]> = {
      success: true,
      data: expenses,
      message: 'Gastos obtenidos exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/finance/expenses - Agregar gasto
router.post('/expenses', async (req, res, next) => {
  try {
    const { categoryId, amount, description, date } = req.body;

    if (!categoryId || !amount || amount <= 0) {
      throw createError('Categoría y monto son requeridos, monto debe ser mayor a 0', 400);
    }

    if (!description || description.trim() === '') {
      throw createError('La descripción es requerida', 400);
    }

    const expenseData = {
      categoryId,
      amount: parseFloat(amount),
      description: description.trim(),
      date: date || new Date().toISOString()
    };

    const expense = await FinanceService.addExpense(expenseData);
    
    const response: ApiResponse<Expense> = {
      success: true,
      data: expense,
      message: 'Gasto agregado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/finance/expenses/:id - Actualizar gasto
router.put('/expenses/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.amount && updates.amount <= 0) {
      throw createError('El monto debe ser mayor a 0', 400);
    }

    const updatedExpense = await FinanceService.updateExpense(id, updates);
    
    const response: ApiResponse<Expense> = {
      success: true,
      data: updatedExpense,
      message: 'Gasto actualizado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/finance/expenses/:id - Eliminar gasto
router.delete('/expenses/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await FinanceService.deleteExpense(id);
    
    if (!deleted) {
      throw createError('Gasto no encontrado', 404);
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Gasto eliminado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/finance/summary - Obtener resumen financiero
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await FinanceService.calculateSummary();
    
    const response: ApiResponse<FinancialSummary> = {
      success: true,
      data: summary,
      message: 'Resumen financiero calculado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// --- New Debt-Aware Budget Endpoints ---

// PUT /api/finance/budget-distribution - Update budget distribution
router.put('/budget-distribution', async (req, res, next) => {
  try {
    const { distribution } = req.body;

    if (!distribution) {
      throw createError('Budget distribution is required', 400);
    }

    // Validate distribution structure
    const requiredKeys = ['necessity', 'want', 'saving', 'debt'];
    for (const key of requiredKeys) {
      if (typeof distribution[key] !== 'number') {
        throw createError(`Distribution must include valid ${key} percentage`, 400);
      }
    }

    // Validate that percentages sum to 100
    const total = Object.values(distribution).reduce((sum: number, val: any) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw createError(`Distribution percentages must sum to 100%. Current total: ${total}%`, 400);
    }

    const updatedProfile = await FinanceService.updateBudgetDistribution(distribution);
    
    const response: ApiResponse<FinancialProfile> = {
      success: true,
      data: updatedProfile,
      message: 'Budget distribution updated successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/finance/debt-settings - Update debt settings
router.put('/debt-settings', async (req, res, next) => {
  try {
    const { debtSettings } = req.body;

    if (!debtSettings) {
      throw createError('Debt settings are required', 400);
    }

    const updatedProfile = await FinanceService.updateDebtSettings(debtSettings);
    
    const response: ApiResponse<FinancialProfile> = {
      success: true,
      data: updatedProfile,
      message: 'Debt settings updated successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/finance/ensure-debt-category - Ensure debt category exists
router.post('/ensure-debt-category', async (req, res, next) => {
  try {
    const updatedProfile = await FinanceService.ensureDebtCategory();
    
    const response: ApiResponse<FinancialProfile> = {
      success: true,
      data: updatedProfile,
      message: 'Debt category ensured successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/finance/recalculate-with-debts - Recalculate budget with debt metrics
router.post('/recalculate-with-debts', async (req, res, next) => {
  try {
    const profile = await FinanceService.getProfile();
    if (!profile) {
      throw createError('No financial profile found', 404);
    }

    // Calculate current debt metrics
    const debtMetrics = await DebtService.calculateDebtMetrics(profile.monthlyIncome);
    
    // Recalculate profile with debt metrics
    const updatedProfile = await FinanceService.recalculateWithDebtMetrics(debtMetrics);
    
    const response: ApiResponse<{ profile: FinancialProfile; metrics: DebtMetrics }> = {
      success: true,
      data: { profile: updatedProfile, metrics: debtMetrics },
      message: 'Budget recalculated with debt metrics successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/finance/debt-metrics - Get current debt metrics
router.get('/debt-metrics', async (req, res, next) => {
  try {
    const profile = await FinanceService.getProfile();
    if (!profile) {
      throw createError('No financial profile found', 404);
    }

    const debtMetrics = await DebtService.calculateDebtMetrics(profile.monthlyIncome);
    
    const response: ApiResponse<DebtMetrics> = {
      success: true,
      data: debtMetrics,
      message: 'Debt metrics calculated successfully'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// --- Data Migration and Validation Endpoints ---

// POST /api/finance/migrate-profile - Migrate existing profile to support debt features
router.post('/migrate-profile', async (req, res, next) => {
  try {
    const migratedProfile = await FinanceService.migrateExistingProfile();
    
    if (!migratedProfile) {
      throw createError('No profile found to migrate', 404);
    }
    
    const response: ApiResponse<FinancialProfile> = {
      success: true,
      data: migratedProfile,
      message: 'Profile migrated successfully to support debt features'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/finance/validate-profile - Validate profile integrity
router.get('/validate-profile', async (req, res, next) => {
  try {
    const validation = await FinanceService.validateProfileIntegrity();
    
    const response: ApiResponse<any> = {
      success: true,
      data: validation,
      message: 'Profile validation completed'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export { router as financeRoutes };