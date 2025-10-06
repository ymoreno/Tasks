#!/usr/bin/env node

/**
 * Test script para debuggear el problema del timer de Mac que se resetea
 * durante la rotación de subtareas.
 * 
 * Este script reproduce el problema paso a paso y captura todos los logs
 * para identificar la causa raíz.
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

async function completeSubtask() {
  const response = await makeRequest('POST', '/weekly/complete-subtask');
  return response.data;
}

async function updateTimer(elapsedSeconds, timerState) {
  const response = await makeRequest('POST', '/weekly/update-timer', {
    elapsedSeconds,
    timerState
  });
  return response.data;
}

function analyzeTaskState(task, label) {
  log(`\n📊 TASK STATE ANALYSIS - ${label}:`, 'magenta');
  log(`   Task ID: ${task.id}`);
  log(`   Task Name: ${task.name}`);
  log(`   Is Started: ${task.isStarted}`);
  log(`   Current Subtask ID: ${task.currentSubtaskId}`);
  
  if (task.subtasks) {
    const currentSubtask = task.subtasks.find(s => s.id === task.currentSubtaskId);
    log(`   Current Subtask Name: ${currentSubtask?.name || 'NOT FOUND'}`);
  }
}

function analyzeDayState(dayState, label) {
  log(`\n📊 DAY STATE ANALYSIS - ${label}:`, 'magenta');
  log(`   Timer State: ${dayState.timerState}`);
  log(`   Timer Elapsed Seconds: ${dayState.timerElapsedSeconds}`);
  log(`   Current Task Index: ${dayState.currentTaskIndex}`);
  log(`   Day Completed: ${dayState.dayCompleted}`);
}

async function testMacTimerRotation() {
  try {
    log('🚀 INICIANDO TEST DE DEBUGGING DEL TIMER DE MAC', 'bright');
    log('Este test reproduce el problema paso a paso para identificar la causa raíz\n');

    // STEP 1: Obtener estado inicial
    logStep(1, 'Obtener estado inicial del día');
    const initialState = await getCurrentDayState();
    
    if (!initialState.currentTask) {
      logError('No hay tarea actual. El test requiere que haya una tarea Mac activa.');
      return;
    }
    
    if (initialState.currentTask.name !== 'Mac') {
      logWarning(`La tarea actual es '${initialState.currentTask.name}', no 'Mac'. Continuando de todas formas...`);
    }
    
    analyzeTaskState(initialState.currentTask, 'INITIAL');
    analyzeDayState(initialState.dayState, 'INITIAL');

    // STEP 2: Iniciar la tarea si no está iniciada
    let currentState = initialState;
    if (!currentState.currentTask.isStarted) {
      logStep(2, 'Iniciar la tarea Mac');
      const startResult = await startTask();
      analyzeTaskState(startResult.startedTask, 'AFTER START');
      analyzeDayState(startResult.dayState, 'AFTER START');
      currentState = await getCurrentDayState();
    } else {
      logStep(2, 'La tarea ya está iniciada, continuando...');
    }

    // STEP 3: Simular timer corriendo por 30 segundos
    logStep(3, 'Simular timer corriendo por 30 segundos');
    await updateTimer(30, 'running');
    const timerState = await getCurrentDayState();
    analyzeDayState(timerState.dayState, 'AFTER TIMER UPDATE');

    // STEP 4: Completar subtarea (aquí es donde ocurre el problema)
    logStep(4, 'Completar subtarea - AQUÍ OCURRE EL PROBLEMA');
    log('⚠️  Monitoreando logs del backend para capturar el problema...', 'yellow');
    
    const beforeRotation = await getCurrentDayState();
    analyzeTaskState(beforeRotation.currentTask, 'BEFORE ROTATION');
    analyzeDayState(beforeRotation.dayState, 'BEFORE ROTATION');
    
    // Esta es la llamada que causa el problema
    const rotationResult = await completeSubtask();
    
    analyzeTaskState(rotationResult.currentTask, 'AFTER ROTATION');
    analyzeDayState(rotationResult.dayState, 'AFTER ROTATION');

    // STEP 5: Verificar estado final
    logStep(5, 'Verificar estado final después de la rotación');
    const finalState = await getCurrentDayState();
    analyzeTaskState(finalState.currentTask, 'FINAL');
    analyzeDayState(finalState.dayState, 'FINAL');

    // STEP 6: Análisis del problema
    logStep(6, 'ANÁLISIS DEL PROBLEMA');
    
    const timerPreserved = finalState.dayState.timerElapsedSeconds === 30;
    const taskStartedPreserved = finalState.currentTask.isStarted === true;
    const subtaskRotated = finalState.currentTask.currentSubtaskId !== beforeRotation.currentTask.currentSubtaskId;
    
    log(`\n📋 RESULTADOS DEL TEST:`, 'bright');
    log(`   ✅ Subtarea rotó correctamente: ${subtaskRotated ? 'SÍ' : 'NO'}`, subtaskRotated ? 'green' : 'red');
    log(`   ${timerPreserved ? '✅' : '❌'} Timer preservado (30s): ${timerPreserved ? 'SÍ' : 'NO'}`, timerPreserved ? 'green' : 'red');
    log(`   ${taskStartedPreserved ? '✅' : '❌'} Estado isStarted preservado: ${taskStartedPreserved ? 'SÍ' : 'NO'}`, taskStartedPreserved ? 'green' : 'red');
    
    if (!timerPreserved || !taskStartedPreserved) {
      logError('🚨 PROBLEMA CONFIRMADO: El timer y/o estado de la tarea se resetea durante la rotación');
      log('\n🔍 REVISAR LOS LOGS DEL BACKEND PARA IDENTIFICAR LA CAUSA RAÍZ', 'yellow');
      log('Los logs con prefijo 🔄 y 📱 contienen información detallada del problema', 'yellow');
    } else {
      logSuccess('🎉 PROBLEMA RESUELTO: El timer y estado se preservan correctamente');
    }

  } catch (error) {
    logError(`Test falló: ${error.message}`);
    console.error(error);
  }
}

// Ejecutar el test
if (require.main === module) {
  testMacTimerRotation().then(() => {
    log('\n🏁 Test completado. Revisar los logs para más detalles.', 'bright');
    process.exit(0);
  }).catch((error) => {
    logError(`Test falló completamente: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testMacTimerRotation };