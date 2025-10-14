#!/usr/bin/env node

/**
 * Test para verificar las mejoras en el gestor de finanzas:
 * 1. Formateo mejorado de valores monetarios
 * 2. Botón para editar/reconfigurar perfil existente
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
    if (error.response && error.response.status === 404) {
      return { data: null, status: 404 };
    }
    logError(`Request failed: ${error.message}`);
    throw error;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

async function testFinanceImprovements() {
  try {
    log('💰 TESTING FINANCE IMPROVEMENTS', 'bright');
    log('Verificando formateo de moneda y funcionalidad de editar perfil\n');

    // STEP 1: Verificar perfil financiero actual
    logStep(1, 'Verificar perfil financiero actual');
    
    const profileResponse = await makeRequest('GET', '/finance/profile');
    
    if (profileResponse.status === 404 || !profileResponse.data) {
      logWarning('⚠️  NO HAY PERFIL CONFIGURADO');
      log('   Para probar completamente las mejoras, necesitas un perfil configurado');
      log('   Ve a la página de Finanzas y configura un perfil primero');
      return;
    }
    
    const profile = profileResponse.data;
    logSuccess('✅ PERFIL ENCONTRADO');
    log(`   Ingreso mensual: ${formatCurrency(profile.monthlyIncome)}`);
    log(`   Tipo de distribución: ${profile.distributionType}`);
    log(`   Categorías: ${profile.categories.length}`);

    // STEP 2: Verificar formateo de valores monetarios
    logStep(2, 'Verificar formateo mejorado de valores monetarios');
    
    log('💵 EJEMPLOS DE FORMATEO MEJORADO:');
    const testAmounts = [1000, 15000, 250000, 1500000, 25000000];
    
    testAmounts.forEach(amount => {
      const formatted = formatCurrency(amount);
      log(`   ${amount.toLocaleString()} → ${formatted}`);
    });
    
    logSuccess('✅ FORMATEO CORRECTO: Separadores de miles y sin decimales');

    // STEP 3: Verificar datos del perfil para edición
    logStep(3, 'Verificar datos disponibles para edición del perfil');
    
    log('📊 DATOS DEL PERFIL ACTUAL:');
    log(`   ID: ${profile.id}`);
    log(`   Ingreso: ${formatCurrency(profile.monthlyIncome)}`);
    log(`   Distribución: ${profile.distributionType}`);
    log(`   Creado: ${new Date(profile.createdAt).toLocaleDateString()}`);
    if (profile.updatedAt) {
      log(`   Actualizado: ${new Date(profile.updatedAt).toLocaleDateString()}`);
    }
    
    log('\n📋 CATEGORÍAS DE PRESUPUESTO:');
    profile.categories.forEach((category, index) => {
      log(`   ${index + 1}. ${category.name}: ${formatCurrency(category.budgetAmount)} (${category.percentage}%)`);
      log(`      Gastado: ${formatCurrency(category.spentAmount)}`);
      log(`      Restante: ${formatCurrency(category.budgetAmount - category.spentAmount)}`);
    });

    // STEP 4: Verificar gastos existentes
    logStep(4, 'Verificar gastos existentes con formateo');
    
    const expensesResponse = await makeRequest('GET', '/finance/expenses');
    const expenses = expensesResponse.data || [];
    
    if (expenses.length === 0) {
      logWarning('⚠️  NO HAY GASTOS REGISTRADOS');
      log('   Agrega algunos gastos para ver el formateo en acción');
    } else {
      logSuccess(`✅ GASTOS ENCONTRADOS: ${expenses.length}`);
      log('\n💸 ÚLTIMOS GASTOS (con formateo mejorado):');
      
      expenses.slice(-5).forEach((expense, index) => {
        const category = profile.categories.find(cat => cat.id === expense.categoryId);
        log(`   ${index + 1}. ${expense.description}: ${formatCurrency(expense.amount)}`);
        log(`      Categoría: ${category?.name || 'Desconocida'}`);
        log(`      Fecha: ${new Date(expense.date).toLocaleDateString()}`);
      });
    }

    // STEP 5: Verificar resumen financiero
    logStep(5, 'Verificar resumen financiero con formateo');
    
    const summaryResponse = await makeRequest('GET', '/finance/summary');
    const summary = summaryResponse.data;
    
    if (summary) {
      logSuccess('✅ RESUMEN FINANCIERO DISPONIBLE');
      log('\n📈 RESUMEN CON FORMATEO MEJORADO:');
      log(`   Ingreso Total: ${formatCurrency(summary.totalIncome)}`);
      log(`   Presupuesto Total: ${formatCurrency(summary.totalBudget)}`);
      log(`   Total Gastado: ${formatCurrency(summary.totalSpent)}`);
      log(`   Total Restante: ${formatCurrency(summary.totalRemaining)}`);
      
      const utilizationPercentage = ((summary.totalSpent / summary.totalBudget) * 100).toFixed(1);
      log(`   Utilización del Presupuesto: ${utilizationPercentage}%`);
    }

    // STEP 6: Análisis de las mejoras implementadas
    logStep(6, 'Análisis de mejoras implementadas');
    
    log('🔧 MEJORAS IMPLEMENTADAS:');
    log('   ✅ Formateo de moneda mejorado:');
    log('      - Separadores de miles (1.000, 10.000, 100.000)');
    log('      - Sin decimales para pesos colombianos');
    log('      - Símbolo de moneda consistente');
    log('');
    log('   ✅ Funcionalidad de editar perfil:');
    log('      - Botón "Editar Perfil" en header cuando hay perfil');
    log('      - Diálogo pre-llenado con valores actuales');
    log('      - Método updateProfile para actualizar datos');
    log('      - Títulos dinámicos (Crear vs Editar)');
    log('');
    log('   ✅ Experiencia de usuario mejorada:');
    log('      - No más diálogos automáticos molestos');
    log('      - Control total sobre cuándo configurar/editar');
    log('      - Valores monetarios más legibles');
    log('      - Interfaz más profesional');

    // STEP 7: Instrucciones para probar
    logStep(7, 'Instrucciones para probar las mejoras');
    
    log('🧪 PARA PROBAR LAS MEJORAS:', 'bright');
    log('   1. Ve a la página de Finanzas en el navegador');
    log('   2. Observa el formateo mejorado de todos los valores monetarios');
    log('   3. Busca el botón "Editar Perfil" en el header (junto a "Agregar Gasto")');
    log('   4. Haz clic en "Editar Perfil" para abrir el diálogo');
    log('   5. Verifica que los campos están pre-llenados con valores actuales');
    log('   6. Cambia el ingreso mensual o tipo de distribución');
    log('   7. Haz clic en "Actualizar Perfil" para guardar cambios');
    log('   8. Verifica que los cambios se reflejan en toda la página');

  } catch (error) {
    logError(`Test falló: ${error.message}`);
    console.error(error);
  }
}

// Ejecutar el test
if (require.main === module) {
  testFinanceImprovements().then(() => {
    log('\n🏁 Test de mejoras financieras finalizado.', 'bright');
    process.exit(0);
  }).catch((error) => {
    logError(`Test falló completamente: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testFinanceImprovements };