import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { FinancialProfile, Expense, FinancialSummary, FinanceContextType } from '@/types';
import { financeService } from '@/services/api';

// Estado inicial
const initialState = {
  profile: null,
  expenses: [],
  summary: null,
  loading: false,
  error: null,
};

// Reducer para manejar el estado
type FinanceAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROFILE'; payload: FinancialProfile | null }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_SUMMARY'; payload: FinancialSummary | null }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: { expenseId: string; updates: Partial<Expense> } }
  | { type: 'DELETE_EXPENSE'; payload: string };

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
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((expense: Expense) =>
          expense.id === action.payload.expenseId
            ? { ...expense, ...action.payload.updates }
            : expense
        )
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((expense: Expense) => expense.id !== action.payload)
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

  const createProfile = async (income: number, distributionType: 'recommended' | 'custom') => {
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

  // Funciones stub para deudas (implementar después)
  const addDebt = async (debt: any) => {
    console.log('addDebt not implemented yet', debt);
  };

  const updateDebt = async (debtId: string, updates: any) => {
    console.log('updateDebt not implemented yet', debtId, updates);
  };

  const deleteDebt = async (debtId: string) => {
    console.log('deleteDebt not implemented yet', debtId);
  };

  const addDebtPayment = async (payment: any) => {
    console.log('addDebtPayment not implemented yet', payment);
  };

  const fetchDebts = async () => {
    console.log('fetchDebts not implemented yet');
  };

  const fetchDebtPayments = async () => {
    console.log('fetchDebtPayments not implemented yet');
  };

  const calculateDebtSummary = async () => {
    console.log('calculateDebtSummary not implemented yet');
  };

  const value: FinanceContextType = {
    profile: state.profile,
    expenses: state.expenses,
    debts: [], // Stub
    debtPayments: [], // Stub
    summary: state.summary,
    debtSummary: null, // Stub
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