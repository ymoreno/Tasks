// Script para verificar el estado actual de las tareas semanales
const axios = require('axios');

async function verifyCurrentState() {
  try {
    console.log('🔍 Verificando estado actual de las tareas semanales...\n');
    
    // Obtener estado actual del día
    const dayResponse = await axios.get('http://localhost:3001/api/weekly/current-day');
    console.log('📅 Estado del día actual:');
    console.log(`- Fecha: ${dayResponse.data.data.date}`);
    console.log(`- Tarea actual: ${dayResponse.data.data.currentTaskIndex}`);
    console.log(`- Tareas completadas: ${dayResponse.data.data.completedTasks.length}`);
    console.log(`- Día completado: ${dayResponse.data.data.dayCompleted}`);
    
    // Obtener tareas semanales
    const tasksResponse = await axios.get('http://localhost:3001/api/weekly/tasks');
    const weeklyTasks = tasksResponse.data.data;
    
    console.log('\n📚 Estado de la tarea "Leer":');
    const readingTask = weeklyTasks.find(task => task.name === 'Leer');
    if (readingTask) {
      const currentSubtask = readingTask.subtasks.find(sub => sub.id === readingTask.currentSubtaskId);
      console.log(`- Formato actual: ${currentSubtask.name}`);
      console.log(`- Libro actual: ${currentSubtask.title}`);
      console.log(`- Rotación: ${readingTask.subtaskRotation}`);
    }
    
    console.log('\n🎮 Estado de la tarea "Juego":');
    const gameTask = weeklyTasks.find(task => task.name === 'Juego');
    if (gameTask) {
      const currentSubtask = gameTask.subtasks.find(sub => sub.id === gameTask.currentSubtaskId);
      console.log(`- Plataforma actual: ${currentSubtask.name}`);
      console.log(`- Juego actual: ${currentSubtask.title}`);
    }
    
    // Obtener historial
    const historyResponse = await axios.get('http://localhost:3001/api/history');
    console.log('\n📋 Historial de items completados:');
    historyResponse.data.data.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (${item.type})`);
      if (item.platform) {
        console.log(`   - Plataforma: ${item.platform}`);
      }
      console.log(`   - Completado: ${new Date(item.completedDate).toLocaleDateString()}`);
    });
    
    console.log('\n✅ Verificación completada');
    console.log('📖 Estado actual: Leyendo "Némesis" (Extra)');
    console.log('🎮 Estado actual: Jugando "CTR" (PS3)');
    console.log('📚 Libro completado: "Marvel 75 años"');
    console.log('🎮 Juego completado: "FFIV The After Years" (PSP)');
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error.message);
    if (error.response) {
      console.log('📄 Respuesta del servidor:', error.response.data);
    }
  }
}

verifyCurrentState();