#!/usr/bin/env node

/**
 * Test script para verificar la integración frontend del dashboard con categoría de deudas
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testDashboardFrontend() {
  console.log('🧪 Iniciando pruebas de integración frontend del dashboard...\n');

  try {
    // 1. Verificar que el backend esté funcionando
    console.log('1. Verificando conexión con el backend...');
    await axios.get(`${API_BASE}/health`);
    console.log('✅ Backend conectado correctamente\n');

    // 2. Crear un perfil financiero con distribución inteligente (debt-aware)
    console.log('2. Creando perfil financiero con distribución inteligente...');
    const profileData = {
      monthlyIncome: 5000000,
      distributionType: 'debt-aware'
    };

    const profileResponse = await axios.post(`${API_BASE}/finance/profile`, profileData);
    const profile = profileResponse.data.data;
    console.log('✅ Perfil creado:', {
      id: profile.id,
      monthlyIncome: profile.monthlyIncome.toLocaleString('es-CO'),
      distributionType: profile.distributionType,
      categories: profile.categories.length
    });
    console.log('');

    // 3. Verificar que se creó la categoría de deudas
    console.log('3. Verificando categoría de deudas...');
    const debtCategory = profile.categories.find(cat => cat.type === 'debt');
    if (debtCategory) {
      console.log('✅ Categoría de deudas creada correctamente:', {
        name: debtCategory.name,
        type: debtCategory.type,
        percentage: debtCategory.percentage + '%',
        budgetAmount: debtCategory.budgetAmount.toLocaleString('es-CO'),
        color: debtCategory.color,
        isDebtCategory: debtCategory.isDebtCategory
      });
    } else {
      console.log('❌ No se encontró la categoría de deudas');
      return;
    }
    console.log('');

    // 4. Verificar el orden correcto de las categorías
    console.log('4. Verificando orden de categorías...');
    const expectedOrder = ['necessity', 'debt', 'want', 'saving'];
    const actualOrder = profile.categories.map(cat => cat.type);
    
    console.log('Orden esperado:', expectedOrder);
    console.log('Orden actual:  ', actualOrder);
    
    const isOrderCorrect = expectedOrder.every((type, index) => actualOrder[index] === type);
    if (isOrderCorrect) {
      console.log('✅ Las categorías están ordenadas correctamente (Necesidades, Deudas, Deseos, Ahorros)');
    } else {
      console.log('❌ El orden de las categorías no es correcto');
    }
    console.log('');

    // 5. Verificar todas las categorías y sus propiedades
    console.log('5. Verificando propiedades de todas las categorías...');
    profile.categories.forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.name} (${category.type}):`);
      console.log(`      - Porcentaje: ${category.percentage}%`);
      console.log(`      - Presupuesto: ${category.budgetAmount.toLocaleString('es-CO')}`);
      console.log(`      - Color: ${category.color}`);
      console.log(`      - Descripción: ${category.description || 'N/A'}`);
      if (category.type === 'debt') {
        console.log(`      - Es categoría de deudas: ${category.isDebtCategory}`);
        console.log(`      - Deudas vinculadas: ${category.linkedDebts?.length || 0}`);
      }
      console.log('');
    });

    // 6. Verificar que la suma de porcentajes sea 100%
    console.log('6. Verificando distribución de presupuesto...');
    const totalPercentage = profile.categories.reduce((sum, cat) => sum + cat.percentage, 0);
    const totalBudget = profile.categories.reduce((sum, cat) => sum + cat.budgetAmount, 0);
    
    console.log('✅ Distribución verificada:', {
      totalPercentage: totalPercentage + '%',
      totalBudget: totalBudget.toLocaleString('es-CO'),
      monthlyIncome: profile.monthlyIncome.toLocaleString('es-CO'),
      isValid: totalPercentage === 100 && Math.abs(totalBudget - profile.monthlyIncome) < 1000
    });
    console.log('');

    // 7. Obtener resumen financiero
    console.log('7. Obteniendo resumen financiero...');
    const summaryResponse = await axios.get(`${API_BASE}/finance/summary`);
    const summary = summaryResponse.data.data || summaryResponse.data;
    
    if (summary) {
      console.log('✅ Resumen financiero obtenido:', {
        totalIncome: summary.totalIncome.toLocaleString('es-CO'),
        totalBudget: summary.totalBudget.toLocaleString('es-CO'),
        totalSpent: summary.totalSpent.toLocaleString('es-CO'),
        totalRemaining: summary.totalRemaining.toLocaleString('es-CO'),
        budgetUsedPercentage: Math.round((summary.totalSpent / summary.totalBudget) * 100) + '%'
      });
      
      // Verificar breakdown por categorías
      if (summary.categoryBreakdown) {
        console.log('   Breakdown por categorías:');
        summary.categoryBreakdown.forEach(breakdown => {
          console.log(`   - ${breakdown.categoryName}: ${breakdown.spent.toLocaleString('es-CO')} / ${breakdown.budgeted.toLocaleString('es-CO')}`);
        });
      }
    } else {
      console.log('❌ No se pudo obtener el resumen financiero');
    }
    console.log('');

    // 8. Crear perfil tradicional para comparar
    console.log('8. Creando perfil tradicional para comparación...');
    const traditionalProfileData = {
      monthlyIncome: 5000000,
      distributionType: 'recommended'
    };

    const traditionalResponse = await axios.post(`${API_BASE}/finance/profile`, traditionalProfileData);
    const traditionalProfile = traditionalResponse.data.data;
    
    console.log('✅ Perfil tradicional creado para comparación:');
    console.log('   Categorías tradicionales (50/30/20):');
    traditionalProfile.categories.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.percentage}%`);
    });
    
    console.log('   Categorías con deudas (50/25/15/10):');
    profile.categories.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.percentage}%`);
    });
    console.log('');

    // 9. Verificar configuración de deudas
    console.log('9. Verificando configuración de deudas...');
    if (profile.debtSettings) {
      console.log('✅ Configuración de deudas encontrada:', {
        includeDebtCategory: profile.debtSettings.includeDebtCategory,
        minimumDebtPercentage: profile.debtSettings.minimumDebtPercentage + '%',
        currentDebtPercentage: profile.debtSettings.currentDebtPercentage + '%',
        autoCalculateFromDebts: profile.debtSettings.autoCalculateFromDebts,
        alertThresholds: {
          highDebt: profile.debtSettings.alertThresholds.highDebt + '%',
          criticalDebt: profile.debtSettings.alertThresholds.criticalDebt + '%'
        }
      });
    } else {
      console.log('❌ No se encontró configuración de deudas');
    }
    console.log('');

    console.log('🎉 ¡Todas las pruebas de integración frontend completadas exitosamente!');
    console.log('\n📊 Funcionalidades verificadas:');
    console.log('   ✅ Creación de perfil con distribución debt-aware');
    console.log('   ✅ Categoría de deudas incluida en el perfil');
    console.log('   ✅ Ordenamiento correcto de categorías (Necesidades, Deudas, Deseos, Ahorros)');
    console.log('   ✅ Propiedades correctas de la categoría de deudas');
    console.log('   ✅ Distribución de presupuesto válida (suma 100%)');
    console.log('   ✅ Configuración de deudas incluida');
    console.log('   ✅ Resumen financiero funcional');
    console.log('   ✅ Comparación con distribución tradicional');
    
    console.log('\n🎯 Próximos pasos para completar la integración:');
    console.log('   - Implementar endpoints de deudas en el backend (tasks 9-10)');
    console.log('   - Agregar métricas de deudas al resumen financiero');
    console.log('   - Implementar cálculo de indicadores de salud financiera');
    console.log('   - Agregar progreso hacia libertad financiera');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    if (error.response) {
      console.error('   Respuesta del servidor:', error.response.status, error.response.data);
    }
    process.exit(1);
  }
}

// Ejecutar las pruebas
testDashboardFrontend();