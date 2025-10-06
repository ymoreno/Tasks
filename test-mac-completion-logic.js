#!/usr/bin/env node

/**
 * Test script para verificar que la tarea Mac se complete correctamente
 * después de rotar por todas las subtareas y avance a la siguiente tarea (Aero).
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

async function completeSubtask() {
  const response = await makeRequest('POST', '/weekly/complete-subtask');
  return response.data;
}

async function testMacCompletionLogic() {
  try {
    log('🚀 INICIANDO TEST DE LÓGICA DE COMPLETADO DE MAC', 'bright');
    log('Este test verifica que Mac se complete después de todas las subtareas\n');

    // STEP 1: Verificar estado inicial
    logStep(1, 'Verificar que estamos en la tarea Mac');
    const initialState = await getCurrentDayState();
    
    if (!initialState.currentTask || initialState.currentTask.name !== 'Mac') {
      logError('La tarea actual no es Mac. Este test requiere que Mac sea la tarea actual.');
      return;
    }
    
    log(`📊 Tarea actual: ${initialState.currentTask.name}`);
    log(`📊 Subtarea actual: ${initialState.currentTask.subtasks?.find(s => s.id === initialState.currentTask.currentSubtaskId)?.name}`);
    log(`📊 Índice de tarea: ${initialState.dayState.currentTaskIndex}`);

    // STEP 2: Obtener la secuencia de subtareas Mac
    const macSubtasks = initialState.currentTask.subtasks || [];
    const expectedSequence = ['Algoritmos', 'Java', 'Empleo', 'Entrevista', 'Software - Gaia', 'Software - Echoes'];
    
    logStep(2, 'Verificar secuencia de subtareas Mac');
    log(`📊 Subtareas encontradas: ${macSubtasks.map(s => s.name).join(' → ')}`);
    log(`📊 Secuencia esperada: ${expectedSequence.join(' → ')}`);

    // STEP 3: Rotar a través de todas las subtareas
    logStep(3, 'Rotar a través de todas las subtareas Mac');
    
    let currentSubtaskName = initialState.currentTask.subtasks?.find(s => s.id === initialState.currentTask.currentSubtaskId)?.name;
    let rotationCount = 0;
    const maxRotations = 10; // Prevenir bucle infinito
    
    while (rotationCount < maxRotations) {
      log(`\n🔄 Rotación ${rotationCount + 1}: Completando subtarea "${currentSubtaskName}"`);
      
      const result = await completeSubtask();
      
      // Verificar si la tarea se completó (avanzó a la siguiente tarea)
      if (result.nextTask) {
        logSuccess(`🎉 ¡TAREA MAC COMPLETADA! Avanzando a: ${result.nextTask.name}`);
        
        // Verificar que avanzó a Aero
        if (result.nextTask.name === 'Aero') {
          logSuccess('✅ CORRECTO: Avanzó a la tarea Aero como se esperaba');
        } else {
          logWarning(`⚠️  INESPERADO: Avanzó a ${result.nextTask.name} en lugar de Aero`);
        }
        
        break;
      }
      
      // Si no se completó, verificar la nueva subtarea
      if (result.currentTask && result.currentTask.name === 'Mac') {
        const newSubtaskName = result.currentTask.subtasks?.find(s => s.id === result.currentTask.currentSubtaskId)?.name;
        log(`📊 Nueva subtarea: ${newSubtaskName}`);
        
        // Verificar si regresó a Algoritmos (comportamiento incorrecto)
        if (newSubtaskName === 'Algoritmos' && currentSubtaskName === 'Software - Echoes') {
          logError('❌ PROBLEMA: Después de Software-Echoes, regresó a Algoritmos en lugar de completar la tarea');
          break;
        }
        
        currentSubtaskName = newSubtaskName;
      } else {
        logError('❌ PROBLEMA: Respuesta inesperada del servidor');
        break;
      }
      
      rotationCount++;
    }
    
    if (rotationCount >= maxRotations) {
      logError('❌ PROBLEMA: Se alcanzó el máximo de rotaciones sin completar la tarea');
    }

    // STEP 4: Verificar estado final
    logStep(4, 'Verificar estado final');
    const finalState = await getCurrentDayState();
    
    log(`📊 Tarea final: ${finalState.currentTask?.name || 'Ninguna'}`);
    log(`📊 Índice final: ${finalState.dayState.currentTaskIndex}`);
    log(`📊 Día completado: ${finalState.dayState.dayCompleted}`);
    
    // Análisis final
    if (finalState.currentTask?.name === 'Aero') {
      logSuccess('🎉 TEST EXITOSO: La tarea Mac se completó correctamente y avanzó a Aero');
    } else if (finalState.currentTask?.name === 'Mac') {
      logError('❌ TEST FALLIDO: La tarea Mac no se completó, sigue activa');
    } else {
      logWarning(`⚠️  TEST PARCIAL: Avanzó a ${finalState.currentTask?.name} (no Aero, pero tampoco se quedó en Mac)`);
    }

  } catch (error) {
    logError(`Test falló: ${error.message}`);
    console.error(error);
  }
}

// Ejecutar el test
if (require.main === module) {
  testMacCompletionLogic().then(() => {
    log('\n🏁 Test de lógica de completado Mac finalizado.', 'bright');
    process.exit(0);
  }).catch((error) => {
    logError(`Test falló completamente: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testMacCompletionLogic };