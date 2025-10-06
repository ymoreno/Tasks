import express from 'express';
import { TaskService } from '../services/dataService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = express.Router();

// GET /api/tasks - Obtener todas las tareas
router.get('/', async (req, res, next) => {
  try {
    const tasks = await TaskService.getAllTasks();
    
    const response: ApiResponse<typeof tasks> = {
      success: true,
      data: tasks,
      message: 'Tareas obtenidas exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id - Obtener tarea por ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await TaskService.getTaskById(id);
    
    if (!task) {
      throw createError('Tarea no encontrada', 404);
    }
    
    const response: ApiResponse<typeof task> = {
      success: true,
      data: task,
      message: 'Tarea obtenida exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Crear nueva tarea
router.post('/', async (req, res, next) => {
  try {
    const taskData = req.body;
    const newTask = await TaskService.createTask(taskData);
    
    const response: ApiResponse<typeof newTask> = {
      success: true,
      data: newTask,
      message: 'Tarea creada exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:id - Actualizar tarea
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedTask = await TaskService.updateTask(id, updates);
    
    const response: ApiResponse<typeof updatedTask> = {
      success: true,
      data: updatedTask,
      message: 'Tarea actualizada exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Eliminar tarea
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await TaskService.deleteTask(id);
    
    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Tarea eliminada exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/random-score - Generar puntuaciones aleatorias
router.post('/random-score', async (req, res, next) => {
  try {
    const updatedTasks = await TaskService.generateRandomScores();
    
    const response: ApiResponse<typeof updatedTasks> = {
      success: true,
      data: updatedTasks,
      message: 'Puntuaciones aleatorias generadas exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;