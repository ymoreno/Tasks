import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
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
  | { type: 'UPDATE_TIMER_STATE'; payload: { elapsedSeconds: number; state: 'running' | 'paused' | 'stopped' } }
  | { type: 'SET_TIMER_LOCALLY'; payload: { elapsedSeconds: number } }
  | { type: 'SET_CURRENT_TASK'; payload: WeeklyTask | null }
  | { type: 'UPDATE_TASK_NOTES'; payload: { taskId: string; notes: string } }

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
    case 'UPDATE_TIMER_STATE':
      if (!state.dayState) return state;
      return {
        ...state,
        dayState: {
          ...state.dayState,
          timerElapsedSeconds: action.payload.elapsedSeconds,
          timerState: action.payload.state,
        },
      };
    case 'SET_TIMER_LOCALLY':
      if (!state.dayState) return state;
      return {
        ...state,
        dayState: {
          ...state.dayState,
          timerElapsedSeconds: action.payload.elapsedSeconds,
        },
      };
    case 'SET_CURRENT_TASK':
      return { ...state, currentTask: action.payload }
    case 'UPDATE_TASK_NOTES':
      return {
        ...state,
        weeklyTasks: state.weeklyTasks.map((task: WeeklyTask) =>
          task.id === action.payload.taskId
            ? { ...task, notes: action.payload.notes }
            : task
        ),
        currentTask: state.currentTask?.id === action.payload.taskId
          ? { ...state.currentTask, notes: action.payload.notes }
          : state.currentTask
      }
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

  // Funciones del timer (deben ir antes de las que las usan)
  const updateTimer = async (elapsedSeconds: number, timerState: 'running' | 'paused' | 'stopped') => {
    try {
      const updatedDayState = await weeklyService.updateTimer(elapsedSeconds, timerState);
      dispatch({ type: 'SET_DAY_STATE', payload: updatedDayState });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error updating timer' });
    }
  };

  const pauseTimer = async () => {
    if (state.dayState?.timerElapsedSeconds !== undefined) {
      await updateTimer(state.dayState.timerElapsedSeconds, 'paused');
    }
  };

  const resumeTimer = async () => {
    if (state.dayState?.timerElapsedSeconds !== undefined) {
      await updateTimer(state.dayState.timerElapsedSeconds, 'running');
    }
  };

  const tickTimer = useCallback((newSeconds: number) => {
    dispatch({ type: 'SET_TIMER_LOCALLY', payload: { elapsedSeconds: newSeconds } });
    
    // Persistir cada 10 segundos para no sobrecargar el servidor
    if (newSeconds % 10 === 0) {
      updateTimer(newSeconds, 'running').catch(error => {
        console.warn('Error persistiendo timer:', error);
      });
    }
  }, [updateTimer]);

  const startTask = async () => {
    try {
      const result = await weeklyService.startTask()
      dispatch({ type: 'SET_DAY_STATE', payload: result.dayState })
      dispatch({ type: 'SET_CURRENT_TASK', payload: result.startedTask })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error empezando tarea' })
    }
  }

  const completeTask = useCallback(async () => {
    try {
      // Pausar el timer automáticamente al completar tarea
      if (state.dayState?.timerState === 'running') {
        await pauseTimer();
      }
      
      const result = await weeklyService.completeTask()
      
      // Tarea aleatoria seleccionada (sin popup molesto)
      if (result.selectedTask) {
        console.log(`Tarea aleatoria seleccionada: ${result.selectedTask.name}`);
      }

      dispatch({ type: 'SET_DAY_STATE', payload: result.dayState })
      dispatch({ type: 'SET_CURRENT_TASK', payload: result.nextTask })
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error completando tarea' })
    }
  }, [state.dayState?.timerState, pauseTimer])

  const completeSubtask = async () => {
    try {
      // Pausar el timer automáticamente al completar subtarea
      if (state.dayState?.timerState === 'running') {
        await pauseTimer();
      }
      
      const result = await weeklyService.completeSubtask();
      dispatch({ type: 'SET_DAY_STATE', payload: result.dayState });
      dispatch({ type: 'SET_CURRENT_TASK', payload: result.currentTask });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error completando subtarea' });
    }
  };

  const updateSubtaskTitle = async (subtaskId: string, newTitle: string) => {
    try {
      // Pausar el timer automáticamente al actualizar título (indica finalización)
      if (state.dayState?.timerState === 'running') {
        await pauseTimer();
      }
      
      await weeklyService.updateSubtaskTitle(subtaskId, newTitle);
      // Recargar los datos para reflejar el cambio de título y el historial
      await fetchWeeklyTasks();
      await fetchCurrentDay();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error actualizando el título de la subtarea' });
    }
  };

  const finishGameTask = async (subtaskId: string, newTitle: string) => {
    try {
      // Pausar el timer automáticamente al finalizar juego
      if (state.dayState?.timerState === 'running') {
        await pauseTimer();
      }
      
      await weeklyService.finishGameTask(subtaskId, newTitle);
      // Recargar los datos para reflejar el cambio de título y la rotación
      await fetchWeeklyTasks();
      await fetchCurrentDay();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error finalizando la tarea de juego' });
    }
  };

  const addCourse = async (parentSubtaskId: string, courseName: string) => {
    try {
      const result = await weeklyService.addCourseToSubtask(parentSubtaskId, courseName);
      await fetchWeeklyTasks();
      
      // Mostrar notificación de éxito en consola
      console.log(`✅ ${result.message}: "${result.courseName}"`);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error agregando curso' });
      console.error('❌ Error agregando curso. Inténtalo de nuevo.');
    }
  };

  const completeCourse = async (parentSubtaskId: string, courseSubtaskId: string) => {
    try {
      // Pausar el timer automáticamente al completar curso
      if (state.dayState?.timerState === 'running') {
        await pauseTimer();
      }
      
      await weeklyService.completeCourse(parentSubtaskId, courseSubtaskId);
      await fetchWeeklyTasks();
      await fetchCurrentDay();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error completando curso' });
    }
  };

  const updateTaskNotes = async (taskId: string, notes: string) => {
    try {
      const updatedTask = await weeklyService.updateTaskNotes(taskId, notes);
      
      // Actualizar la tarea en el estado local
      dispatch({ 
        type: 'UPDATE_TASK_NOTES', 
        payload: { taskId, notes } 
      });
      
      return updatedTask;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error actualizando notas de la tarea' });
      throw error;
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
    finishGameTask,
    updateTimer,
    pauseTimer,
    resumeTimer,
    tickTimer,
    addCourse,
    completeCourse,
    updateTaskNotes,
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