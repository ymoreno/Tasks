/**
 * Script de prueba para verificar la rotación semanal de subtareas
 * Específicamente para la tarea "Leer" que debe rotar los lunes
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Probando rotación semanal de subtareas...\n');

// Leer el archivo de tareas semanales
const weeklyTasksPath = path.join(__dirname, 'backend/data/weekly-tasks.json');

if (!fs.existsSync(weeklyTasksPath)) {
  console.error('❌ Archivo de tareas semanales no encontrado');
  process.exit(1);
}

const weeklyData = JSON.parse(fs.readFileSync(weeklyTasksPath, 'utf8'));

console.log('📋 Estado actual de tareas con rotación semanal:');

// Buscar tareas con rotación semanal
const weeklyRotationTasks = weeklyData.sequence.filter(task => task.subtaskRotation === 'weekly');

if (weeklyRotationTasks.length === 0) {
  console.log('⚠️ No se encontraron tareas con rotación semanal');
  process.exit(0);
}

weeklyRotationTasks.forEach(task => {
  console.log(`\n📚 Tarea: ${task.name}`);
  console.log(`   Rotación: ${task.subtaskRotation}`);
  console.log(`   Subtarea actual ID: ${task.currentSubtaskId}`);
  
  if (task.subtasks) {
    const currentSubtask = task.subtasks.find(sub => sub.id === task.currentSubtaskId);
    if (currentSubtask) {
      console.log(`   Subtarea actual: ${currentSubtask.name}`);
      if (currentSubtask.title) {
        console.log(`   Título actual: ${currentSubtask.title}`);
      }
    }
    
    console.log(`   Total subtareas: ${task.subtasks.length}`);
    console.log('   Lista de subtareas:');
    task.subtasks.forEach((subtask, index) => {
      const isCurrent = subtask.id === task.currentSubtaskId;
      const marker = isCurrent ? '👉' : '  ';
      console.log(`   ${marker} ${index + 1}. ${subtask.name}${subtask.title ? ` - ${subtask.title}` : ''}`);
    });
  }
});

// Simular rotación
console.log('\n🔄 Simulando rotación semanal...\n');

weeklyRotationTasks.forEach(task => {
  if (task.subtasks && task.subtasks.length > 0) {
    const currentIndex = task.subtasks.findIndex(sub => sub.id === task.currentSubtaskId);
    
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % task.subtasks.length;
      const currentSubtask = task.subtasks[currentIndex];
      const nextSubtask = task.subtasks[nextIndex];
      
      console.log(`📚 ${task.name}:`);
      console.log(`   Actual: ${currentSubtask.name}${currentSubtask.title ? ` - ${currentSubtask.title}` : ''}`);
      console.log(`   Siguiente: ${nextSubtask.name}${nextSubtask.title ? ` - ${nextSubtask.title}` : ''}`);
      console.log(`   Índice: ${currentIndex} → ${nextIndex}`);
      
      // Verificar si es rotación circular
      if (currentIndex === task.subtasks.length - 1) {
        console.log('   🔄 Rotación circular: última → primera');
      }
    }
  }
});

// Verificar específicamente la tarea "Leer"
console.log('\n🔍 Verificación específica de la tarea "Leer":');

const leerTask = weeklyData.sequence.find(task => task.name === 'Leer');

if (leerTask) {
  console.log('✅ Tarea "Leer" encontrada');
  console.log(`   Configuración de rotación: ${leerTask.subtaskRotation}`);
  console.log(`   Subtarea actual: ${leerTask.currentSubtaskId}`);
  
  if (leerTask.subtaskRotation === 'weekly') {
    console.log('✅ Configurada para rotación semanal');
    
    const currentSubtask = leerTask.subtasks?.find(sub => sub.id === leerTask.currentSubtaskId);
    if (currentSubtask) {
      console.log(`   Leyendo actualmente: ${currentSubtask.name} - ${currentSubtask.title || 'Sin título'}`);
      
      // Mostrar qué sería lo siguiente
      const currentIndex = leerTask.subtasks.findIndex(sub => sub.id === leerTask.currentSubtaskId);
      const nextIndex = (currentIndex + 1) % leerTask.subtasks.length;
      const nextSubtask = leerTask.subtasks[nextIndex];
      
      console.log(`   Próximo lunes rotará a: ${nextSubtask.name} - ${nextSubtask.title || 'Sin título'}`);
    }
  } else {
    console.log(`❌ NO configurada para rotación semanal (actual: ${leerTask.subtaskRotation})`);
  }
} else {
  console.log('❌ Tarea "Leer" no encontrada');
}

console.log('\n📅 Información sobre cuándo ocurre la rotación:');
console.log('   - La rotación semanal ocurre automáticamente los lunes');
console.log('   - Se ejecuta cuando se hace una petición GET a /api/weekly/current-day');
console.log('   - Solo afecta tareas con subtaskRotation: "weekly"');

console.log('\n✨ Prueba completada!');