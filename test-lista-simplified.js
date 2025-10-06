#!/usr/bin/env node

/**
 * Test script para verificar la nueva configuración simplificada de Lista:
 * - Solo 3 subtareas: Arreglarme → Musica → Peliculas
 * - Lista cambió de orden 8 a 9
 * - Plantas cambió de orden 10 a 8
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
    log('='.repeat(60), 'cyan');
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

async function testListaSimplified() {
    try {
        log('🚀 TESTING LISTA SIMPLIFIED CONFIGURATION', 'bright');
        log('Verificando nueva configuración: 3 subtareas y cambio de orden\n');

        // STEP 1: Obtener tareas semanales
        logStep(1, 'Obtener configuración de tareas semanales');
        const weeklyTasks = await makeRequest('GET', '/weekly/tasks');

        // STEP 2: Verificar tarea Lista
        logStep(2, 'Verificar configuración de tarea Lista');
        const listaTask = weeklyTasks.data.find(task => task.name === 'Lista');

        if (!listaTask) {
            logError('Tarea Lista no encontrada');
            return;
        }

        log(`📊 Tarea Lista encontrada:`);
        log(`   ID: ${listaTask.id}`);
        log(`   Orden: ${listaTask.order}`);
        log(`   Tipo de rotación: ${listaTask.subtaskRotation}`);
        log(`   Subtarea actual: ${listaTask.currentSubtaskId}`);

        // Verificar orden correcto (debe ser 9)
        if (listaTask.order === 9) {
            logSuccess('✅ ORDEN CORRECTO: Lista tiene orden 9');
        } else {
            logError(`❌ ORDEN INCORRECTO: Lista tiene orden ${listaTask.order}, esperado 9`);
        }

        // STEP 3: Verificar subtareas de Lista
        logStep(3, 'Verificar subtareas simplificadas de Lista');

        if (!listaTask.subtasks || listaTask.subtasks.length === 0) {
            logError('Lista no tiene subtareas');
            return;
        }

        const expectedSubtasks = ['Arreglarme', 'Musica', 'Peliculas'];
        const actualSubtasks = listaTask.subtasks.map(s => s.name);

        log(`📊 Subtareas encontradas: ${actualSubtasks.join(' → ')}`);
        log(`📊 Subtareas esperadas: ${expectedSubtasks.join(' → ')}`);

        // Verificar cantidad correcta
        if (listaTask.subtasks.length === 3) {
            logSuccess('✅ CANTIDAD CORRECTA: Lista tiene 3 subtareas');
        } else {
            logError(`❌ CANTIDAD INCORRECTA: Lista tiene ${listaTask.subtasks.length} subtareas, esperadas 3`);
        }

        // Verificar nombres correctos
        let subtasksCorrect = true;
        expectedSubtasks.forEach((expected, index) => {
            if (actualSubtasks[index] === expected) {
                logSuccess(`✅ SUBTAREA ${index + 1} CORRECTA: ${expected}`);
            } else {
                logError(`❌ SUBTAREA ${index + 1} INCORRECTA: Encontrada "${actualSubtasks[index]}", esperada "${expected}"`);
                subtasksCorrect = false;
            }
        });

        // STEP 4: Verificar tarea Plantas
        logStep(4, 'Verificar cambio de orden de tarea Plantas');
        const plantasTask = weeklyTasks.data.find(task => task.name === 'Plantas');

        if (!plantasTask) {
            logError('Tarea Plantas no encontrada');
        } else {
            log(`📊 Tarea Plantas:`);
            log(`   ID: ${plantasTask.id}`);
            log(`   Orden: ${plantasTask.order}`);

            if (plantasTask.order === 8) {
                logSuccess('✅ ORDEN CORRECTO: Plantas tiene orden 8');
            } else {
                logError(`❌ ORDEN INCORRECTO: Plantas tiene orden ${plantasTask.order}, esperado 8`);
            }
        }

        // STEP 5: Verificar secuencia completa de órdenes
        logStep(5, 'Verificar secuencia completa de órdenes');

        const tasksByOrder = weeklyTasks.data
            .sort((a, b) => a.order - b.order)
            .map(task => `${task.order}. ${task.name}`);

        log('📊 Secuencia completa de tareas por orden:');
        tasksByOrder.forEach(task => {
            log(`   ${task}`);
        });

        // Verificar que Plantas (8) viene antes que Lista (9)
        const plantasIndex = weeklyTasks.data.findIndex(t => t.name === 'Plantas');
        const listaIndex = weeklyTasks.data.findIndex(t => t.name === 'Lista');

        if (plantasIndex !== -1 && listaIndex !== -1) {
            const plantasOrder = weeklyTasks.data[plantasIndex].order;
            const listaOrder = weeklyTasks.data[listaIndex].order;

            if (plantasOrder < listaOrder) {
                logSuccess('✅ SECUENCIA CORRECTA: Plantas (8) viene antes que Lista (9)');
            } else {
                logError(`❌ SECUENCIA INCORRECTA: Plantas (${plantasOrder}) debería venir antes que Lista (${listaOrder})`);
            }
        }

        // STEP 6: Análisis final
        logStep(6, 'Análisis final de la configuración');

        const allChecks = [
            listaTask.order === 9,
            listaTask.subtasks.length === 3,
            subtasksCorrect,
            plantasTask && plantasTask.order === 8
        ];

        const passedChecks = allChecks.filter(check => check).length;
        const totalChecks = allChecks.length;

        log(`📊 RESULTADOS: ${passedChecks}/${totalChecks} verificaciones pasaron`);

        if (passedChecks === totalChecks) {
            logSuccess('🎉 CONFIGURACIÓN PERFECTA: Todos los cambios aplicados correctamente');
        } else {
            logWarning(`⚠️  CONFIGURACIÓN PARCIAL: ${totalChecks - passedChecks} verificaciones fallaron`);
        }

        // Mostrar nueva secuencia de rotación de Lista
        if (listaTask.subtasks.length === 3) {
            log('\n🔄 NUEVA SECUENCIA DE ROTACIÓN DE LISTA:', 'bright');
            log('   Arreglarme → Musica → Peliculas → (vuelve a Arreglarme)', 'green');
        }

    } catch (error) {
        logError(`Test falló: ${error.message}`);
        console.error(error);
    }
}

// Ejecutar el test
if (require.main === module) {
    testListaSimplified().then(() => {
        log('\n🏁 Test de configuración simplificada de Lista finalizado.', 'bright');
        process.exit(0);
    }).catch((error) => {
        logError(`Test falló completamente: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testListaSimplified };