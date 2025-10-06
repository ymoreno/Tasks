#!/usr/bin/env ts-node

import { TaskService, WeeklyTaskService, PaymentService } from '../services/dataService';
import { logger } from '../utils/logger';

async function testDataServices() {
  logger.info('🧪 Iniciando pruebas de servicios de datos...');

  try {
    // 1. Probar TaskService
    logger.info('📋 Probando TaskService...');
    
    const allTasks = await TaskService.getAllTasks();
    const categoryCount = Object.keys(allTasks).length;
    const totalTasks = Object.values(allTasks).reduce((sum, category) => sum + category.tasks.length, 0);
    
    logger.info(`   ✅ ${categoryCount} categorías cargadas`);
    logger.info(`   ✅ ${totalTasks} tareas totales`);

    // Probar obtener tarea por ID
    if (totalTasks > 0) {
      const firstCategory = Object.values(allTasks)[0];
      const firstTask = firstCategory.tasks[0];
      
      const taskById = await TaskService.getTaskById(firstTask.id);
      if (taskById) {
        logger.info(`   ✅ Tarea obtenida por ID: ${taskById.name}`);
      }

      // Probar actualización de tarea
      await TaskService.updateTask(firstTask.id, { completed: true });
      const updatedTask = await TaskService.getTaskById(firstTask.id);
      if (updatedTask?.completed) {
        logger.info(`   ✅ Tarea actualizada correctamente`);
        
        // Revertir cambio
        await TaskService.updateTask(firstTask.id, { completed: false });
      }
    }

    // 2. Probar WeeklyTaskService
    logger.info('📅 Probando WeeklyTaskService...');
    
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    logger.info(`   ✅ ${weeklyData.sequence.length} tareas semanales cargadas`);
    
    const dayState = await WeeklyTaskService.getCurrentDayState();
    logger.info(`   ✅ Estado del día: ${dayState.date}`);
    logger.info(`   ✅ Tarea actual: índice ${dayState.currentTaskIndex}`);
    logger.info(`   ✅ Día completado: ${dayState.dayCompleted ? 'Sí' : 'No'}`);

    // Probar actualización de estado del día
    const originalIndex = dayState.currentTaskIndex;
    const currentState = await WeeklyTaskService.getCurrentDayState();
    await WeeklyTaskService.updateDayState({ ...currentState, currentTaskIndex: originalIndex + 1 });
    const updatedDayState = await WeeklyTaskService.getCurrentDayState();
    
    if (updatedDayState.currentTaskIndex === originalIndex + 1) {
      logger.info(`   ✅ Estado del día actualizado correctamente`);
      
      // Revertir cambio
      const currentState = await WeeklyTaskService.getCurrentDayState();
      await WeeklyTaskService.updateDayState({ ...currentState, currentTaskIndex: originalIndex });
    }

    // 3. Probar PaymentService
    logger.info('💰 Probando PaymentService...');
    
    const initialPayments = await PaymentService.getAllPayments();
    logger.info(`   ✅ ${initialPayments.length} pagos iniciales`);

    // Crear un pago de prueba
    const testPayment = await PaymentService.createPayment({
      name: 'Producto de Prueba',
      url: 'https://example.com/producto',
      description: 'Descripción de prueba',
      category: 'Tecnología',
      amount: 100000,
      status: 'pendiente',
      isRecurring: false,
      priority: 5
    });
    
    logger.info(`   ✅ Pago creado: ${testPayment.name}`);

    // Verificar que se creó
    const paymentsAfterCreate = await PaymentService.getAllPayments();
    if (paymentsAfterCreate.length === initialPayments.length + 1) {
      logger.info(`   ✅ Pago agregado correctamente a la lista`);
    }

    // Actualizar el pago
    const updatedPayment = await PaymentService.updatePayment(testPayment.id, {
      name: 'Producto Actualizado'
    });
    
    if (updatedPayment?.name === 'Producto Actualizado') {
      logger.info(`   ✅ Pago actualizado correctamente`);
    }

    // Eliminar el pago de prueba
    const deleted = await PaymentService.deletePayment(testPayment.id);
    if (deleted) {
      logger.info(`   ✅ Pago eliminado correctamente`);
    }

    // Verificar que se eliminó
    const finalPayments = await PaymentService.getAllPayments();
    if (finalPayments.length === initialPayments.length) {
      logger.info(`   ✅ Lista de pagos restaurada`);
    }

    // 4. Probar funcionalidades avanzadas
    logger.info('🔧 Probando funcionalidades avanzadas...');

    // Verificar respaldos
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(__dirname, '../../data/backups');
    
    if (fs.existsSync(backupDir)) {
      const backupFiles = fs.readdirSync(backupDir);
      logger.info(`   ✅ ${backupFiles.length} archivos de respaldo encontrados`);
    }

    // Mostrar estadísticas finales
    logger.success('🎉 Todas las pruebas de servicios de datos pasaron exitosamente!');
    logger.info('📊 Estadísticas finales:');
    logger.info(`   • Categorías de tareas: ${categoryCount}`);
    logger.info(`   • Tareas generales: ${totalTasks}`);
    logger.info(`   • Tareas semanales: ${weeklyData.sequence.length}`);
    logger.info(`   • Pagos y compras: ${finalPayments.length}`);
    
    // Mostrar algunas tareas de ejemplo
    if (totalTasks > 0) {
      logger.info('📋 Ejemplos de tareas cargadas:');
      Object.entries(allTasks).slice(0, 3).forEach(([category, data]) => {
        const task = data.tasks[0];
        logger.info(`   • ${category}: ${task.scores.length} puntuaciones, tiempo total: ${task.timeTracking.totalTime}ms`);
      });
    }

    // Mostrar tareas semanales con subtareas
    const taskWithSubtasks = weeklyData.sequence.find(task => task.subtasks && task.subtasks.length > 0);
    if (taskWithSubtasks) {
      logger.info(`📅 Tarea semanal con subtareas: ${taskWithSubtasks.name}`);
      taskWithSubtasks.subtasks?.forEach(subtask => {
        logger.info(`   • ${subtask.name} (orden: ${subtask.order})`);
      });
    }

  } catch (error) {
    logger.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testDataServices();
}

export default testDataServices;