import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  FinancialProfile, 
  Expense, 
  FinancialSummary, 
  FinanceContextType,
  Debt,
  DebtPayment,
  DebtSummary,
  DebtMetrics,
  BudgetDistribution
} from '@/types';
import { financeService, debtService } from '@/services/api';
import { debtAwareBudgetCalculator } from '@/services/debtAwareBudgetCalculator';

// Estado inicial
const initialState = {
  profile: null,
  expenses: [],
  debts: [],
  debtPayments: [],
  summary: null,
  debtSummary: null,
  debtMetrics: null,
  budgetDistribution: null,
  loading: false,
  error: null,
};

// Reducer para manejar el estado
type FinanceAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROFILE'; payload: FinancialProfile | null }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_DEBTS'; payload: Debt[] }
  | { type: 'SET_DEBT_PAYMENTS'; payload: DebtPayment[] }
  | { type: 'SET_SUMMARY'; payload: FinancialSummary | null }
  | { type: 'SET_DEBT_SUMMARY'; payload: DebtSummary | null }
  | { type: 'SET_DEBT_METRICS'; payload: DebtMetrics | null }
  | { type: 'SET_BUDGET_DISTRIBUTION'; payload: BudgetDistribution | null }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'ADD_DEBT'; payload: Debt }
  | { type: 'ADD_DEBT_PAYMENT'; payload: DebtPayment }
  | { type: 'UPDATE_EXPENSE'; payload: { expenseId: string; updates: Partial<Expense> } }
  | { type: 'UPDATE_DEBT'; payload: { debtId: string; updates: Partial<Debt> } }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'DELETE_DEBT'; payload: string };

const financeReducer = (state: any, action: FinanceAction) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload, loading: false };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload, loading: false };
    case 'SET_DEBTS':
      return { ...state, debts: action.payload, loading: false };
    case 'SET_DEBT_PAYMENTS':
      return { ...state, debtPayments: action.payload, loading: false };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'SET_DEBT_SUMMARY':
      return { ...state, debtSummary: action.payload };
    case 'SET_DEBT_METRICS':
      return { ...state, debtMetrics: action.payload };
    case 'SET_BUDGET_DISTRIBUTION':
      return { ...state, budgetDistribution: action.payload };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'ADD_DEBT':
      return { ...state, debts: [...state.debts, action.payload] };
    case 'ADD_DEBT_PAYMENT':
      return { ...state, debtPayments: [...state.debtPayments, action.payload] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((expense: Expense) =>
          expense.id === action.payload.expenseId
            ? { ...expense, ...action.payload.updates }
            : expense
        )
      };
    case 'UPDATE_DEBT':
      return {
        ...state,
        debts: state.debts.map((debt: Debt) =>
          debt.id === action.payload.debtId
            ? { ...debt, ...action.payload.updates }
            : debt
        )
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((expense: Expense) => expense.id !== action.payload)
      };
    case 'DELETE_DEBT':
      return {
        ...state,
        debts: state.debts.filter((debt: Debt) => debt.id !== action.payload)
      };
    default:
      return state;
  }
};

// Crear contexto
const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Provider del contexto
export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  // Funciones del contexto conectadas a la API
  const fetchProfile = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const profile = await financeService.getProfile();
      dispatch({ type: 'SET_PROFILE', payload: profile });
    } catch (error) {
      console.error('Error cargando perfil financiero:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando perfil financiero' });
    }
  };

  const createProfile = async (income: number, distributionType: 'recommended' | 'custom' | 'debt-aware') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const profile = await financeService.createProfile(income, distributionType);
      dispatch({ type: 'SET_PROFILE', payload: profile });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error creando perfil financiero:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error creando perfil financiero' });
    }
  };

  const updateProfile = async (updates: Partial<FinancialProfile>) => {
    try {
      const updatedProfile = await financeService.updateProfile(updates);
      dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error actualizando perfil' });
    }
  };

  const fetchExpenses = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const expenses = await financeService.getExpenses();
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
    } catch (error) {
      console.error('Error cargando gastos:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando gastos' });
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      const newExpense = await financeService.addExpense(expenseData);
      dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Recalcular resumen después de agregar gasto
      await calculateSummary();
    } catch (error) {
      console.error('Error agregando gasto:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error agregando gasto' });
    }
  };

  const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
    try {
      await financeService.updateExpense(expenseId, updates);
      dispatch({ type: 'UPDATE_EXPENSE', payload: { expenseId, updates } });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Recalcular resumen después de actualizar gasto
      await calculateSummary();
    } catch (error) {
      console.error('Error actualizando gasto:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error actualizando gasto' });
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      await financeService.deleteExpense(expenseId);
      dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Recalcular resumen después de eliminar gasto
      await calculateSummary();
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error eliminando gasto' });
    }
  };

  const calculateSummary = async () => {
    try {
      const summary = await financeService.getSummary();
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      console.error('Error calculando resumen:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error calculando resumen' });
    }
  };

  // Funciones para gestión de deudas
  const fetchDebts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const debts = await debtService.getDebts();
      dispatch({ type: 'SET_DEBTS', payload: debts });
    } catch (error) {
      console.error('Error cargando deudas:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando deudas' });
    }
  };

  const addDebt = async (debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDebt = await debtService.createDebt(debtData);
      dispatch({ type: 'ADD_DEBT', payload: newDebt });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Recalcular métricas de deudas y distribución después de agregar deuda
      await recalculateOnDebtChange();
    } catch (error) {
      console.error('Error agregando deuda:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error agregando deuda' });
    }
  };

  const updateDebt = async (debtId: string, updates: Partial<Debt>) => {
    try {
      await debtService.updateDebt(debtId, updates);
      dispatch({ type: 'UPDATE_DEBT', payload: { debtId, updates } });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Recalcular métricas de deudas y distribución después de actualizar deuda
      await recalculateOnDebtChange();
    } catch (error) {
      console.error('Error actualizando deuda:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error actualizando deuda' });
    }
  };

  const deleteDebt = async (debtId: string) => {
    try {
      await debtService.deleteDebt(debtId);
      dispatch({ type: 'DELETE_DEBT', payload: debtId });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Recalcular métricas de deudas y distribución después de eliminar deuda
      await recalculateOnDebtChange();
    } catch (error) {
      console.error('Error eliminando deuda:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error eliminando deuda' });
    }
  };

  const fetchDebtPayments = async (debtId?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (debtId) {
        const debtPayments = await debtService.getDebtPayments(debtId);
        dispatch({ type: 'SET_DEBT_PAYMENTS', payload: debtPayments });
      } else {
        // Fetch payments for all debts
        const debts = state.debts || [];
        const allPayments: DebtPayment[] = [];
        for (const debt of debts) {
          const payments = await debtService.getDebtPayments(debt.id);
          allPayments.push(...payments);
        }
        dispatch({ type: 'SET_DEBT_PAYMENTS', payload: allPayments });
      }
    } catch (error) {
      console.error('Error cargando pagos de deudas:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando pagos de deudas' });
    }
  };

  const addDebtPayment = async (debtId: string, paymentData: Omit<DebtPayment, 'id' | 'debtId' | 'createdAt'>) => {
    try {
      const result = await debtService.addDebtPayment(debtId, paymentData);
      dispatch({ type: 'ADD_DEBT_PAYMENT', payload: result.payment });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Update debt balance in state
      const updatedDebt = await debtService.getDebt(debtId);
      dispatch({ type: 'UPDATE_DEBT', payload: { debtId, updates: { currentBalance: updatedDebt.currentBalance } } });
      
      // Recalcular resúmenes después de agregar pago
      await calculateDebtSummary();
      await calculateSummary();
    } catch (error) {
      console.error('Error agregando pago de deuda:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error agregando pago de deuda' });
    }
  };

  const calculateDebtSummary = async () => {
    try {
      if (!state.profile) return;
      const debtSummary = await debtService.getDebtSummary(state.profile.monthlyIncome);
      dispatch({ type: 'SET_DEBT_SUMMARY', payload: debtSummary });
    } catch (error) {
      console.error('Error calculando resumen de deudas:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error calculando resumen de deudas' });
    }
  };

  // Nuevas funciones para integración con deudas
  const calculateDebtMetrics = async () => {
    try {
      if (!state.profile || state.debts.length === 0) {
        dispatch({ type: 'SET_DEBT_METRICS', payload: null });
        return;
      }

      const metrics = debtAwareBudgetCalculator.calculateDebtMetrics(
        state.debts,
        state.profile.monthlyIncome
      );
      dispatch({ type: 'SET_DEBT_METRICS', payload: metrics });
    } catch (error) {
      console.error('Error calculando métricas de deudas:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error calculando métricas de deudas' });
    }
  };

  const updateBudgetDistribution = async (distribution: BudgetDistribution) => {
    try {
      if (!state.profile) {
        throw new Error('No hay perfil financiero disponible');
      }

      // Validar la distribución si hay deudas
      if (state.debtMetrics) {
        const validation = debtAwareBudgetCalculator.validateCustomDistribution(
          distribution,
          state.debtMetrics
        );
        
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
        
        // Mostrar advertencias si las hay
        if (validation.warnings && validation.warnings.length > 0) {
          console.warn('Advertencias de distribución:', validation.warnings);
        }
      }

      // Actualizar el perfil con la nueva distribución
      const updatedProfile = {
        ...state.profile,
        distributionType: 'custom' as const,
        categories: state.profile.categories.map((category: any) => ({
          ...category,
          percentage: distribution[category.type as keyof BudgetDistribution] || category.percentage,
          budgetAmount: (state.profile!.monthlyIncome * (distribution[category.type as keyof BudgetDistribution] || category.percentage)) / 100
        }))
      };

      await updateProfile(updatedProfile);
      dispatch({ type: 'SET_BUDGET_DISTRIBUTION', payload: distribution });
    } catch (error) {
      console.error('Error actualizando distribución de presupuesto:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error actualizando distribución de presupuesto' });
    }
  };

  const recalculateOnDebtChange = async () => {
    try {
      if (!state.profile) {
        return;
      }

      // Recalcular métricas de deudas
      await calculateDebtMetrics();

      // Si el perfil está configurado para cálculo automático, actualizar distribución
      if (state.profile.debtSettings?.autoCalculateFromDebts && state.debtMetrics) {
        const recommendedDistribution = debtAwareBudgetCalculator.calculateRecommendedDistribution(
          state.debtMetrics
        );
        
        // Solo actualizar si el perfil está en modo 'debt-aware'
        if (state.profile.distributionType === 'debt-aware') {
          await updateBudgetDistribution(recommendedDistribution);
        }
      }

      // Recalcular resúmenes
      await calculateDebtSummary();
      await calculateSummary();
    } catch (error) {
      console.error('Error en recálculo automático:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error en recálculo automático' });
    }
  };

  const value: FinanceContextType = {
    profile: state.profile,
    expenses: state.expenses,
    debts: state.debts,
    debtPayments: state.debtPayments,
    summary: state.summary,
    debtSummary: state.debtSummary,
    debtMetrics: state.debtMetrics,
    budgetDistribution: state.budgetDistribution,
    loading: state.loading,
    error: state.error,
    createProfile,
    updateProfile,
    addExpense,
    updateExpense,
    deleteExpense,
    addDebt,
    updateDebt,
    deleteDebt,
    addDebtPayment,
    fetchProfile,
    fetchExpenses,
    fetchDebts,
    fetchDebtPayments,
    calculateSummary,
    calculateDebtSummary,
    calculateDebtMetrics,
    updateBudgetDistribution,
    recalculateOnDebtChange,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

// Hook para usar el contexto
export const useFinanceContext = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinanceContext must be used within a FinanceProvider');
  }
  return context;
};