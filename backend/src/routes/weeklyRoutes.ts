import express from 'express';
import { WeeklyTaskService, TaskService, HistoryService } from '../services/dataService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse, DayState, TimerState, WeeklyTask } from '../types';

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
    console.log('🔄 GET /api/weekly/current-day - Iniciando...');
    const dayState = await WeeklyTaskService.getCurrentDayState();
    console.log('📅 DayState obtenido:', dayState);
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    console.log('📋 WeeklyData obtenido, tareas:', weeklyData.sequence.length);
    
    // Verificar si es un nuevo día en la zona horaria de Bogotá (GMT-5)
    const today = WeeklyTaskService.getBogotaDate();

    if (dayState.date !== today) {
      // Si es lunes en Bogotá, ejecutar la rotación semanal
      const isMonday = WeeklyTaskService.getBogotaDayOfWeek() === 1;
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
    
    console.log('✅ Enviando respuesta current-day:', { 
      currentTaskName: currentTask?.name, 
      totalTasks: weeklyData.sequence.length,
      dayCompleted: dayState.dayCompleted 
    });
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

    // 🔄 ROTAR SUBTAREA DE LISTA AL INICIAR (onStartOrCompletion)
    if (currentTask.name === 'Lista' && currentTask.subtaskRotation === 'onStartOrCompletion') {
      await WeeklyTaskService.rotateListaSubtask(currentTask.id);
    }

    // 🔧 FIX: Guardar la tarea actualizada con isStarted = true
    await WeeklyTaskService.updateWeeklyData({ sequence: weeklyData.sequence, dailyState: dayState });

    // Iniciar el temporizador para la tarea.
    dayState.timerElapsedSeconds = 0;
    dayState.timerState = 'running'; // CORRECTED: Start timer when user clicks "Start Task"
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
      console.log('Completando tarea Mac y rotando subtarea...');
      
      // Rotar la subtarea Mac para el próximo día
      await WeeklyTaskService.rotateMacSubtask(currentTask.id);
      
      // Siempre completar la tarea Mac
      dayState.completedTasks.push(currentTask.id);
      dayState.currentTaskIndex++;

      if (dayState.currentTaskIndex >= weeklyData.sequence.length) {
        dayState.dayCompleted = true;
        dayState.timerState = 'stopped';
      } else {
        // Reiniciar timer para la siguiente tarea
        dayState.timerElapsedSeconds = 0;
        dayState.timerState = 'stopped'; // CHANGED: No auto-start timer
        
        // Marcar la siguiente tarea como iniciada
        const nextTask = weeklyData.sequence[dayState.currentTaskIndex];
        if (nextTask) {
          // nextTask.isStarted = true; // DISABLED: No auto-start
        }
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
          ? '¡Día completado! Tarea Mac completada y rotada para mañana' 
          : `Tarea Mac completada y rotada. Siguiente: ${nextTask?.name || 'Ninguna'}`
      });
    }

    // Lógica para otras tareas con rotación por finalización
    if (currentTask.subtaskRotation === 'completion') {
      // await WeeklyTaskService.rotateCompletionBasedSubtask(currentTask.id);
    }

    // Manejar tarea especial "Lista"
    if (currentTask.name === 'Lista') {
      // 🔄 ROTAR SUBTAREA DE LISTA ANTES DE COMPLETAR
      if (currentTask.subtaskRotation === 'onStartOrCompletion') {
        await WeeklyTaskService.rotateListaSubtask(currentTask.id);
      }

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
        dayState.timerState = 'stopped';
      } else {
        // Reiniciar timer para la siguiente tarea
        dayState.timerElapsedSeconds = 0;
        dayState.timerState = 'stopped'; // CHANGED: No auto-start timer
        
        // Marcar la siguiente tarea como iniciada
        const nextTask = weeklyData.sequence[dayState.currentTaskIndex];
        if (nextTask) {
          // nextTask.isStarted = true; // DISABLED: No auto-start
        }
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
    
    // Solo guardar en historial tareas específicas (Leer, Juego, Mac)
    const shouldSaveToHistory = ['Leer', 'Juego', 'Mac'].includes(currentTask.name);
    if (dayState.timerElapsedSeconds && shouldSaveToHistory) {
      // Obtener el título específico de la subtarea actual
      let specificTitle = currentTask.name; // Fallback al nombre de la tarea
      
      if (currentTask.subtasks && currentTask.currentSubtaskId) {
        const currentSubtask = currentTask.subtasks.find(sub => sub.id === currentTask.currentSubtaskId);
        if (currentSubtask) {
          // Para Mac, si está en Related o Practicas, obtener el curso específico
          if (currentTask.name === 'Mac' && currentSubtask.subtasks && currentSubtask.currentSubtaskId) {
            const currentCourse = currentSubtask.subtasks.find(course => course.id === currentSubtask.currentSubtaskId);
            if (currentCourse) {
              specificTitle = currentCourse.title || currentCourse.name;
            }
          } else {
            // Para Leer y Juego, usar el título de la subtarea
            specificTitle = currentSubtask.title || currentSubtask.name;
          }
        }
      }
      
      await HistoryService.addToHistory({
        id: currentTask.id,
        type: currentTask.name === 'Leer' ? 'Book' : currentTask.name === 'Juego' ? 'Game' : 'Course',
        name: specificTitle, // Usar el título específico en lugar del nombre de la tarea
        timeSpent: dayState.timerElapsedSeconds,
        parentId: currentTask.id
      });
      console.log(`📊 Tarea guardada en historial: ${specificTitle} - ${dayState.timerElapsedSeconds} segundos`);
    }
    dayState.completedTasks.push(currentTask.id);
    dayState.currentTaskIndex++;

    if (dayState.currentTaskIndex >= weeklyData.sequence.length) {
      dayState.dayCompleted = true;
      dayState.timerState = 'stopped';
    } else {
      // Reiniciar timer para la siguiente tarea (pero no iniciarla automáticamente)
      dayState.timerElapsedSeconds = 0;
      dayState.timerState = 'stopped';
      
      // NO marcar la siguiente tarea como iniciada automáticamente
      // El usuario debe hacer clic en "Empezar Tarea" manualmente
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

// POST /api/weekly/complete-subtask - Completar subtarea actual
router.post('/complete-subtask', async (req, res, next) => {
  try {
    const oldDayState = await WeeklyTaskService.getCurrentDayState();
    const weeklyData = await WeeklyTaskService.getWeeklyData();

    if (oldDayState.dayCompleted) {
      throw createError('El día ya está completado', 400);
    }

    const currentTask = weeklyData.sequence[oldDayState.currentTaskIndex];

    if (!currentTask) {
      throw createError('No hay más tareas para hoy', 400);
    }

    // Preservar TODOS los estados importantes ANTES de la rotación
    const wasTaskStarted = currentTask.isStarted || false;

    // Lógica específica para la tarea "Mac" - rotar subtareas
    if (currentTask.id === 'weekly_13') {
      const rotationResult = await WeeklyTaskService.rotateMacSubtask(currentTask.id, true);
      
      // Si la rotación indica que debe completarse la tarea, usar la lógica de complete-task
      if (rotationResult.shouldCompleteTask) {
        
        // Guardar tarea Mac en historial como Course con título específico
        if (oldDayState.timerElapsedSeconds) {
          // Obtener el título específico del curso actual en Mac
          let specificTitle = currentTask.name; // Fallback
          
          if (currentTask.subtasks && currentTask.currentSubtaskId) {
            const currentSubtask = currentTask.subtasks.find(sub => sub.id === currentTask.currentSubtaskId);
            if (currentSubtask && currentSubtask.subtasks && currentSubtask.currentSubtaskId) {
              const currentCourse = currentSubtask.subtasks.find(course => course.id === currentSubtask.currentSubtaskId);
              if (currentCourse) {
                specificTitle = currentCourse.title || currentCourse.name;
              }
            }
          }
          
          await HistoryService.addToHistory({
            id: currentTask.id,
            type: 'Course',
            name: specificTitle, // Usar el título específico del curso
            timeSpent: oldDayState.timerElapsedSeconds,
            parentId: currentTask.id
          });
          console.log(`📊 Tarea Mac guardada en historial: ${specificTitle} - ${oldDayState.timerElapsedSeconds} segundos`);
        }
        
        // Completar la tarea Mac
        oldDayState.completedTasks.push(currentTask.id);
        oldDayState.currentTaskIndex++;
        oldDayState.timerState = 'stopped';

        if (oldDayState.currentTaskIndex >= weeklyData.sequence.length) {
          oldDayState.dayCompleted = true;
        }
        
        await WeeklyTaskService.updateDayState(oldDayState);

        // Obtener la siguiente tarea
        const updatedWeeklyData = await WeeklyTaskService.getWeeklyData();
        const nextTask = updatedWeeklyData.sequence[oldDayState.currentTaskIndex];
        
        const response: ApiResponse<{
          completedTask: typeof currentTask;
          nextTask: typeof nextTask;
          dayState: typeof oldDayState;
        }> = {
          success: true,
          data: {
            completedTask: currentTask,
            nextTask,
            dayState: oldDayState
          },
          message: oldDayState.dayCompleted 
            ? '¡Día completado! Tarea Mac completada tras completar todas las subtareas' 
            : `Tarea Mac completada tras completar todas las subtareas. Siguiente: ${nextTask?.name || 'Ninguna'}`
        };

        return res.json(response);
      }
    }

    // Usar el estado actual y preservar el timer exactamente como está
    const preservedDayState = { ...oldDayState };
    await WeeklyTaskService.updateDayState(preservedDayState);

    // Obtener los datos actualizados
    const newWeeklyData = await WeeklyTaskService.getWeeklyData();
    const updatedTask = newWeeklyData.sequence.find(t => t.id === currentTask.id);

    // Crear una copia de la tarea actualizada con TODOS los estados preservados
    const taskWithPreservedState = {
      ...updatedTask,
      isStarted: wasTaskStarted // Preservar el estado isStarted original
    };

    const response: ApiResponse<{
      currentTask: typeof taskWithPreservedState;
      dayState: typeof preservedDayState;
    }> = {
      success: true,
      data: {
        currentTask: taskWithPreservedState,
        dayState: preservedDayState
      },
      message: 'Subtarea completada. La tarea continúa.'
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

    // await WeeklyTaskService.updateSubtaskTitle(subtaskId, newTitle);

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

    // await WeeklyTaskService.finishGameTask(subtaskId, newTitle);

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



// GET /api/weekly/unfinished-courses - Obtener cursos no terminados
router.get('/unfinished-courses', async (req, res, next) => {
  try {
    const unfinishedCourses = await WeeklyTaskService.getUnfinishedCourses();
    
    const response: ApiResponse<typeof unfinishedCourses> = {
      success: true,
      data: unfinishedCourses,
      message: 'Cursos no terminados obtenidos exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/weekly/update-timer - Actualizar estado del timer
router.post('/update-timer', async (req, res, next) => {
  try {
    const { elapsedSeconds, timerState } = req.body;
    
    const dayState = await WeeklyTaskService.getCurrentDayState();
    dayState.timerElapsedSeconds = elapsedSeconds;
    dayState.timerState = timerState;
    
    await WeeklyTaskService.updateDayState(dayState);
    
    const response: ApiResponse<DayState> = {
      success: true,
      data: dayState,
      message: 'Timer actualizado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/weekly/add-course - Agregar curso a subtarea
router.post('/add-course', async (req, res, next) => {
  try {
    const { parentSubtaskId, courseName } = req.body;
    
    if (!parentSubtaskId || !courseName) {
      throw createError('parentSubtaskId y courseName son requeridos', 400);
    }
    
    await WeeklyTaskService.addCourseToSubtask(parentSubtaskId, courseName);
    
    const response: ApiResponse<{ message: string; courseName: string }> = {
      success: true,
      data: { message: 'Curso agregado exitosamente', courseName },
      message: `Curso "${courseName}" agregado exitosamente`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/weekly/complete-course - Completar curso específico
router.post('/complete-course', async (req, res, next) => {
  try {
    const { parentSubtaskId, courseSubtaskId } = req.body;
    
    if (!parentSubtaskId || !courseSubtaskId) {
      throw createError('parentSubtaskId y courseSubtaskId son requeridos', 400);
    }
    
    await WeeklyTaskService.completeCourse(parentSubtaskId, courseSubtaskId);
    
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Curso completado exitosamente' },
      message: 'Curso completado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/weekly/add-completed-item - Agregar item completado al historial
router.post('/add-completed-item', async (req, res, next) => {
  try {
    const { type, name, timeSpent, completedDate } = req.body;
    
    if (!type || !name) {
      throw createError('type y name son requeridos', 400);
    }
    
    // Validar tipo
    const validTypes = ['Book', 'Game', 'Course'];
    if (!validTypes.includes(type)) {
      throw createError('type debe ser Book, Game o Course', 400);
    }
    
    // Crear item para el historial
    const completedItem = {
      id: type === 'Book' ? 'weekly_3' : type === 'Game' ? 'weekly_4' : 'weekly_13',
      type,
      name,
      timeSpent: timeSpent || 2700, // 45 minutos por defecto
      parentId: type === 'Book' ? 'weekly_3' : type === 'Game' ? 'weekly_4' : 'weekly_13',
      completedDate: completedDate || new Date().toISOString()
    };
    
    await HistoryService.addToHistory(completedItem);
    
    const response: ApiResponse<{ item: typeof completedItem }> = {
      success: true,
      data: { item: completedItem },
      message: `${type === 'Book' ? 'Libro' : type === 'Game' ? 'Juego' : 'Curso'} "${name}" agregado al historial exitosamente`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/weekly/rotation-summary - Obtener resumen de rotaciones actuales
router.get('/rotation-summary', async (req, res, next) => {
  try {
    const rotationSummary = await WeeklyTaskService.getRotationSummary();
    
    const response: ApiResponse<typeof rotationSummary> = {
      success: true,
      data: rotationSummary,
      message: 'Resumen de rotaciones obtenido exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/weekly/task-statistics - Obtener estadísticas detalladas por tarea
router.get('/task-statistics', async (req, res, next) => {
  try {
    const { period } = req.query;
    const validPeriods = ['week', 'month', 'quarter', 'semester', 'year', 'total'];
    const selectedPeriod = validPeriods.includes(period as string) ? period as any : undefined;
    
    const statistics = await WeeklyTaskService.getTaskStatistics(selectedPeriod);
    
    const response: ApiResponse<typeof statistics> = {
      success: true,
      data: statistics,
      message: 'Estadísticas de tareas obtenidas exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/weekly/task/:id/notes - Actualizar notas de una tarea
router.put('/task/:id/notes', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (typeof notes !== 'string') {
      throw createError('Las notas deben ser una cadena de texto', 400);
    }

    const updatedTask = await WeeklyTaskService.updateTaskNotes(id, notes);
    
    const response: ApiResponse<WeeklyTask> = {
      success: true,
      data: updatedTask,
      message: 'Notas de la tarea actualizadas exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/weekly/reset-day - Reset manual del estado del día
router.post('/reset-day', async (req, res, next) => {
  try {
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    
    // Resetear todas las tareas
    for (const task of weeklyData.sequence) {
      task.isStarted = false;
    }
    
    // Resetear el estado del día usando la hora de Bogotá
    const today = WeeklyTaskService.getBogotaDate();
    weeklyData.dailyState = {
      date: today,
      currentTaskIndex: 0,
      completedTasks: [],
      dayCompleted: false,
      subtaskQueues: {},
      timerElapsedSeconds: 0,
      timerState: 'stopped'
    };
    
    // Guardar los cambios
    await WeeklyTaskService.updateWeeklyData(weeklyData);
    
    const response: ApiResponse<typeof weeklyData.dailyState> = {
      success: true,
      data: weeklyData.dailyState,
      message: `Estado del día reseteado exitosamente para ${today}`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/weekly/reset-current-task - Reset solo de la tarea actual
router.post('/reset-current-task', async (req, res, next) => {
  try {
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    const currentTask = weeklyData.sequence[weeklyData.dailyState.currentTaskIndex];
    
    if (!currentTask) {
      throw createError('No hay tarea actual para resetear', 400);
    }
    
    // Resetear solo la tarea actual
    currentTask.isStarted = false;
    
    // Resetear el timer
    weeklyData.dailyState.timerElapsedSeconds = 0;
    weeklyData.dailyState.timerState = 'stopped';
    
    // Guardar los cambios
    await WeeklyTaskService.updateWeeklyData(weeklyData);
    
    const response: ApiResponse<typeof currentTask> = {
      success: true,
      data: currentTask,
      message: `Tarea ${currentTask.name} reseteada exitosamente`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;