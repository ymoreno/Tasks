import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Task, TaskContextType } from '@/types'
import { taskService } from '@/services/api'

// Estado inicial
const initialState = {
  tasks: {},
  loading: false,
  error: null,
}

// Reducer para manejar el estado
type TaskAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: { [category: string]: { tasks: Task[] } } }
  | { type: 'ADD_TASK'; payload: { category: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { category: string; taskId: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: { category: string; taskId: string } }

const taskReducer = (state: any, action: TaskAction) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false }
    case 'ADD_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.category]: {
            tasks: [...(state.tasks[action.payload.category]?.tasks || []), action.payload.task]
          }
        }
      }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.category]: {
            tasks: state.tasks[action.payload.category]?.tasks.map((task: Task) =>
              task.id === action.payload.taskId
                ? { ...task, ...action.payload.updates }
                : task
            ) || []
          }
        }
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.category]: {
            tasks: state.tasks[action.payload.category]?.tasks.filter((task: Task) =>
              task.id !== action.payload.taskId
            ) || []
          }
        }
      }
    default:
      return state
  }
}

// Crear contexto
const TaskContext = createContext<TaskContextType | undefined>(undefined)

// Provider del contexto
export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState)

  // Obtener todas las tareas
  const fetchTasks = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    
    try {
      const tasks = await taskService.getAllTasks()
      dispatch({ type: 'SET_TASKS', payload: tasks })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando tareas' })
    }
  }

  // Crear nueva tarea
  const createTask = async (category: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'SET_ERROR', payload: null })
    
    try {
      const newTask = await taskService.createTask(category, taskData)
      dispatch({ type: 'ADD_TASK', payload: { category, task: newTask } })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error creando tarea' })
    }
  }

  // Actualizar tarea
  const updateTask = async (category: string, taskId: string, updates: Partial<Task>) => {
    dispatch({ type: 'SET_ERROR', payload: null })
    
    try {
      await taskService.updateTask(taskId, updates)
      dispatch({ type: 'UPDATE_TASK', payload: { category, taskId, updates } })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error actualizando tarea' })
    }
  }

  // Eliminar tarea
  const deleteTask = async (category: string, taskId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null })
    
    try {
      await taskService.deleteTask(taskId)
      dispatch({ type: 'DELETE_TASK', payload: { category, taskId } })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error eliminando tarea' })
    }
  }

  const value: TaskContextType = {
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

// Hook para usar el contexto
export const useTaskContext = () => {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider')
  }
  return context
}