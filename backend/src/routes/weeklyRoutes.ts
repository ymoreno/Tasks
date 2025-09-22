import express from 'express';
import { WeeklyTaskService, TaskService } from '../services/dataService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = express.Router();

// GET /api/weekly/tasks - Obtener todas las tareas semanales
router.get('/tasks', async (req, res, next) => {
  try {
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    
    const response: ApiResponse<typeof weeklyData.sequence> = {
      success: true,
      data: weeklyData.sequence,
      message: 'Tareas semanales obtenidas exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/weekly/current-day - Obtener estado del día actual
router.get('/current-day', async (req, res, next) => {
  try {
    const dayState = await WeeklyTaskService.getCurrentDayState();
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    
    // Verificar si es un nuevo día
    const today = new Date().toISOString().split('T')[0];
    if (dayState.date !== today) {
      // Si es lunes, ejecutar la rotación semanal antes de resetear el día
      const isMonday = new Date(today).getUTCDay() === 1;
      if (isMonday) {
        await WeeklyTaskService.updateWeeklyRotations();
      }

      // Resetear para el nuevo día
      const newDayState = {
        date: today,
        currentTaskIndex: 0,
        completedTasks: [],
        dayCompleted: false,
        subtaskQueues: {}
      };
      
      await WeeklyTaskService.updateDayState(newDayState);
      
      const response: ApiResponse<typeof newDayState> = {
        success: true,
        data: newDayState,
        message: 'Nuevo día iniciado'
      };
      
      return res.json(response);
    }
    
    // Obtener la tarea actual
    const currentTask = weeklyData.sequence[dayState.currentTaskIndex];
    
    const response: ApiResponse<{
      dayState: typeof dayState;
      currentTask: typeof currentTask;
      totalTasks: number;
    }> = {
      success: true,
      data: {
        dayState,
        currentTask,
        totalTasks: weeklyData.sequence.length
      },
      message: 'Estado del día actual obtenido'
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// POST /api/weekly/start-task - Empezar tarea actual
router.post('/start-task', async (req, res, next) => {
  try {
    const dayState = await WeeklyTaskService.getCurrentDayState();
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    
    if (dayState.dayCompleted) {
      throw createError('El día ya está completado', 400);
    }
    
    const currentTask = weeklyData.sequence[dayState.currentTaskIndex];
    
    if (!currentTask) {
      throw createError('No hay tarea actual para empezar', 400);
    }
    
    // Marcar la tarea como iniciada
    currentTask.isStarted = true;

    // Si la tarea tiene subtareas y no hay una subtarea actual seleccionada, seleccionar la primera
    if (currentTask.subtasks && currentTask.subtasks.length > 0 && !currentTask.currentSubtaskId) {
      currentTask.currentSubtaskId = currentTask.subtasks[0].id;
    }

    // Si la tarea es 'Mac', resetear el timer.
    if (currentTask.name === 'Mac') {
      dayState.timerElapsedSeconds = 0;
      dayState.timerState = 'running';
      await WeeklyTaskService.updateDayState(dayState);
    }
    
    const response: ApiResponse<{
      startedTask: typeof currentTask;
      dayState: typeof dayState;
    }> = {
      success: true,
      data: {
        startedTask: currentTask,
        dayState
      },
      message: `Tarea iniciada: ${currentTask.name}`
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// POST /api/weekly/complete-task - Completar tarea actual
router.post('/complete-task', async (req, res, next) => {
  try {
    const dayState = await WeeklyTaskService.getCurrentDayState();
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    
    if (dayState.dayCompleted) {
      throw createError('El día ya está completado', 400);
    }
    
    const currentTask = weeklyData.sequence[dayState.currentTaskIndex];
    
    if (!currentTask) {
      throw createError('No hay más tareas para hoy', 400);
    }

    // Si la tarea tiene rotación por finalización, actualizar la subtarea
    if (currentTask.subtaskRotation === 'completion') {
      await WeeklyTaskService.rotateCompletionBasedSubtask(currentTask.id);
    }

    // The "Mac" task (weekly_13) is now handled by the normal completion flow.
    // The special logic for subtask rotation without completion is no longer needed here.

    // Manejar tarea especial "Lista"
    if (currentTask.name === 'Lista') {
      // Seleccionar tarea aleatoria de las tareas generales no completadas
      const categories = await TaskService.getAllTasks();
      const allTasks = [];
      
      for (const category of Object.values(categories)) {
        allTasks.push(...category.tasks.filter(t => !t.completed));
      }
      
      if (allTasks.length === 0) {
        throw createError('No hay tareas pendientes en la lista general', 400);
      }
      
      const randomTask = allTasks[Math.floor(Math.random() * allTasks.length)];
      
      const response: ApiResponse<{
        selectedTask: typeof randomTask;
        message: string;
      }> = {
        success: true,
        data: {
          selectedTask: randomTask,
          message: `Tarea seleccionada: ${randomTask.name} (${randomTask.category})`
        },
        message: 'Tarea aleatoria seleccionada de la lista'
      };
      
      return res.json(response);
    }
    
    // Completar tarea normal
    dayState.completedTasks.push(currentTask.id);
    dayState.currentTaskIndex++;
    
    // Stop the timer if it was running for any reason
    if (dayState.timerState === 'running' || dayState.timerState === 'paused') {
      dayState.timerState = 'stopped';
    }

    // Verificar si se completaron todas las tareas
    if (dayState.currentTaskIndex >= weeklyData.sequence.length) {
      dayState.dayCompleted = true;
    }
    
    await WeeklyTaskService.updateDayState(dayState);
    
    const nextTask = weeklyData.sequence[dayState.currentTaskIndex];
    
    const response: ApiResponse<{
      completedTask: typeof currentTask;
      nextTask: typeof nextTask;
      dayState: typeof dayState;
    }> = {
      success: true,
      data: {
        completedTask: currentTask,
        nextTask,
        dayState
      },
      message: dayState.dayCompleted 
        ? '¡Día completado! Todas las tareas fueron realizadas' 
        : `Tarea completada. Siguiente: ${nextTask?.name || 'Ninguna'}`
    };
    
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

// POST /api/weekly/update-subtask-title - Actualiza el título de una subtarea (para libros, juegos, etc.)
router.post('/update-subtask-title', async (req, res, next) => {
  try {
    const { subtaskId, newTitle } = req.body;

    if (!subtaskId || !newTitle) {
      throw createError('subtaskId y newTitle son requeridos', 400);
    }

    await WeeklyTaskService.updateSubtaskTitle(subtaskId, newTitle);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Título de la subtarea actualizado exitosamente'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/weekly/subtask/:id - Actualizar subtarea
router.put('/subtask/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Esta funcionalidad se implementará cuando se desarrolle el sistema de subtareas
    throw createError('Funcionalidad de subtareas no implementada aún', 501);
  } catch (error) {
    next(error);
  }
});

// GET /api/weekly/progress - Obtener progreso semanal
router.get('/progress', async (req, res, next) => {
  try {
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    const dayState = await WeeklyTaskService.getCurrentDayState();
    
    const progress = {
      totalTasks: weeklyData.sequence.length,
      completedToday: dayState.completedTasks.length,
      currentTaskIndex: dayState.currentTaskIndex,
      dayCompleted: dayState.dayCompleted,
      date: dayState.date,
      progressPercentage: weeklyData.sequence.length > 0 
        ? Math.round((dayState.completedTasks.length / weeklyData.sequence.length) * 100)
        : 0
    };
    
    const response: ApiResponse<typeof progress> = {
      success: true,
      data: progress,
      message: 'Progreso semanal obtenido'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/weekly/timer - Actualizar el estado del timer de la tarea Mac
router.post('/timer', async (req, res, next) => {
  try {
    const { elapsedSeconds, state } = req.body;

    if (typeof elapsedSeconds !== 'number' || !state) {
      throw createError('elapsedSeconds (number) and state are required', 400);
    }

    const dayState = await WeeklyTaskService.getCurrentDayState();

    dayState.timerElapsedSeconds = elapsedSeconds;
    dayState.timerState = state;

    await WeeklyTaskService.updateDayState(dayState);

    const response: ApiResponse<{ dayState: typeof dayState }> = {
      success: true,
      data: { dayState },
      message: 'Timer state updated successfully.'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
