import express from 'express';
import { WeeklyTaskService, TaskService, HistoryService } from '../services/dataService';
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
    
    return res.json(response); // Added return
  } catch (error) {
    return next(error); // Added return
  }
});

// GET /api/weekly/current-day - Obtener estado del día actual
router.get('/current-day', async (req, res, next) => {
  try {
    const dayState = await WeeklyTaskService.getCurrentDayState();
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    
    // Verificar si es un nuevo día en la zona horaria de Bogotá (GMT-5)
    const now = new Date();
    const bogotaNow = new Date(now.getTime() - (5 * 60 * 60 * 1000));
    const today = bogotaNow.toISOString().split('T')[0];

    if (dayState.date !== today) {
      // Si es lunes en Bogotá, ejecutar la rotación semanal
      const isMonday = bogotaNow.getUTCDay() === 1;
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

    // Iniciar el temporizador para la tarea.
    dayState.timerElapsedSeconds = 0;
    dayState.timerState = 'running';
    await WeeklyTaskService.updateDayState(dayState);
    
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
    let dayState = await WeeklyTaskService.getCurrentDayState();
    const weeklyData = await WeeklyTaskService.getWeeklyData();

    if (dayState.dayCompleted) {
      throw createError('El día ya está completado', 400);
    }

    const currentTask = weeklyData.sequence[dayState.currentTaskIndex];

    if (!currentTask) {
      throw createError('No hay más tareas para hoy', 400);
    }

    // Lógica específica para la tarea "Mac"
    if (currentTask.id === 'weekly_13') {
      const macCycleCompleted = await WeeklyTaskService.rotateMacSubtask(currentTask.id);

      if (macCycleCompleted) {
        // Si el ciclo de subtareas de Mac se completó, marcar la tarea principal como hecha
        dayState.completedTasks.push(currentTask.id);
        dayState.currentTaskIndex++;
        dayState.timerState = 'stopped';

        if (dayState.currentTaskIndex >= weeklyData.sequence.length) {
          dayState.dayCompleted = true;
        }
        
        await WeeklyTaskService.updateDayState(dayState);

        const nextTask = weeklyData.sequence[dayState.currentTaskIndex];
        
        return res.json({
          success: true,
          data: {
            completedTask: currentTask,
            nextTask,
            dayState
          },
          message: 'Ciclo de Mac completado. Siguiente tarea: ' + (nextTask?.name || 'Ninguna')
        });

      } else {
        // Si el ciclo no se completó, solo se rotó la subtarea. La tarea principal sigue activa.
        dayState = await WeeklyTaskService.getCurrentDayState(); // Recargar estado
        const newWeeklyData = await WeeklyTaskService.getWeeklyData();
        const updatedTask = newWeeklyData.sequence.find(t => t.id === currentTask.id);

        return res.json({
          success: true,
          data: {
            completedTask: null, // No se completa la tarea principal
            nextTask: updatedTask, // La siguiente tarea es la misma (Mac)
            dayState
          },
          message: 'Subtarea de Mac completada. La tarea continúa.'
        });
      }
    }

    // Lógica para otras tareas con rotación por finalización
    if (currentTask.subtaskRotation === 'completion') {
      await WeeklyTaskService.rotateCompletionBasedSubtask(currentTask.id);
    }

    // Manejar tarea especial "Lista"
    if (currentTask.name === 'Lista') {
      const categories = await TaskService.getAllTasks();
      const allTasks = Object.values(categories).flatMap(cat => cat.tasks.filter(t => !t.completed));

      if (allTasks.length === 0) {
        throw createError('No hay tareas pendientes en la lista general', 400);
      }

      const randomTask = allTasks[Math.floor(Math.random() * allTasks.length)];
      
      // Completar la tarea "Lista"
      dayState.completedTasks.push(currentTask.id);
      dayState.currentTaskIndex++;

      if (dayState.currentTaskIndex >= weeklyData.sequence.length) {
        dayState.dayCompleted = true;
      }

      await WeeklyTaskService.updateDayState(dayState);

      const nextTask = weeklyData.sequence[dayState.currentTaskIndex];

      return res.json({
        success: true,
        data: {
          selectedTask: randomTask,
          nextTask: nextTask,
          dayState: dayState,
          message: `Tarea seleccionada: ${randomTask.name} (${randomTask.category})`
        },
        message: 'Tarea aleatoria seleccionada de la lista'
      });
    }
    
    // Completar tarea normal
    if (dayState.timerElapsedSeconds) {
      await HistoryService.addToHistory({
        id: currentTask.id,
        type: currentTask.name as any, // Using task name as type
        name: currentTask.name,
        completedDate: new Date().toISOString(),
        timeSpent: dayState.timerElapsedSeconds * 1000, // convert to ms
      });
    }
    dayState.completedTasks.push(currentTask.id);
    dayState.currentTaskIndex++;
    
    if (dayState.timerState === 'running' || dayState.timerState === 'paused') {
      dayState.timerState = 'stopped';
    }

    if (dayState.currentTaskIndex >= weeklyData.sequence.length) {
      dayState.dayCompleted = true;
    }
    
    await WeeklyTaskService.updateDayState(dayState);
    
    const nextTask = weeklyData.sequence[dayState.currentTaskIndex];
    
    return res.json({
      success: true,
      data: {
        completedTask: currentTask,
        nextTask,
        dayState
      },
      message: dayState.dayCompleted 
        ? '¡Día completado! Todas las tareas fueron realizadas' 
        : `Tarea completada. Siguiente: ${nextTask?.name || 'Ninguna'}`
    });

  } catch (error) {
    return next(error); // Added return
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

    return res.status(200).json(response); // Added return
  } catch (error) {
    return next(error); // Added return
  }
});

// POST /api/weekly/finish-game-task - Finaliza un juego y rota la plataforma
router.post('/finish-game-task', async (req, res, next) => {
  try {
    const { subtaskId, newTitle } = req.body;

    if (!subtaskId || !newTitle) {
      throw createError('subtaskId y newTitle son requeridos', 400);
    }

    await WeeklyTaskService.finishGameTask(subtaskId, newTitle);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Juego finalizado y plataforma rotada exitosamente'
    };

    return res.status(200).json(response); // Added return
  } catch (error) {
    return next(error); // Added return
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
    return next(error); // Added return
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
    
    return res.json(response); // Added return
  } catch (error) {
    return next(error); // Added return
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

    return res.json(response); // Added return
  } catch (error) {
    return next(error); // Added return
  }
});

export { router as weeklyRoutes };

// POST /api/weekly/add-course - Agregar un nuevo curso a una subtarea
router.post('/add-course', async (req, res, next) => {
  try {
    const { parentSubtaskId, courseName } = req.body;

    if (!parentSubtaskId || !courseName) {
      throw createError('parentSubtaskId y courseName son requeridos', 400);
    }

    await WeeklyTaskService.addCourseToSubtask(parentSubtaskId, courseName);

    res.json({ success: true, message: 'Curso agregado exitosamente' });
  } catch (error) {
    next(error);
  }
});

// GET /api/weekly/unfinished-courses - Obtener cursos no terminados
router.get('/unfinished-courses', async (req, res, next) => {
  try {
    const unfinishedCourses = await WeeklyTaskService.getUnfinishedCourses();
    res.json({ success: true, data: unfinishedCourses });
  } catch (error) {
    next(error);
  }
});