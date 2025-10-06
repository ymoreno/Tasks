import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Payment, PaymentContextType } from '@/types'
import { paymentService } from '@/services/api'

// Estado inicial
const initialState = {
  payments: [],
  loading: false,
  error: null,
}

// Reducer para manejar el estado
type PaymentAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAYMENTS'; payload: Payment[] }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: { paymentId: string; updates: Partial<Payment> } }
  | { type: 'DELETE_PAYMENT'; payload: string }
  | { type: 'EXECUTE_PAYMENT'; payload: { paymentId: string, updatedPayment?: Payment } }

const paymentReducer = (state: any, action: PaymentAction) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload, loading: false }
    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] }
    case 'UPDATE_PAYMENT':
      return {
        ...state,
        payments: state.payments.map((payment: Payment) =>
          payment.id === action.payload.paymentId
            ? { ...payment, ...action.payload.updates }
            : payment
        )
      }
    case 'DELETE_PAYMENT':
      return {
        ...state,
        payments: state.payments.filter((payment: Payment) => payment.id !== action.payload)
      }
    case 'EXECUTE_PAYMENT':
      const { paymentId, updatedPayment } = action.payload;
      const payment = state.payments.find((p: Payment) => p.id === paymentId);
      if (payment && !payment.isRecurring) {
        return {
          ...state,
          payments: state.payments.filter((p: Payment) => p.id !== paymentId),
        };
      } else if (updatedPayment) {
        return {
          ...state,
          payments: state.payments.map((p: Payment) =>
            p.id === paymentId ? updatedPayment : p
          ),
        };
      }
      return state;
    default:
      return state
  }
}

// Crear contexto
const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

// Provider del contexto
export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(paymentReducer, initialState)

  // Funciones del contexto conectadas a la API
  const fetchPayments = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const payments = await paymentService.getAllPayments()
      dispatch({ type: 'SET_PAYMENTS', payload: Array.isArray(payments) ? payments : [] })
    } catch (error) {
      console.error('Error cargando pagos:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando pagos' })
    }
  }

  const createPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    try {
      const newPayment = await paymentService.createPayment(paymentData)
      dispatch({ type: 'ADD_PAYMENT', payload: newPayment })
    } catch (error) {
      console.error('Error creando pago:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error creando pago' })
    }
  }

  const updatePayment = async (paymentId: string, updates: Partial<Payment>) => {
    try {
      const updatedPayment = await paymentService.updatePayment(paymentId, updates)
      if (updatedPayment) {
        dispatch({ type: 'UPDATE_PAYMENT', payload: { paymentId, updates } })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error actualizando pago' })
    }
  }

  const deletePayment = async (paymentId: string) => {
    try {
      await paymentService.deletePayment(paymentId)
      dispatch({ type: 'DELETE_PAYMENT', payload: paymentId })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error eliminando pago' })
    }
  }

  const executePayment = async (paymentId: string) => {
    try {
      const result = await paymentService.executePayment(paymentId);
      if (result.moved) {
        // Si se movió al histórico, eliminarlo de la lista
        dispatch({ type: 'DELETE_PAYMENT', payload: paymentId });
      } else if (result.newPayment) {
        // Si se renovó, actualizar con el nuevo pago
        dispatch({ type: 'UPDATE_PAYMENT', payload: { paymentId, updates: result.newPayment } });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error ejecutando pago' });
      throw error;
    }
  };

  const decreasePriorities = async () => {
    try {
      const result = await paymentService.decreasePriorities();
      // Recargar pagos para reflejar los cambios
      await fetchPayments();
      return result.updatedCount;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error disminuyendo prioridades' });
      throw error;
    }
  };

  const getPaymentHistory = async () => {
    try {
      return await paymentService.getPaymentHistory();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error obteniendo histórico' });
      throw error;
    }
  };

  const value: PaymentContextType = {
    payments: state.payments,
    loading: state.loading,
    error: state.error,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
    executePayment,
    decreasePriorities,
    getPaymentHistory,
  }

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
}

// Hook para usar el contexto
export const usePaymentContext = () => {
  const context = useContext(PaymentContext)
  if (context === undefined) {
    throw new Error('usePaymentContext must be used within a PaymentProvider')
  }
  return context
}