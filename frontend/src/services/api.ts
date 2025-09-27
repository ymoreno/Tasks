import axios from 'axios';
import { ApiResponse, Task, WeeklyTask, DayState, Payment, TimeStats } from '@/types';
import { offlineCache } from './offlineCache';
import { networkStatus } from './networkStatus';

// Configuración base de axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores con soporte offline
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // El servidor respondió con un código de error
      throw new Error(error.response.data.error || 'Error del servidor');
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta - posible modo offline
      console.log('📴 Sin respuesta del servidor - verificando modo offline');
      throw new Error('Sin conexión al servidor');
    } else {
      // Error en la configuración de la petición
      throw new Error('Error en la petición');
    }
  }
);

// Función helper para manejar requests con cache offline
const handleOfflineRequest = async <T>(
  requestFn: () => Promise<T>,
  cacheKey: string,
  fallbackData?: T
): Promise<T> => {
  try {
    const result = await requestFn();
    // Guardar en cache si la request fue exitosa
    offlineCache.set(cacheKey, result);
    return result;
  } catch (error) {
    // Si no hay conexión, intentar usar cache
    if (!networkStatus.getStatus()) {
      const cachedData = offlineCache.get(cacheKey);
      if (cachedData) {
        console.log(`📱 Usando datos en cache para: ${cacheKey}`);
        return cachedData;
      }
      if (fallbackData) {
        console.log(`📱 Usando datos por defecto para: ${cacheKey}`);
        return fallbackData;
      }
    }
    throw error;
  }
};

// Función helper para manejar acciones offline
const handleOfflineAction = async (
  actionFn: () => Promise<void>,
  offlineAction: {
    action: 'create' | 'update' | 'delete';
    endpoint: string;
    data?: any;
  }
): Promise<void> => {
  try {
    await actionFn();
  } catch (error) {
    if (!networkStatus.getStatus()) {
      console.log(`📝 Guardando acción offline: ${offlineAction.action} ${offlineAction.endpoint}`);
      offlineCache.addPendingAction(offlineAction);
      return; // No lanzar error en modo offline
    }
    throw error;
  }
};

// Exportar para uso futuro
export { handleOfflineAction };

// Servicios para Tareas Generales
export const taskService = {
  // Obtener todas las tareas con soporte offline
  async getAllTasks(): Promise<{ [category: string]: { tasks: Task[] } }> {
    return handleOfflineRequest(
      async () => {
        const response = await api.get<ApiResponse<{ [category: string]: { tasks: Task[] } }>>('/tasks');
        return response.data.data || {};
      },
      'tasks_all',
      {} // Fallback vacío
    );
  },

  // Obtener tarea por ID
  async getTaskById(taskId: string): Promise<Task> {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${taskId}`);
    if (!response.data.data) {
      throw new Error('Tarea no encontrada');
    }
    return response.data.data;
  },

  // Crear nueva tarea
  async createTask(category: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>('/tasks', {
      ...taskData,
      category,
    });
    if (!response.data.data) {
      throw new Error('Error creando tarea');
    }
    return response.data.data;
  },

  // Actualizar tarea con soporte offline
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const endpoint = `/tasks/${taskId}`;
    
    // Si estamos offline, actualizar cache local y guardar acción
    if (!networkStatus.getStatus()) {
      const cachedTasks = offlineCache.get('tasks_all') || {};
      
      // Buscar y actualizar la tarea en el cache
      for (const category of Object.values(cachedTasks)) {
        const taskIndex = (category as any).tasks.findIndex((t: Task) => t.id === taskId);
        if (taskIndex !== -1) {
          (category as any).tasks[taskIndex] = { ...(category as any).tasks[taskIndex], ...updates };
          offlineCache.set('tasks_all', cachedTasks);
          break;
        }
      }
      
      offlineCache.addPendingAction({
        action: 'update',
        endpoint,
        data: updates
      });
      
      // Retornar tarea actualizada del cache
      for (const category of Object.values(cachedTasks)) {
        const task = (category as any).tasks.find((t: Task) => t.id === taskId);
        if (task) return task;
      }
      
      throw new Error('Tarea no encontrada en cache');
    }
    
    // Online: hacer request normal
    const response = await api.put<ApiResponse<Task>>(endpoint, updates);
    if (!response.data.data) {
      throw new Error('Error actualizando tarea');
    }
    return response.data.data;
  },

  // Eliminar tarea
  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  },

  // Generar puntuaciones aleatorias
  async generateRandomScores(): Promise<{ [category: string]: { tasks: Task[] } }> {
    const response = await api.post<ApiResponse<{ [category: string]: { tasks: Task[] } }>>('/tasks/random-score');
    return response.data.data || {};
  },

  // Obtener tareas por categoría
  async getTasksByCategory(category: string): Promise<{ tasks: Task[] }> {
    const response = await api.get<ApiResponse<{ tasks: Task[] }>>(`/tasks/category/${category}`);
    return response.data.data || { tasks: [] };
  },
};

// Servicios para Tareas Semanales
export const weeklyService = {
  // Obtener todas las tareas semanales
  async getWeeklyTasks(): Promise<WeeklyTask[]> {
    const response = await api.get<ApiResponse<WeeklyTask[]>>('/weekly/tasks');
    return response.data.data || [];
  },

  // Obtener estado del día actual
  async getCurrentDay(): Promise<{
    dayState: DayState;
    currentTask: WeeklyTask;
    totalTasks: number;
  }> {
    const response = await api.get<ApiResponse<{
      dayState: DayState;
      currentTask: WeeklyTask;
      totalTasks: number;
    }>>('/weekly/current-day');
    if (!response.data.data) {
      throw new Error('Error obteniendo estado del día');
    }
    return response.data.data;
  },

  // Empezar tarea actual
  async startTask(): Promise<{
    startedTask: WeeklyTask;
    dayState: DayState;
  }> {
    const response = await api.post<ApiResponse<{
      startedTask: WeeklyTask;
      dayState: DayState;
    }>>('/weekly/start-task');
    if (!response.data.data) {
      throw new Error('Error empezando tarea');
    }
    return response.data.data;
  },

  // Completar tarea actual
  async completeTask(): Promise<{
    completedTask: WeeklyTask;
    nextTask: WeeklyTask;
    dayState: DayState;
    selectedTask?: Task;
  }> {
    const response = await api.post<ApiResponse<{
      completedTask: WeeklyTask;
      nextTask: WeeklyTask;
      dayState: DayState;
      selectedTask?: Task;
    }>>('/weekly/complete-task');
    if (!response.data.data) {
      throw new Error('Error completando tarea');
    }
    return response.data.data;
  },

  // Completar subtarea actual
  async completeSubtask(): Promise<{
    currentTask: WeeklyTask;
    dayState: DayState;
  }> {
    const response = await api.post<ApiResponse<{
      currentTask: WeeklyTask;
      dayState: DayState;
    }>>('/weekly/complete-subtask');
    if (!response.data.data) {
      throw new Error('Error completando subtarea');
    }
    return response.data.data;
  },

  // Actualizar el título de una subtarea (libros, juegos, etc.)
  async updateSubtaskTitle(subtaskId: string, newTitle: string): Promise<void> {
    await api.post('/weekly/update-subtask-title', { subtaskId, newTitle });
  },

  // Finalizar y rotar la subtarea de un juego
  async finishGameTask(subtaskId: string, newTitle: string): Promise<void> {
    await api.post('/weekly/finish-game-task', { subtaskId, newTitle });
  },

  // Agregar un nuevo curso a una subtarea
  async addCourseToSubtask(parentSubtaskId: string, courseName: string): Promise<void> {
    await api.post('/weekly/add-course', { parentSubtaskId, courseName });
  },

  async completeCourse(parentSubtaskId: string, courseSubtaskId: string): Promise<void> {
    await api.post('/weekly/complete-course', { parentSubtaskId, courseSubtaskId });
  },

  // Actualizar el estado del timer de la tarea Mac
  async updateTimerState(elapsedSeconds: number, state: 'running' | 'paused' | 'stopped'): Promise<DayState> {
    const response = await api.post<ApiResponse<{ dayState: DayState }>>('/weekly/timer', {
      elapsedSeconds,
      state,
    });
    if (!response.data.data) {
      throw new Error('Error updating timer state');
    }
    return response.data.data.dayState;
  },

  // Obtener progreso semanal
  async getProgress(): Promise<{
    totalTasks: number;
    completedToday: number;
    currentTaskIndex: number;
    dayCompleted: boolean;
    date: string;
    progressPercentage: number;
  }> {
    const response = await api.get<ApiResponse<{
      totalTasks: number;
      completedToday: number;
      currentTaskIndex: number;
      dayCompleted: boolean;
      date: string;
      progressPercentage: number;
    }>>('/weekly/progress');
    return response.data.data || {
      totalTasks: 0,
      completedToday: 0,
      currentTaskIndex: 0,
      dayCompleted: false,
      date: new Date().toISOString().split('T')[0],
      progressPercentage: 0,
    };
  },

  async getUnfinishedCourses(): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>('/weekly/unfinished-courses');
    return response.data.data || [];
  },
};

// Servicios para Pagos y Compras
export const paymentService = {
  // Obtener todos los pagos
  async getAllPayments(): Promise<Payment[]> {
    const response = await api.get<ApiResponse<Payment[]>>('/payments');
    return response.data.data || [];
  },

  // Obtener pago por ID
  async getPaymentById(paymentId: string): Promise<Payment> {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${paymentId}`);
    if (!response.data.data) {
      throw new Error('Pago no encontrado');
    }
    return response.data.data;
  },

  // Crear nuevo pago
  async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const response = await api.post<ApiResponse<Payment>>('/payments', paymentData);
    if (!response.data.data) {
      throw new Error('Error creando pago');
    }
    return response.data.data;
  },

  // Actualizar pago
  async updatePayment(paymentId: string, updates: Partial<Payment>): Promise<Payment> {
    const response = await api.put<ApiResponse<Payment>>(`/payments/${paymentId}`, updates);
    if (!response.data.data) {
      throw new Error('Error actualizando pago');
    }
    return response.data.data;
  },

  // Eliminar pago
  async deletePayment(paymentId: string): Promise<void> {
    await api.delete(`/payments/${paymentId}`);
  },

  // Buscar pagos
  async searchPayments(query: string): Promise<Payment[]> {
    const response = await api.get<ApiResponse<Payment[]>>(`/payments/search/${encodeURIComponent(query)}`);
    return response.data.data || [];
  },

  // Obtener pagos por categoría
  async getPaymentsByCategory(category: string): Promise<Payment[]> {
    const response = await api.get<ApiResponse<Payment[]>>(`/payments/category/${encodeURIComponent(category)}`);
    return response.data.data || [];
  },
};

// Servicios para Seguimiento de Tiempo
export const timeService = {
  // Iniciar seguimiento
  async startTracking(taskId: string, isSubtask = false, subtaskId?: string): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(`/time/start/${taskId}`, {
      isSubtask,
      subtaskId,
    });
    if (!response.data.data) {
      throw new Error('Error iniciando seguimiento');
    }
    return response.data.data;
  },

  // Detener seguimiento
  async stopTracking(taskId: string): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(`/time/stop/${taskId}`);
    if (!response.data.data) {
      throw new Error('Error deteniendo seguimiento');
    }
    return response.data.data;
  },

  // Pausar seguimiento
  async pauseTracking(taskId: string): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(`/time/pause/${taskId}`);
    if (!response.data.data) {
      throw new Error('Error pausando seguimiento');
    }
    return response.data.data;
  },

  // Reanudar seguimiento
  async resumeTracking(taskId: string): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(`/time/resume/${taskId}`);
    if (!response.data.data) {
      throw new Error('Error reanudando seguimiento');
    }
    return response.data.data;
  },

  // Obtener estadísticas de una tarea
  async getTaskStats(taskId: string): Promise<TimeStats> {
    const response = await api.get<ApiResponse<TimeStats>>(`/time/stats/${taskId}`);
    if (!response.data.data) {
      throw new Error('Error obteniendo estadísticas');
    }
    return response.data.data;
  },

  // Obtener resumen de estadísticas
  async getStatsSummary(): Promise<TimeStats[]> {
    const response = await api.get<ApiResponse<TimeStats[]>>('/time/stats/summary');
    return response.data.data || [];
  },
};

// Servicios para Archivos
export const fileService = {
  // Importar CSV
  async importCSV(file: File): Promise<{ importedCount: number; tasks: Task[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{ importedCount: number; tasks: Task[] }>>(
      '/files/import/csv',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.data) {
      throw new Error('Error importando CSV');
    }
    return response.data.data;
  },

  // Importar Excel
  async importExcel(file: File): Promise<{ importedCount: number; tasks: Task[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{ importedCount: number; tasks: Task[] }>>(
      '/files/import/excel',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.data) {
      throw new Error('Error importando Excel');
    }
    return response.data.data;
  },

  // Exportar CSV
  async exportCSV(): Promise<Blob> {
    const response = await api.get('/files/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Exportar Excel
  async exportExcel(): Promise<Blob> {
    const response = await api.get('/files/export/excel', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;