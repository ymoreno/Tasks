#!/usr/bin/env node

/**
 * Test script para verificar que la rotación de subtareas de Lista funciona correctamente.
 * La tarea Lista debería rotar sus subtareas tanto al iniciar como al completar (onStartOrCompletion).
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Colores para los logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n🔍 STEP ${step}: ${message}`, 'cyan');
  log('=' .repeat(60), 'cyan');
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ SUCCESS: ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function getCurrentDayState() {
  const response = await makeRequest('GET', '/weekly/current-day');
  return response.data;
}

async function startTask() {
  const response = await makeRequest('POST', '/weekly/start-task');
  return response.data;
}

async function completeTask() {
  const response = await makeRequest('POST', '/weekly/complete-task');
  return response.data;
}

async function testListaRotation() {
  try {
    log('🚀 INICIANDO TEST DE ROTACIÓN DE LISTA', 'bright');
    log('Este test verifica que Lista rote sus subtareas al iniciar y completar\n');

    // STEP 1: Verificar estado inicial
    logStep(1, 'Verificar que estamos en la tarea Lista');
    const initialState = await getCurrentDayState();
    
    if (!initialState.currentTask || initialState.currentTask.name !== 'Lista') {
      logError('La tarea actual no es Lista. Este test requiere que Lista sea la tarea actual.');
      logError(`Tarea actual: ${initialState.currentTask?.name || 'Ninguna'}`);
      return;
    }
    
    const initialSubtask = initialState.currentTask.subtasks?.find(s => s.id === initialState.currentTask.currentSubtaskId)?.name;
    log(`📊 Tarea actual: ${initialState.currentTask.name}`);
    log(`📊 Subtarea inicial: ${initialSubtask}`);
    log(`📊 Tipo de rotación: ${initialState.currentTask.subtaskRotation}`);
    log(`📊 Está iniciada: ${initialState.currentTask.isStarted}`);

    // STEP 2: Iniciar la tarea Lista (debería rotar)
    if (!initialState.currentTask.isStarted) {
      logStep(2, 'Iniciar tarea Lista - debería rotar subtarea');
      const startResult = await startTask();
      
      const newSubtask = startResult.startedTask.subtasks?.find(s => s.id === startResult.startedTask.currentSubtaskId)?.name;
      log(`📊 Subtarea después de iniciar: ${newSubtask}`);
      
      if (newSubtask !== initialSubtask) {
        logSuccess(`✅ ROTACIÓN AL INICIAR: ${initialSubtask} → ${newSubtask}`);
      } else {
        logWarning(`⚠️  NO ROTÓ AL INICIAR: Se mantuvo en ${initialSubtask}`);
      }
    } else {
      logStep(2, 'La tarea Lista ya está iniciada, saltando inicio');
    }

    // STEP 3: Obtener estado actual antes de completar
    logStep(3, 'Obtener estado antes de completar');
    const beforeCompleteState = await getCurrentDayState();
    const subtaskBeforeComplete = beforeCompleteState.currentTask.subtasks?.find(s => s.id === beforeCompleteState.currentTask.currentSubtaskId)?.name;
    log(`📊 Subtarea antes de completar: ${subtaskBeforeComplete}`);

    // STEP 4: Completar la tarea Lista (debería rotar)
    logStep(4, 'Completar tarea Lista - debería rotar subtarea');
    const completeResult = await completeTask();
    
    log(`📊 Tarea seleccionada aleatoriamente: ${completeResult.data.selectedTask?.name}`);
    log(`📊 Siguiente tarea: ${completeResult.data.nextTask?.name}`);

    // STEP 5: Verificar que la rotación ocurrió
    logStep(5, 'Verificar rotación después de completar');
    
    // Para verificar la rotación, necesitamos obtener el estado de Lista para el próximo día
    // Como la tarea se completó, necesitamos verificar en los datos guardados
    const finalState = await getCurrentDayState();
    
    // Buscar la tarea Lista en la secuencia para ver su nueva subtarea
    const weeklyTasks = await makeRequest('GET', '/weekly/tasks');
    const listaTask = weeklyTasks.data.find(task => task.name === 'Lista');
    
    if (listaTask) {
      const finalSubtask = listaTask.subtasks?.find(s => s.id === listaTask.currentSubtaskId)?.name;
      log(`📊 Subtarea final de Lista: ${finalSubtask}`);
      
      if (finalSubtask !== subtaskBeforeComplete) {
        logSuccess(`✅ ROTACIÓN AL COMPLETAR: ${subtaskBeforeComplete} → ${finalSubtask}`);
      } else {
        logWarning(`⚠️  NO ROTÓ AL COMPLETAR: Se mantuvo en ${subtaskBeforeComplete}`);
      }
    }

    // STEP 6: Mostrar secuencia de subtareas de Lista
    logStep(6, 'Mostrar secuencia completa de subtareas de Lista');
    if (listaTask && listaTask.subtasks) {
      log('📋 Secuencia de subtareas de Lista:');
      listaTask.subtasks.forEach((subtask, index) => {
        const isCurrent = subtask.id === listaTask.currentSubtaskId;
        log(`   ${index + 1}. ${subtask.name} ${isCurrent ? '← ACTUAL' : ''}`, isCurrent ? 'green' : 'reset');
      });
    }

    // STEP 7: Análisis final
    logStep(7, 'Análisis final de la rotación');
    
    if (listaTask) {
      const rotationType = listaTask.subtaskRotation;
      const currentSubtask = listaTask.subtasks?.find(s => s.id === listaTask.currentSubtaskId)?.name;
      
      log(`📊 Tipo de rotación configurado: ${rotationType}`);
      log(`📊 Subtarea actual después del test: ${currentSubtask}`);
      
      if (rotationType === 'onStartOrCompletion') {
        logSuccess('✅ CONFIGURACIÓN CORRECTA: Lista tiene rotación onStartOrCompletion');
        
        if (currentSubtask !== initialSubtask) {
          logSuccess('🎉 TEST EXITOSO: La rotación de Lista está funcionando');
        } else {
          logError('❌ TEST FALLIDO: La rotación no está funcionando correctamente');
        }
      } else {
        logWarning(`⚠️  CONFIGURACIÓN INESPERADA: Lista tiene rotación ${rotationType}`);
      }
    }

  } catch (error) {
    logError(`Test falló: ${error.message}`);
    console.error(error);
  }
}

// Ejecutar el test
if (require.main === module) {
  testListaRotation().then(() => {
    log('\n🏁 Test de rotación de Lista finalizado.', 'bright');
    process.exit(0);
  }).catch((error) => {
    logError(`Test falló completamente: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testListaRotation };