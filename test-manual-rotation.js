/**
 * Script para probar manualmente la rotación semanal
 * Simula lo que pasaría un lunes cuando se ejecute la rotación automática
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Probando rotación manual de la tarea "Leer"...\n');

// Leer el archivo de tareas semanales
const weeklyTasksPath = path.join(__dirname, 'backend/data/weekly-tasks.json');
const weeklyData = JSON.parse(fs.readFileSync(weeklyTasksPath, 'utf8'));

// Encontrar la tarea "Leer"
const leerTask = weeklyData.sequence.find(task => task.name === 'Leer');

if (!leerTask) {
  console.error('❌ Tarea "Leer" no encontrada');
  process.exit(1);
}

console.log('📚 Estado ANTES de la rotación:');
const currentSubtaskBefore = leerTask.subtasks.find(sub => sub.id === leerTask.currentSubtaskId);
console.log(`   Subtarea actual: ${currentSubtaskBefore.name} - ${currentSubtaskBefore.title}`);

// Simular la rotación
const currentIndex = leerTask.subtasks.findIndex(sub => sub.id === leerTask.currentSubtaskId);
const nextIndex = (currentIndex + 1) % leerTask.subtasks.length;
const nextSubtask = leerTask.subtasks[nextIndex];

// Aplicar la rotación
leerTask.currentSubtaskId = nextSubtask.id;

console.log('\n🔄 Aplicando rotación...');
console.log(`   Índice: ${currentIndex} → ${nextIndex}`);
console.log(`   Cambio: ${currentSubtaskBefore.name} → ${nextSubtask.name}`);

console.log('\n📚 Estado DESPUÉS de la rotación:');
const currentSubtaskAfter = leerTask.subtasks.find(sub => sub.id === leerTask.currentSubtaskId);
console.log(`   Nueva subtarea actual: ${currentSubtaskAfter.name} - ${currentSubtaskAfter.title}`);

// Crear backup del archivo original
const backupPath = weeklyTasksPath + '.backup-' + Date.now();
fs.copyFileSync(weeklyTasksPath, backupPath);
console.log(`\n💾 Backup creado: ${path.basename(backupPath)}`);

// Guardar los cambios
fs.writeFileSync(weeklyTasksPath, JSON.stringify(weeklyData, null, 2));
console.log('✅ Cambios guardados en weekly-tasks.json');

console.log('\n🎯 Rotación completada exitosamente!');
console.log(`   La tarea "Leer" ahora está en: ${currentSubtaskAfter.name} - ${currentSubtaskAfter.title}`);

// Mostrar la próxima rotación
const newCurrentIndex = leerTask.subtasks.findIndex(sub => sub.id === leerTask.currentSubtaskId);
const nextNextIndex = (newCurrentIndex + 1) % leerTask.subtasks.length;
const nextNextSubtask = leerTask.subtasks[nextNextIndex];

console.log(`\n📅 Próxima rotación (siguiente lunes):`);
console.log(`   ${currentSubtaskAfter.name} → ${nextNextSubtask.name} - ${nextNextSubtask.title}`);

console.log('\n📝 Nota: Para restaurar el estado anterior, usa:');
console.log(`   cp ${path.basename(backupPath)} weekly-tasks.json`);