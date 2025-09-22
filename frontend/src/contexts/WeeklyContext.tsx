import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { WeeklyTask, DayState, WeeklyContextType } from '@/types'
import { weeklyService } from '@/services/api'

// Estado inicial
const initialState = {
  weeklyTasks: [],
  dayState: null,
  currentTask: null,
  loading: false,
  error: null,
}

// Reducer para manejar el estado
type WeeklyAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WEEKLY_TASKS'; payload: WeeklyTask[] }
  | { type: 'SET_DAY_STATE'; payload: DayState }
  | { type: 'SET_CURRENT_TASK'; payload: WeeklyTask | null }

const weeklyReducer = (state: any, action: WeeklyAction) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_WEEKLY_TASKS':
      return { ...state, weeklyTasks: action.payload, loading: false }
    case 'SET_DAY_STATE':
      return { ...state, dayState: action.payload }
    case 'SET_CURRENT_TASK':
      return { ...state, currentTask: action.payload }
    default:
      return state
  }
}

// Crear contexto
const WeeklyContext = createContext<WeeklyContextType | undefined>(undefined)

// Provider del contexto
export const WeeklyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(weeklyReducer, initialState)

  // Funciones del contexto conectadas a la API
  const fetchWeeklyTasks = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const weeklyTasks = await weeklyService.getWeeklyTasks()
      dispatch({ type: 'SET_WEEKLY_TASKS', payload: weeklyTasks })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando tareas semanales' })
    }
  }

  const fetchCurrentDay = async () => {
    try {
      const currentDayData = await weeklyService.getCurrentDay()
      dispatch({ type: 'SET_DAY_STATE', payload: currentDayData.dayState })
      dispatch({ type: 'SET_CURRENT_TASK', payload: currentDayData.currentTask })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando estado del día' })
    }
  }

  const startTask = async () => {
    try {
      const result = await weeklyService.startTask()
      dispatch({ type: 'SET_DAY_STATE', payload: result.dayState })
      dispatch({ type: 'SET_CURRENT_TASK', payload: result.startedTask })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error empezando tarea' })
    }
  }

  const completeTask = async () => {
    try {
      const result = await weeklyService.completeTask()
      dispatch({ type: 'SET_DAY_STATE', payload: result.dayState })
      dispatch({ type: 'SET_CURRENT_TASK', payload: result.nextTask })
      
      // Si hay una tarea seleccionada aleatoriamente, mostrarla
      if (result.selectedTask) {
        // TODO: Mostrar modal o notificación con la tarea seleccionada
        console.log('Tarea aleatoria seleccionada:', result.selectedTask.name)
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error completando tarea' })
    }
  }

  const completeSubtask = async () => {
    try {
      const result = await weeklyService.completeSubtask();
      dispatch({ type: 'SET_DAY_STATE', payload: result.dayState });
      dispatch({ type: 'SET_CURRENT_TASK', payload: result.currentTask });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error completando subtarea' });
    }
  };

  const updateSubtaskTitle = async (subtaskId: string, newTitle: string) => {
    try {
      await weeklyService.updateSubtaskTitle(subtaskId, newTitle);
      // Recargar los datos para reflejar el cambio de título y el historial
      await fetchWeeklyTasks();
      await fetchCurrentDay();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error actualizando el título de la subtarea' });
    }
  };

  const value: WeeklyContextType = {
    weeklyTasks: state.weeklyTasks,
    dayState: state.dayState,
    currentTask: state.currentTask,
    loading: state.loading,
    error: state.error,
    fetchWeeklyTasks,
    fetchCurrentDay,
    startTask,
    completeTask,
    completeSubtask,
    updateSubtaskTitle,
  }

  return <WeeklyContext.Provider value={value}>{children}</WeeklyContext.Provider>
}

// Hook para usar el contexto
export const useWeeklyContext = () => {
  const context = useContext(WeeklyContext)
  if (context === undefined) {
    throw new Error('useWeeklyContext must be used within a WeeklyProvider')
  }
  return context
}