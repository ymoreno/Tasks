/**
 * Script para verificar que la tarea "Leer" esté configurada correctamente en "Fisico"
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando ajuste de la tarea "Leer"...\n');

// Leer el archivo de tareas semanales
const weeklyTasksPath = path.join(__dirname, 'backend/data/weekly-tasks.json');
const weeklyData = JSON.parse(fs.readFileSync(weeklyTasksPath, 'utf8'));

// Encontrar la tarea "Leer"
const leerTask = weeklyData.sequence.find(task => task.name === 'Leer');

if (!leerTask) {
  console.error('❌ Tarea "Leer" no encontrada');
  process.exit(1);
}

console.log('📚 Estado actual de la tarea "Leer":');
console.log(`   Subtarea actual ID: ${leerTask.currentSubtaskId}`);

// Encontrar la subtarea actual
const currentSubtask = leerTask.subtasks.find(sub => sub.id === leerTask.currentSubtaskId);

if (currentSubtask) {
  console.log(`   Subtarea actual: ${currentSubtask.name}`);
  console.log(`   Título actual: ${currentSubtask.title}`);
  
  if (currentSubtask.name === 'Fisico') {
    console.log('✅ ¡Correcto! La tarea está configurada en "Fisico"');
    console.log(`   Libro: ${currentSubtask.title}`);
  } else {
    console.log(`❌ Error: La tarea está en "${currentSubtask.name}" en lugar de "Fisico"`);
  }
} else {
  console.log('❌ Error: No se pudo encontrar la subtarea actual');
}

// Mostrar la secuencia de rotación
console.log('\n🔄 Secuencia de rotación semanal:');
leerTask.subtasks.forEach((subtask, index) => {
  const isCurrent = subtask.id === leerTask.currentSubtaskId;
  const marker = isCurrent ? '👉' : '  ';
  console.log(`   ${marker} ${index + 1}. ${subtask.name} - ${subtask.title}`);
});

// Calcular próxima rotación
const currentIndex = leerTask.subtasks.findIndex(sub => sub.id === leerTask.currentSubtaskId);
const nextIndex = (currentIndex + 1) % leerTask.subtasks.length;
const nextSubtask = leerTask.subtasks[nextIndex];

console.log('\n📅 Próxima rotación (siguiente lunes):');
console.log(`   ${currentSubtask?.name} → ${nextSubtask.name}`);
console.log(`   ${currentSubtask?.title} → ${nextSubtask.title}`);

console.log('\n✨ Verificación completada!');