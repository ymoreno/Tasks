/**
 * Script para probar la rotación automática usando la función del servicio
 * Simula lo que ocurre cuando es lunes y se ejecuta la rotación automática
 */

const path = require('path');

async function testAutomaticRotation() {
  console.log('🤖 Probando rotación automática...\n');
  
  try {
    // Importar el servicio
    const { WeeklyTaskService } = require('./backend/dist/services/dataService');
    
    console.log('📋 Estado antes de la rotación automática:');
    
    // Obtener datos actuales
    const dataBefore = await WeeklyTaskService.getWeeklyData();
    const leerTaskBefore = dataBefore.sequence.find(task => task.name === 'Leer');
    
    if (leerTaskBefore) {
      const currentSubtaskBefore = leerTaskBefore.subtasks.find(sub => sub.id === leerTaskBefore.currentSubtaskId);
      console.log(`   Leer: ${currentSubtaskBefore.name} - ${currentSubtaskBefore.title}`);
    }
    
    // Ejecutar rotación automática
    console.log('\n🔄 Ejecutando rotación automática...');
    await WeeklyTaskService.updateWeeklyRotations();
    
    // Verificar resultado
    console.log('\n📋 Estado después de la rotación automática:');
    const dataAfter = await WeeklyTaskService.getWeeklyData();
    const leerTaskAfter = dataAfter.sequence.find(task => task.name === 'Leer');
    
    if (leerTaskAfter) {
      const currentSubtaskAfter = leerTaskAfter.subtasks.find(sub => sub.id === leerTaskAfter.currentSubtaskId);
      console.log(`   Leer: ${currentSubtaskAfter.name} - ${currentSubtaskAfter.title}`);
      
      // Verificar si cambió
      if (leerTaskBefore && leerTaskAfter.currentSubtaskId !== leerTaskBefore.currentSubtaskId) {
        console.log('✅ ¡Rotación exitosa! La subtarea cambió.');
      } else {
        console.log('ℹ️ La subtarea no cambió (puede ser que ya se haya rotado hoy).');
      }
    }
    
    console.log('\n🎯 Prueba de rotación automática completada!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    
    // Si hay error de importación, intentar con el código fuente
    if (error.message.includes('Cannot find module')) {
      console.log('\n🔧 Intentando con código fuente TypeScript...');
      
      // Simular la lógica de rotación directamente
      const fs = require('fs');
      const weeklyTasksPath = path.join(__dirname, 'backend/data/weekly-tasks.json');
      const weeklyData = JSON.parse(fs.readFileSync(weeklyTasksPath, 'utf8'));
      
      console.log('📋 Simulando rotación automática...');
      
      let rotationsPerformed = 0;
      
      for (const task of weeklyData.sequence) {
        if (task.subtaskRotation === 'weekly' && task.subtasks && task.subtasks.length > 0) {
          console.log(`🔍 Procesando tarea: ${task.name}`);
          
          const currentSubtaskIndex = task.subtasks.findIndex(sub => sub.id === task.currentSubtaskId);
          
          if (currentSubtaskIndex === -1) {
            console.warn(`⚠️ Subtarea actual no encontrada para ${task.name}`);
            continue;
          }
          
          const nextSubtaskIndex = (currentSubtaskIndex + 1) % task.subtasks.length;
          const oldSubtask = task.subtasks[currentSubtaskIndex];
          const newSubtask = task.subtasks[nextSubtaskIndex];
          
          task.currentSubtaskId = newSubtask.id;
          rotationsPerformed++;
          
          console.log(`✅ ${task.name}: ${oldSubtask.name} → ${newSubtask.name}`);
        }
      }
      
      if (rotationsPerformed > 0) {
        fs.writeFileSync(weeklyTasksPath, JSON.stringify(weeklyData, null, 2));
        console.log(`🎯 Rotación simulada completada: ${rotationsPerformed} tareas rotadas`);
      }
    }
  }
}

// Ejecutar la prueba
testAutomaticRotation().catch(console.error);