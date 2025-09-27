import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TaskService, WeeklyTaskService } from '../services/dataService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse, TimeSession, TimeStats } from '../types';

const router = express.Router();

// POST /api/time/start/:taskId - Iniciar seguimiento de tiempo
router.post('/start/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { isSubtask = false, subtaskId } = req.body;
    
    let task;
    
    if (isSubtask && subtaskId) {
      // Manejar subtarea (implementar lógica específica)
      throw createError('Seguimiento de subtareas no implementado aún', 501);
    } else {
      // Manejar tarea regular
      task = await TaskService.getTaskById(taskId);
    }
    
    if (!task) {
      throw createError('Tarea no encontrada', 404);
    }
    
    // Verificar si ya hay una sesión activa
    if (task.timeTracking.isActive) {
      throw createError('Ya hay una sesión de tiempo activa para esta tarea', 400);
    }
    
    // Iniciar nueva sesión
    const startTime = new Date();
    const newSession: TimeSession = {
      id: uuidv4(),
      startTime,
      duration: 0
    };
    
    task.timeTracking.isActive = true;
    task.timeTracking.startTime = startTime;
    task.timeTracking.sessions.push(newSession);
    
    const updatedTask = await TaskService.updateTask(taskId, task);
    
    const response: ApiResponse<typeof updatedTask> = {
      success: true,
      data: updatedTask,
      message: 'Seguimiento de tiempo iniciado'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/time/stop/:taskId - Detener seguimiento de tiempo
router.post('/stop/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await TaskService.getTaskById(taskId);
    
    if (!task) {
      throw createError('Tarea no encontrada', 404);
    }
    
    if (!task.timeTracking.isActive) {
      throw createError('No hay una sesión de tiempo activa para esta tarea', 400);
    }
    
    const endTime = new Date();
    const startTime = task.timeTracking.startTime!;
    const sessionDuration = endTime.getTime() - startTime.getTime();
    
    // Actualizar la sesión actual
    const currentSession = task.timeTracking.sessions[task.timeTracking.sessions.length - 1];
    currentSession.endTime = endTime;
    currentSession.duration = sessionDuration;
    
    // Actualizar el tiempo total y estado
    task.timeTracking.isActive = false;
    task.timeTracking.endTime = endTime;
    task.timeTracking.totalTime += sessionDuration;
    delete task.timeTracking.startTime;
    
    const updatedTask = await TaskService.updateTask(taskId, task);
    
    const response: ApiResponse<typeof updatedTask> = {
      success: true,
      data: updatedTask,
      message: `Seguimiento detenido. Tiempo de sesión: ${Math.round(sessionDuration / 1000)} segundos`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/time/pause/:taskId - Pausar seguimiento de tiempo
router.post('/pause/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await TaskService.getTaskById(taskId);
    
    if (!task) {
      throw createError('Tarea no encontrada', 404);
    }
    
    if (!task.timeTracking.isActive) {
      throw createError('No hay una sesión de tiempo activa para esta tarea', 400);
    }
    
    const pauseTime = new Date();
    const startTime = task.timeTracking.startTime!;
    const sessionDuration = pauseTime.getTime() - startTime.getTime();
    
    // Finalizar la sesión actual
    const currentSession = task.timeTracking.sessions[task.timeTracking.sessions.length - 1];
    currentSession.endTime = pauseTime;
    currentSession.duration = sessionDuration;
    
    // Actualizar tiempo total pero mantener como activa (pausada)
    task.timeTracking.totalTime += sessionDuration;
    delete task.timeTracking.startTime;
    
    const updatedTask = await TaskService.updateTask(taskId, task);
    
    const response: ApiResponse<typeof updatedTask> = {
      success: true,
      data: updatedTask,
      message: 'Seguimiento pausado'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/time/resume/:taskId - Reanudar seguimiento de tiempo
router.post('/resume/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await TaskService.getTaskById(taskId);
    
    if (!task) {
      throw createError('Tarea no encontrada', 404);
    }
    
    if (!task.timeTracking.isActive) {
      throw createError('Esta tarea no está en estado pausado', 400);
    }
    
    if (task.timeTracking.startTime) {
      throw createError('La tarea ya está en ejecución', 400);
    }
    
    // Crear nueva sesión
    const resumeTime = new Date();
    const newSession: TimeSession = {
      id: uuidv4(),
      startTime: resumeTime,
      duration: 0
    };
    
    task.timeTracking.startTime = resumeTime;
    task.timeTracking.sessions.push(newSession);
    
    const updatedTask = await TaskService.updateTask(taskId, task);
    
    const response: ApiResponse<typeof updatedTask> = {
      success: true,
      data: updatedTask,
      message: 'Seguimiento reanudado'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/time/stats/:taskId - Obtener estadísticas de tiempo de una tarea
router.get('/stats/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await TaskService.getTaskById(taskId);
    
    if (!task) {
      throw createError('Tarea no encontrada', 404);
    }
    
    const sessions = task.timeTracking.sessions.filter(s => s.endTime);
    const sessionTimes = sessions.map(s => s.duration);
    
    const stats: TimeStats = {
      taskId: task.id,
      taskName: task.name,
      totalTime: task.timeTracking.totalTime,
      sessionCount: sessions.length,
      averageSessionTime: sessionTimes.length > 0 
        ? sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length 
        : 0,
      minTime: sessionTimes.length > 0 ? Math.min(...sessionTimes) : 0,
      maxTime: sessionTimes.length > 0 ? Math.max(...sessionTimes) : 0
    };
    
    const response: ApiResponse<TimeStats> = {
      success: true,
      data: stats,
      message: 'Estadísticas de tiempo obtenidas'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/time/stats/summary - Obtener resumen de estadísticas de todas las tareas
router.get('/stats/summary', async (req, res, next) => {
  try {
    const categories = await TaskService.getAllTasks();
    const allStats: TimeStats[] = [];
    
    for (const category of Object.values(categories)) {
      for (const task of category.tasks) {
        const sessions = task.timeTracking.sessions.filter(s => s.endTime);
        const sessionTimes = sessions.map(s => s.duration);
        
        const stats: TimeStats = {
          taskId: task.id,
          taskName: task.name,
          totalTime: task.timeTracking.totalTime,
          sessionCount: sessions.length,
          averageSessionTime: sessionTimes.length > 0 
            ? sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length 
            : 0,
          minTime: sessionTimes.length > 0 ? Math.min(...sessionTimes) : 0,
          maxTime: sessionTimes.length > 0 ? Math.max(...sessionTimes) : 0
        };
        
        allStats.push(stats);
      }
    }
    
    const response: ApiResponse<TimeStats[]> = {
      success: true,
      data: allStats,
      message: 'Resumen de estadísticas obtenido'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Función helper para formatear tiempo
const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export { router as timeRoutes };