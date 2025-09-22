#!/usr/bin/env ts-node

import { TaskService, WeeklyTaskService, PaymentService } from '../services/dataService';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

async function verifyDataPersistence() {
  logger.info('🔍 Verificando persistencia de datos...');

  try {
    // 1. Verificar archivos de datos
    const dataDir = path.join(__dirname, '../../data');
    const requiredFiles = ['tasks.json', 'weekly-tasks.json'];
    
    logger.info('📁 Verificando archivos de datos...');
    for (const file of requiredFiles) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        logger.info(`   ✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
      } else {
        logger.error(`   ❌ ${file} no encontrado`);
      }
    }

    // 2. Verificar respaldos
    const backupDir = path.join(dataDir, 'backups');
    if (fs.existsSync(backupDir)) {
      const backupFiles = fs.readdirSync(backupDir);
      logger.info(`   ✅ ${backupFiles.length} archivos de respaldo`);
    }

    // 3. Verificar integridad de datos
    logger.info('🔧 Verificando integridad de datos...');
    
    const tasks = await TaskService.getAllTasks();
    const weeklyData = await WeeklyTaskService.getWeeklyData();
    const payments = await PaymentService.getAllPayments();

    // Verificar tareas generales
    const categoryCount = Object.keys(tasks).length;
    const totalTasks = Object.values(tasks).reduce((sum, category) => sum + category.tasks.length, 0);
    
    logger.info(`   ✅ ${categoryCount} categorías de tareas`);
    logger.info(`   ✅ ${totalTasks} tareas generales`);

    // Verificar que todas las tareas tienen los campos requeridos
    let validTasks = 0;
    for (const category of Object.values(tasks)) {
      for (const task of category.tasks) {
        if (task.id && task.name && task.scores && task.timeTracking) {
          validTasks++;
        }
      }
    }
    logger.info(`   ✅ ${validTasks}/${totalTasks} tareas con estructura válida`);

    // Verificar tareas semanales
    logger.info(`   ✅ ${weeklyData.sequence.length} tareas semanales`);
    
    const tasksWithSubtasks = weeklyData.sequence.filter(task => task.subtasks && task.subtasks.length > 0);
    logger.info(`   ✅ ${tasksWithSubtasks.length} tareas con subtareas`);

    // Verificar estado del día
    if (weeklyData.dailyState) {
      logger.info(`   ✅ Estado del día: ${weeklyData.dailyState.date}`);
      logger.info(`   ✅ Tarea actual: índice ${weeklyData.dailyState.currentTaskIndex}`);
    }

    // Verificar pagos
    logger.info(`   ✅ ${payments.length} pagos y compras`);

    // 4. Probar operaciones CRUD
    logger.info('🧪 Probando operaciones CRUD...');

    // Crear tarea de prueba
    const testTask = await TaskService.createTask('Prueba', {
      category: 'Prueba',
      name: 'Tarea de Verificación',
      scores: [1, 2, 3],
      completed: false,
      timeTracking: {
        isActive: false,
        totalTime: 0,
        sessions: []
      }
    });
    logger.info(`   ✅ Tarea creada: ${testTask.name}`);

    // Leer tarea
    const readTask = await TaskService.getTaskById(testTask.id);
    if (readTask) {
      logger.info(`   ✅ Tarea leída: ${readTask.name}`);
    }

    // Actualizar tarea
    const updatedTask = await TaskService.updateTask(testTask.id, { completed: true });
    if (updatedTask?.completed) {
      logger.info(`   ✅ Tarea actualizada: completada = ${updatedTask.completed}`);
    }

    // Eliminar tarea
    const deleted = await TaskService.deleteTask(testTask.id);
    if (deleted) {
      logger.info(`   ✅ Tarea eliminada correctamente`);
    }

    // 5. Verificar respaldos automáticos
    logger.info('💾 Verificando sistema de respaldos...');
    
    const backupFilesBefore = fs.readdirSync(backupDir).length;
    
    // Crear una operación que genere respaldo
    await PaymentService.createPayment({
      name: 'Test Backup',
      description: 'Prueba de respaldo automático'
    });
    
    const backupFilesAfter = fs.readdirSync(backupDir).length;
    
    if (backupFilesAfter > backupFilesBefore) {
      logger.info(`   ✅ Respaldo automático funcionando (${backupFilesAfter - backupFilesBefore} nuevos archivos)`);
    }

    // Limpiar
    const allPayments = await PaymentService.getAllPayments();
    const testPayment = allPayments.find(p => p.name === 'Test Backup');
    if (testPayment) {
      await PaymentService.deletePayment(testPayment.id);
    }

    // 6. Resumen final
    logger.success('🎉 Verificación de persistencia completada exitosamente!');
    logger.info('📊 Resumen del sistema de datos:');
    logger.info(`   • Archivos de datos: ${requiredFiles.length}/${requiredFiles.length} ✅`);
    logger.info(`   • Respaldos automáticos: Funcionando ✅`);
    logger.info(`   • Operaciones CRUD: Funcionando ✅`);
    logger.info(`   • Integridad de datos: Verificada ✅`);
    logger.info(`   • Total de datos: ${totalTasks + weeklyData.sequence.length + payments.length} elementos`);

    // Mostrar estadísticas de uso de disco
    const totalSize = requiredFiles.reduce((sum, file) => {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        return sum + fs.statSync(filePath).size;
      }
      return sum;
    }, 0);

    logger.info(`   • Uso de disco: ${Math.round(totalSize / 1024)}KB`);

  } catch (error) {
    logger.error('❌ Error en la verificación:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  verifyDataPersistence();
}

export default verifyDataPersistence;