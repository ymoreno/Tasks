import express from 'express';
import { FinanceService } from '../services/dataService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse, FinancialProfile, Expense, FinancialSummary } from '../types';

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

    if (!['recommended', 'custom'].includes(distributionType)) {
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

export { router as financeRoutes };