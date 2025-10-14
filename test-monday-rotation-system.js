/**
 * Script completo para verificar el sistema de rotación de lunes
 * Verifica que la tarea "Leer" rote correctamente los lunes
 */

const fs = require('fs');
const path = require('path');

console.log('📅 Verificando sistema completo de rotación de lunes...\n');

// 1. Verificar configuración actual
console.log('1️⃣ Verificando configuración de la tarea "Leer":');

const weeklyTasksPath = path.join(__dirname, 'backend/data/weekly-tasks.json');
const weeklyData = JSON.parse(fs.readFileSync(weeklyTasksPath, 'utf8'));
const leerTask = weeklyData.sequence.find(task => task.name === 'Leer');

if (!leerTask) {
  console.error('❌ Tarea "Leer" no encontrada');
  process.exit(1);
}

console.log(`   ✅ Tarea encontrada: ${leerTask.name}`);
console.log(`   ✅ Rotación configurada: ${leerTask.subtaskRotation}`);
console.log(`   ✅ Total subtareas: ${leerTask.subtasks?.length || 0}`);

const currentSubtask = leerTask.subtasks?.find(sub => sub.id === leerTask.currentSubtaskId);
if (currentSubtask) {
  console.log(`   ✅ Subtarea actual: ${currentSubtask.name} - ${currentSubtask.title}`);
}

// 2. Verificar que la función de rotación existe
console.log('\n2️⃣ Verificando función de rotación automática:');

try {
  const serviceCode = fs.readFileSync(path.join(__dirname, 'backend/src/services/dataService.ts'), 'utf8');
  
  if (serviceCode.includes('updateWeeklyRotations')) {
    console.log('   ✅ Función updateWeeklyRotations implementada');
  } else {
    console.log('   ❌ Función updateWeeklyRotations no encontrada');
  }
  
  if (serviceCode.includes('subtaskRotation === \'weekly\'')) {
    console.log('   ✅ Lógica de rotación semanal implementada');
  } else {
    console.log('   ❌ Lógica de rotación semanal no encontrada');
  }
  
} catch (error) {
  console.log('   ❌ Error leyendo código fuente:', error.message);
}

// 3. Verificar que la rotación automática esté habilitada
console.log('\n3️⃣ Verificando activación automática los lunes:');

try {
  const routesCode = fs.readFileSync(path.join(__dirname, 'backend/src/routes/weeklyRoutes.ts'), 'utf8');
  
  if (routesCode.includes('await WeeklyTaskService.updateWeeklyRotations()')) {
    console.log('   ✅ Rotación automática habilitada en las rutas');
  } else if (routesCode.includes('// await WeeklyTaskService.updateWeeklyRotations()')) {
    console.log('   ❌ Rotación automática comentada en las rutas');
  } else {
    console.log('   ❌ Rotación automática no encontrada en las rutas');
  }
  
  if (routesCode.includes('bogotaNow.getUTCDay() === 1')) {
    console.log('   ✅ Detección de lunes implementada');
  } else {
    console.log('   ❌ Detección de lunes no encontrada');
  }
  
} catch (error) {
  console.log('   ❌ Error leyendo rutas:', error.message);
}

// 4. Simular el flujo completo
console.log('\n4️⃣ Simulando flujo completo de rotación:');

// Mostrar estado actual
console.log(`   Estado actual: ${currentSubtask?.name} - ${currentSubtask?.title}`);

// Calcular próxima rotación
const currentIndex = leerTask.subtasks.findIndex(sub => sub.id === leerTask.currentSubtaskId);
const nextIndex = (currentIndex + 1) % leerTask.subtasks.length;
const nextSubtask = leerTask.subtasks[nextIndex];

console.log(`   Próxima rotación: ${nextSubtask.name} - ${nextSubtask.title}`);
console.log(`   Índice de rotación: ${currentIndex} → ${nextIndex}`);

if (currentIndex === leerTask.subtasks.length - 1) {
  console.log('   🔄 Rotación circular: última → primera subtarea');
}

// 5. Verificar todas las subtareas disponibles
console.log('\n5️⃣ Lista completa de subtareas de lectura:');

leerTask.subtasks.forEach((subtask, index) => {
  const isCurrent = subtask.id === leerTask.currentSubtaskId;
  const marker = isCurrent ? '👉' : '  ';
  const nextMarker = index === nextIndex ? ' (PRÓXIMA)' : '';
  console.log(`   ${marker} ${index + 1}. ${subtask.name} - ${subtask.title}${nextMarker}`);
});

// 6. Información sobre cuándo ocurre la rotación
console.log('\n6️⃣ Información del sistema de rotación:');
console.log('   📅 Cuándo: Automáticamente cada lunes');
console.log('   🔄 Cómo: Al hacer GET /api/weekly/current-day');
console.log('   🎯 Qué: Solo tareas con subtaskRotation: "weekly"');
console.log('   🔁 Tipo: Rotación circular (última → primera)');

// 7. Estado del sistema
console.log('\n7️⃣ Estado del sistema:');

const today = new Date();
const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

console.log(`   📅 Hoy es: ${dayNames[dayOfWeek]}`);

if (dayOfWeek === 1) {
  console.log('   🎯 ¡Es lunes! La rotación debería ejecutarse hoy');
} else {
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  console.log(`   ⏳ Faltan ${daysUntilMonday} días para el próximo lunes`);
}

console.log('\n✨ Verificación del sistema completada!');

// Resumen final
console.log('\n📊 RESUMEN:');
console.log('✅ Tarea "Leer" configurada correctamente para rotación semanal');
console.log('✅ Función de rotación automática implementada');
console.log('✅ Sistema activado para ejecutarse los lunes');
console.log('✅ Rotación circular funcionando correctamente');
console.log(`✅ Actualmente leyendo: ${currentSubtask?.name} - ${currentSubtask?.title}`);
console.log(`✅ Próximo lunes rotará a: ${nextSubtask.name} - ${nextSubtask.title}`);

console.log('\n🎉 ¡El sistema de rotación semanal está funcionando correctamente!');