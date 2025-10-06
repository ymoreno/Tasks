// Script para probar la nueva lógica de completar tarea Mac
const axios = require('axios');

async function testMacCompletion() {
  try {
    console.log('🧪 Probando nueva lógica de completar tarea Mac...\n');
    
    // Obtener estado actual
    console.log('📊 Obteniendo estado actual...');
    const currentResponse = await axios.get('http://localhost:3001/api/weekly/current-day');
    const dayState = currentResponse.data.data;
    
    if (!dayState) {
      console.log('❌ No hay estado del día disponible');
      return;
    }
    
    console.log(`- Tarea actual: ${dayState.currentTaskIndex}`);
    console.log(`- Día completado: ${dayState.dayCompleted}`);
    
    // Obtener tareas semanales para ver la tarea Mac
    const tasksResponse = await axios.get('http://localhost:3001/api/weekly/tasks');
    const weeklyTasks = tasksResponse.data.data;
    const macTask = weeklyTasks.find(task => task.name === 'Mac');
    
    if (!macTask) {
      console.log('❌ Tarea Mac no encontrada');
      return;
    }
    
    console.log(`- Subtarea actual de Mac: ${macTask.currentSubtaskId}`);
    
    // Encontrar la subtarea actual
    const currentSubtask = macTask.subtasks.find(sub => sub.id === macTask.currentSubtaskId);
    const currentSubtaskIndex = macTask.subtasks.findIndex(sub => sub.id === macTask.currentSubtaskId);
    
    console.log(`- Nombre de subtarea actual: ${currentSubtask?.name || 'N/A'}`);
    console.log(`- Índice de subtarea actual: ${currentSubtaskIndex}`);
    console.log(`- Total de subtareas: ${macTask.subtasks.length}`);
    
    // Mostrar todas las subtareas para referencia
    console.log('\n📋 Subtareas de Mac:');
    macTask.subtasks.forEach((sub, index) => {
      const marker = sub.id === macTask.currentSubtaskId ? '👉' : '  ';
      console.log(`${marker} ${index}: ${sub.name} (${sub.id})`);
    });
    
    // Verificar si Mac es la tarea actual
    const currentTaskInSequence = weeklyTasks[dayState.currentTaskIndex];
    if (currentTaskInSequence && currentTaskInSequence.name === 'Mac') {
      console.log('\n🔄 La tarea Mac es la actual. Probando completar...');
      
      // Predecir cuál debería ser la siguiente subtarea
      let expectedNextIndex;
      if (currentSubtaskIndex === macTask.subtasks.length - 1) {
        expectedNextIndex = 0; // Volver a Algoritmos
        console.log('📝 Predicción: Era la última subtarea, debería volver a Algoritmos (índice 0)');
      } else {
        expectedNextIndex = currentSubtaskIndex + 1;
        console.log(`📝 Predicción: Debería avanzar al índice ${expectedNextIndex} (${macTask.subtasks[expectedNextIndex]?.name})`);
      }
      
      try {
        const completeResponse = await axios.post('http://localhost:3001/api/weekly/complete-task');
        console.log(`✅ Respuesta: ${completeResponse.data.message}`);
        
        // Verificar el estado después
        const afterResponse = await axios.get('http://localhost:3001/api/weekly/tasks');
        const afterMacTask = afterResponse.data.data.find(task => task.name === 'Mac');
        
        if (afterMacTask) {
          const newCurrentSubtask = afterMacTask.subtasks.find(sub => sub.id === afterMacTask.currentSubtaskId);
          const newCurrentIndex = afterMacTask.subtasks.findIndex(sub => sub.id === afterMacTask.currentSubtaskId);
          
          console.log(`\n📊 Estado después de completar:`);
          console.log(`- Nueva subtarea actual: ${newCurrentSubtask?.name || 'N/A'}`);
          console.log(`- Nuevo índice: ${newCurrentIndex}`);
          
          // Verificar si la rotación fue correcta
          if (newCurrentIndex === expectedNextIndex) {
            console.log('✅ ¡Rotación correcta!');
            if (expectedNextIndex === 0) {
              console.log('✅ Volvió correctamente a Algoritmos');
            } else {
              console.log('✅ Avanzó correctamente a la siguiente subtarea');
            }
          } else {
            console.log('❌ Error: La rotación no fue la esperada');
            console.log(`   Esperado: ${expectedNextIndex}, Actual: ${newCurrentIndex}`);
          }
        }
        
        // Verificar que la tarea Mac se completó
        const afterDayState = await axios.get('http://localhost:3001/api/weekly/current-day');
        const newDayState = afterDayState.data.data;
        
        if (newDayState.currentTaskIndex > dayState.currentTaskIndex) {
          console.log('✅ La tarea Mac se completó correctamente (avanzó a la siguiente tarea)');
        } else {
          console.log('❌ Error: La tarea Mac no se completó (no avanzó a la siguiente tarea)');
        }
        
      } catch (error) {
        console.log(`❌ Error completando tarea: ${error.message}`);
        if (error.response) {
          console.log('📄 Respuesta del servidor:', error.response.data);
        }
      }
    } else {
      console.log('\n💡 La tarea Mac no es la actual. Para probar, cambia manualmente el currentTaskIndex.');
      console.log(`   Tarea actual: ${currentTaskInSequence?.name || 'N/A'} (índice ${dayState.currentTaskIndex})`);
      
      // Buscar el índice de la tarea Mac
      const macTaskIndex = weeklyTasks.findIndex(task => task.name === 'Mac');
      if (macTaskIndex !== -1) {
        console.log(`   Índice de tarea Mac: ${macTaskIndex}`);
        console.log(`   Para probar, puedes cambiar currentTaskIndex a ${macTaskIndex} en el estado del día`);
      }
    }
    
    console.log('\n✅ Prueba de completar tarea Mac finalizada');
    
  } catch (error) {
    console.error('❌ Error probando completar tarea Mac:', error.message);
    if (error.response) {
      console.log('📄 Respuesta del servidor:', error.response.data);
    }
  }
}

testMacCompletion();