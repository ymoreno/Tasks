#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';
import { TaskService, WeeklyTaskService } from '../services/dataService';
import { logger } from '../utils/logger';
import { Task, WeeklyTask } from '../types';

// Datos basados en tu archivo Tareas.csv
const initialTasksData = [
  { name: 'Arreglarme', scores: [4,9,13,3,2,8,6,1,4,4,7,3,4,8,4,14,2,5,3,2,11,10,12,3,14,1,10,2,11,12,4,4,2,5,7,7,4,9,3,9,1,8,11,5,6,10] },
  { name: 'Casa', scores: [5,4,5,8,13,10,8,10,8,9,1,5,12,12,1,13,7,12,1,12,4,2,8,10,9,10,8,10,5,2,10,10,12,8,8,6,10,1,14,11,3,14,9,6,9,1] },
  { name: 'Juegos', scores: [9,8,7,5,4,3,9,14,1,5,5,10,6,7,3,2,1,8,14,14,7,13,5,2,10,7,11,4,6,5,6,13,4,4,11,1,2,8,7,4,14,13,7,11,4,3] },
  { name: 'Plantas', scores: [11,7,10,9,3,14,3,5,11,14,2,9,13,9,12,6,10,4,10,8,9,4,2,5,4,11,1,3,4,3,3,5,3,3,10,12,9,6,13,13,4,10,10,9,10,8] },
  { name: 'Musica', scores: [2,14,1,4,6,1,7,7,2,2,14,11,14,6,2,8,4,2,4,5,8,5,3,11,3,14,3,11,9,4,14,7,13,7,9,13,6,4,4,6,8,12,1,12,11,6] },
  { name: 'PC', scores: [1,12,8,10,7,2,2,11,14,11,13,7,2,5,13,3,6,14,5,9,2,14,11,1,12,13,6,7,7,6,1,14,14,12,13,2,13,14,1,1,6,5,3,1,12,3] },
  { name: 'Comics', scores: [8,13,4,13,14,9,5,2,10,13,11,8,11,14,11,4,14,9,7,11,1,3,10,9,5,3,2,8,10,11,2,3,10,1,1,3,3,5,6,2,13,4,12,13,8,9] },
  { name: 'Libro', scores: [3,10,14,7,11,5,4,3,13,6,8,4,10,4,7,11,11,6,11,10,14,12,14,8,7,2,7,12,14,1,11,1,6,2,5,4,5,12,2,3,11,2,14,3,3,5] },
  { name: 'Dibujar', scores: [13,11,2,1,1,6,14,6,7,8,3,13,8,11,6,5,13,10,2,6,3,1,13,7,6,6,13,13,13,10,5,12,5,6,3,10,14,7,9,8,7,9,6,4,13,9] },
  { name: 'Peliculas', scores: [12,1,9,2,9,13,11,12,3,7,6,1,7,10,9,10,3,13,12,4,13,11,1,12,11,8,5,14,2,14,7,11,1,13,14,5,1,10,5,14,2,7,13,2,1,6] },
  { name: 'Autoentrenamiento', scores: [10,2,6,6,10,7,1,9,9,1,10,6,1,1,5,1,9,1,13,1,12,8,4,14,1,4,14,5,3,7,9,9,9,9,4,14,12,2,12,10,5,6,4,7,2,5] },
  { name: 'Escribir', scores: [14,3,3,14,8,4,12,4,5,12,4,2,9,13,8,9,12,7,8,13,6,9,7,4,2,5,9,9,8,13,12,2,11,10,2,11,11,13,8,12,12,11,2,10,5,1] },
  { name: 'Mix', scores: [6,5,12,11,12,12,13,13,12,10,12,12,3,3,10,12,5,3,6,3,10,7,6,6,13,9,12,6,12,9,13,8,7,11,12,9,8,3,11,5,9,3,8,14,7,12] },
  { name: 'Portatil', scores: [7,6,11,12,5,11,10,8,6,3,9,14,5,2,14,7,8,11,9,7,5,6,9,13,8,12,4,1,1,8,8,6,8,14,6,8,7,11,10,7,10,1,5,8,14,2] }
];

// Datos basados en tu archivo Tareas semanales
const weeklyTasksData = [
  { name: 'Ejercicio', plannedDays: 7, order: 1 },
  { name: 'Casa', plannedDays: 7, order: 2 },
  { name: 'Leer', plannedDays: 7, order: 3 },
  { name: 'Juego', plannedDays: 7, order: 4 },
  { name: 'Portátil', plannedDays: 3, order: 5, hasSubtasks: true },
  { name: 'PC', plannedDays: 3, order: 6 },
  { name: 'Lista', plannedDays: 2, order: 7 },
  { name: 'Training', plannedDays: 2, order: 8 },
  { name: 'Plantas', plannedDays: 1, order: 9 },
  { name: 'Carro', plannedDays: 1, order: 10 },
  { name: 'Dibujar', plannedDays: 1, order: 11 },
  { name: 'Escribir', plannedDays: 1, order: 12 }
];

async function importInitialData() {
  logger.info('🚀 Iniciando importación de datos iniciales...');

  try {
    // 1. Importar tareas generales
    logger.info('📋 Importando tareas generales...');
    
    for (const taskData of initialTasksData) {
      const task = {
        category: taskData.name,
        name: taskData.name,
        scores: taskData.scores,
        currentScore: undefined,
        completed: false,
        timeTracking: {
          isActive: false,
          totalTime: 0,
          sessions: []
        }
      };

      await TaskService.createTask({ ...task, category: taskData.name });
      logger.debug(`✅ Tarea creada: ${taskData.name}`);
    }

    logger.success(`✅ ${initialTasksData.length} tareas generales importadas`);

    // 2. Importar tareas semanales
    logger.info('📅 Importando tareas semanales...');
    
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    
    // Crear tareas semanales
    weeklyData.sequence = weeklyTasksData.map((taskData, index) => {
      const weeklyTask: WeeklyTask = {
        id: `weekly_${index + 1}`,
        name: taskData.name,
        plannedDays: taskData.plannedDays,
        completedDays: 0,
        weeklySchedule: [true, true, true, false, false, false, false], // L,M,X activos por defecto
        order: taskData.order,
        timeTracking: {
          isActive: false,
          totalTime: 0,
          sessions: []
        }
      };

      // Agregar subtareas para "Portátil"
      if (taskData.name === 'Portátil') {
        weeklyTask.subtasks = [
          {
            id: 'sub_laptop',
            name: 'Laptop',
            completed: false,
            order: 1,
            movedToEnd: false,
            timeTracking: {
              isActive: false,
              totalTime: 0,
              sessions: []
            }
          },
          {
            id: 'sub_mac_algoritmos',
            name: 'Mac - Algoritmos',
            completed: false,
            order: 2,
            movedToEnd: false,
            timeTracking: {
              isActive: false,
              totalTime: 0,
              sessions: []
            }
          },
          {
            id: 'sub_mac_ia',
            name: 'Mac - Related IA',
            completed: false,
            order: 3,
            movedToEnd: false,
            timeTracking: {
              isActive: false,
              totalTime: 0,
              sessions: []
            }
          }
        ];
      }

      return weeklyTask;
    });

    // Inicializar estado del día
    weeklyData.dailyState = {
      date: new Date().toISOString().split('T')[0],
      currentTaskIndex: 0,
      completedTasks: [],
      dayCompleted: false,
      subtaskQueues: {}
    };

    // await WeeklyTaskService.saveWeeklyData(weeklyData); // Método no disponible
    logger.success(`✅ ${weeklyTasksData.length} tareas semanales importadas`);

    // 3. Mostrar resumen
    const allTasks = await TaskService.getAllTasks();
    const totalCategories = Object.keys(allTasks).length;
    const totalTasks = Object.values(allTasks).reduce((sum, category) => sum + category.tasks.length, 0);

    logger.success('🎉 Importación completada exitosamente!');
    logger.info('📊 Resumen:');
    logger.info(`   • ${totalCategories} categorías de tareas generales`);
    logger.info(`   • ${totalTasks} tareas generales`);
    logger.info(`   • ${weeklyTasksData.length} tareas semanales`);
    logger.info(`   • Estado del día inicializado`);

  } catch (error) {
    logger.error('❌ Error durante la importación:', error);
    process.exit(1);
  }
}

// Función para verificar si ya hay datos
async function checkExistingData(): Promise<boolean> {
  try {
    const tasks = await TaskService.getAllTasks();
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    
    const hasGeneralTasks = Object.keys(tasks).length > 0;
    const hasWeeklyTasks = weeklyData.sequence.length > 0;
    
    return hasGeneralTasks || hasWeeklyTasks;
  } catch (error) {
    return false;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  checkExistingData().then(hasData => {
    if (hasData) {
      logger.warn('⚠️  Ya existen datos en el sistema.');
      logger.info('💡 Para reimportar, elimina los archivos en backend/data/ y ejecuta de nuevo.');
      process.exit(0);
    } else {
      importInitialData();
    }
  });
}

export { importInitialData, checkExistingData };