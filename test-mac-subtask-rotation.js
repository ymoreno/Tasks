// Script para probar la rotación de subtareas de Mac
const axios = require('axios');

async function testMacSubtaskRotation() {
  try {
    console.log('🧪 Probando rotación de subtareas de Mac...\n');

    // 1. Obtener estado actual
    console.log('1️⃣ Obteniendo estado actual...');
    const currentResponse = await axios.get('http://localhost:3001/api/weekly/current-day');
    const dayState = currentResponse.data.data.dayState;
    const currentTask = currentResponse.data.data.currentTask;
    
    console.log(`- Tarea actual: ${currentTask?.name || 'N/A'}`);
    console.log(`- Timer estado: ${dayState?.timerState || 'N/A'}`);
    console.log(`- Timer segundos: ${dayState?.timerElapsedSeconds || 0}`);
    console.log(`- Tarea iniciada: ${currentTask?.isStarted || false}`);

    // 2. Obtener tareas semanales para ver la tarea Mac
    const tasksResponse = await axios.get('http://localhost:3001/api/weekly/tasks');
    const weeklyTasks = tasksResponse.data.data;
    const macTask = weeklyTasks.find(task => task.name === 'Mac');
    
    if (!macTask) {
      console.log('❌ Tarea Mac no encontrada');
      return;
    }

    console.log(`\n📋 Estado de la tarea Mac:`);
    console.log(`- Subtarea actual ID: ${macTask.currentSubtaskId}`);
    
    // Encontrar la subtarea actual
    const currentSubtask = macTask.subtasks.find(sub => sub.id === macTask.currentSubtaskId);
    const currentSubtaskIndex = macTask.subtasks.findIndex(sub => sub.id === macTask.currentSubtaskId);
    
    console.log(`- Nombre de subtarea actual: ${currentSubtask?.name || 'N/A'}`);
    console.log(`- Índice actual: ${currentSubtaskIndex}`);
    console.log(`- Total de subtareas: ${macTask.subtasks.length}`);

    // Mostrar todas las subtareas para referencia
    console.log('\n📋 Subtareas de Mac:');
    macTask.subtasks.forEach((sub, index) => {
      const marker = sub.id === macTask.currentSubtaskId ? '👉' : '  ';
      console.log(`${marker} ${index}: ${sub.name} (${sub.id})`);
    });

    // 3. Predecir la siguiente subtarea
    let expectedNextIndex;
    if (currentSubtaskIndex === macTask.subtasks.length - 1) {
      expectedNextIndex = 0; // Volver a Algoritmos
      console.log('\n📝 Predicción: Es la última subtarea, debería volver a Algoritmos (índice 0)');
    } else {
      expectedNextIndex = currentSubtaskIndex + 1;
      console.log(`\n📝 Predicción: Debería avanzar al índice ${expectedNextIndex} (${macTask.subtasks[expectedNextIndex]?.name})`);
    }

    // 4. Verificar si Mac es la tarea actual
    if (currentTask && currentTask.name === 'Mac') {
      console.log('\n🔄 La tarea Mac es la actual. Probando rotación de subtarea...');
      
      // Guardar estado del timer antes de la rotación
      const timerStateBefore = dayState.timerState;
      const timerSecondsBefore = dayState.timerElapsedSeconds || 0;
      
      console.log(`⏱️ Estado del timer antes: ${timerStateBefore} (${timerSecondsBefore}s)`);
      
      if (timerStateBefore !== 'running') {
        console.log('⚠️ NOTA: El timer no está corriendo. Para una prueba completa, inicia el timer primero.');
      }
      
      try {
        const completeResponse = await axios.post('http://localhost:3001/api/weekly/complete-subtask');
        console.log(`✅ Respuesta: ${completeResponse.data.message}`);
        
        // Verificar el estado después de la rotación
        const afterResponse = await axios.get('http://localhost:3001/api/weekly/current-day');
        const afterDayState = afterResponse.data.data.dayState;
        const afterCurrentTask = afterResponse.data.data.currentTask;
        
        console.log('\n📊 Estado después de la rotación:');
        console.log(`- Timer estado: ${afterDayState?.timerState || 'N/A'}`);
        console.log(`- Timer segundos: ${afterDayState?.timerElapsedSeconds || 0}`);
        console.log(`- Tarea iniciada: ${afterCurrentTask?.isStarted || false}`);
        
        // Verificar que el timer se mantuvo
        const timerStateAfter = afterDayState.timerState;
        const timerSecondsAfter = afterDayState.timerElapsedSeconds || 0;
        
        if (timerStateAfter === timerStateBefore && timerSecondsAfter === timerSecondsBefore) {
          console.log('✅ Timer mantenido correctamente');
        } else {
          console.log('❌ Timer no se mantuvo:');
          console.log(`   Antes: ${timerStateBefore} (${timerSecondsBefore}s)`);
          console.log(`   Después: ${timerStateAfter} (${timerSecondsAfter}s)`);
          
          // Análisis detallado del problema
          if (timerStateAfter !== timerStateBefore) {
            console.log(`   🔍 Estado del timer cambió: ${timerStateBefore} → ${timerStateAfter}`);
          }
          if (timerSecondsAfter !== timerSecondsBefore) {
            console.log(`   🔍 Segundos del timer cambiaron: ${timerSecondsBefore} → ${timerSecondsAfter}`);
            if (timerSecondsAfter === 0) {
              console.log('   ⚠️ El timer se reinició a 0 segundos');
            }
          }
        }
        
        // Verificar que el estado isStarted se mantuvo
        const wasStartedBefore = currentTask?.isStarted || false;
        const isStartedAfter = afterCurrentTask?.isStarted || false;
        
        if (wasStartedBefore && isStartedAfter) {
          console.log('✅ Estado isStarted mantenido correctamente');
        } else if (wasStartedBefore && !isStartedAfter) {
          console.log('❌ Estado isStarted se perdió:');
          console.log(`   Antes: ${wasStartedBefore}, Después: ${isStartedAfter}`);
          console.log('   🔍 La tarea volverá a mostrar "Empezar Tarea"');
          console.log('   ⚠️ Esto causará que el frontend llame automáticamente a start-task');
        } else if (!wasStartedBefore) {
          console.log('⚠️ La tarea no estaba iniciada antes de la rotación');
          console.log('   💡 Para una prueba completa, inicia la tarea Mac primero');
        }
        
        // Verificar la rotación de subtarea
        if (afterCurrentTask && afterCurrentTask.name === 'Mac') {
          const newCurrentSubtask = afterCurrentTask.subtasks.find(sub => sub.id === afterCurrentTask.currentSubtaskId);
          const newCurrentIndex = afterCurrentTask.subtasks.findIndex(sub => sub.id === afterCurrentTask.currentSubtaskId);
          
          console.log(`\n📋 Nueva subtarea de Mac:`);
          console.log(`- Nueva subtarea: ${newCurrentSubtask?.name || 'N/A'}`);
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
          
          // Mostrar el nuevo estado de las subtareas
          console.log('\n📋 Estado actualizado de subtareas:');
          afterCurrentTask.subtasks.forEach((sub, index) => {
            const marker = sub.id === afterCurrentTask.currentSubtaskId ? '👉' : '  ';
            console.log(`${marker} ${index}: ${sub.name} (${sub.id})`);
          });
        } else {
          console.log('❌ Error: La tarea actual ya no es Mac después de la rotación');
        }
        
      } catch (error) {
        console.log(`❌ Error completando subtarea: ${error.message}`);
        if (error.response) {
          console.log('📄 Respuesta del servidor:', error.response.data);
        }
      }
    } else {
      console.log('\n💡 La tarea Mac no es la actual.');
      console.log(`   Tarea actual: ${currentTask?.name || 'N/A'}`);
      console.log('   Para probar la rotación, primero debes estar en la tarea Mac.');
      
      // Mostrar cómo llegar a la tarea Mac
      const macTaskIndex = weeklyTasks.findIndex(task => task.name === 'Mac');
      if (macTaskIndex !== -1) {
        console.log(`   Índice de tarea Mac: ${macTaskIndex}`);
        console.log(`   Índice actual: ${dayState?.currentTaskIndex || 'N/A'}`);
      }
    }

    console.log('\n✅ Prueba de rotación de subtareas Mac completada');

  } catch (error) {
    console.error('❌ Error probando rotación de subtareas Mac:', error.message);
    if (error.response) {
      console.log('📄 Respuesta del servidor:', error.response.data);
    }
  }
}

testMacSubtaskRotation();