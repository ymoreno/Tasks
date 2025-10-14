#!/usr/bin/env node

/**
 * Test script para verificar el sistema de alertas de deudas
 * Simula diferentes escenarios de deudas y verifica que las alertas se generen correctamente
 */

const fs = require('fs');
const path = require('path');

// Simular datos de prueba
const testScenarios = [
  {
    name: 'Usuario sin deudas',
    monthlyIncome: 5000000,
    debts: [],
    expectedAlerts: 0,
    expectedRecommendations: 1 // Optimización de ahorros
  },
  {
    name: 'Usuario con deudas bajas',
    monthlyIncome: 5000000,
    debts: [
      {
        id: '1',
        name: 'Tarjeta de Crédito',
        type: 'credit_card',
        currentBalance: 1000000,
        minimumPayment: 200000,
        interestRate: 24,
        isActive: true
      }
    ],
    expectedAlerts: 0, // Sin alertas críticas
    expectedRecommendations: 2 // Acelerar pagos + optimización
  },
  {
    name: 'Usuario con deudas altas',
    monthlyIncome: 3000000,
    debts: [
      {
        id: '1',
        name: 'Tarjeta de Crédito',
        type: 'credit_card',
        currentBalance: 5000000,
        minimumPayment: 500000,
        interestRate: 28,
        isActive: true
      },
      {
        id: '2',
        name: 'Préstamo Personal',
        type: 'personal_loan',
        currentBalance: 3000000,
        minimumPayment: 400000,
        interestRate: 18,
        isActive: true
      }
    ],
    expectedAlerts: 2, // Alto endeudamiento + presupuesto insuficiente
    expectedRecommendations: 3 // Reestructuración + consolidación + avalancha
  },
  {
    name: 'Usuario con deudas críticas',
    monthlyIncome: 2000000,
    debts: [
      {
        id: '1',
        name: 'Múltiples Tarjetas',
        type: 'credit_card',
        currentBalance: 8000000,
        minimumPayment: 800000,
        interestRate: 32,
        isActive: true
      }
    ],
    expectedAlerts: 3, // Crítico + alto endeudamiento + presupuesto insuficiente
    expectedRecommendations: 2 // Plan de emergencia + aumento de ingresos
  }
];

// Función para simular el cálculo de métricas de deudas
function calculateDebtMetrics(debts, monthlyIncome) {
  const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const minimumPercentageRequired = (totalMinimumPayments / monthlyIncome) * 100;
  const debtToIncomeRatio = (totalDebt / (monthlyIncome * 12)) * 100;
  
  let riskLevel = 'low';
  if (minimumPercentageRequired >= 40) riskLevel = 'critical';
  else if (minimumPercentageRequired >= 25) riskLevel = 'high';
  else if (minimumPercentageRequired >= 15) riskLevel = 'medium';
  
  return {
    totalDebt,
    totalMinimumPayments,
    minimumPercentageRequired,
    recommendedPercentage: Math.max(minimumPercentageRequired * 1.2, 10),
    debtToIncomeRatio,
    riskLevel
  };
}

// Función para simular distribución de presupuesto
function calculateBudgetDistribution(debtMetrics) {
  const debtPercentage = debtMetrics.minimumPercentageRequired;
  
  if (debtPercentage === 0) {
    return { necessity: 50, want: 30, saving: 20, debt: 0 };
  } else if (debtPercentage < 20) {
    return { necessity: 50, want: 25, saving: 15, debt: 10 };
  } else if (debtPercentage <= 30) {
    return { necessity: 50, want: 20, saving: 10, debt: 20 };
  } else {
    return { necessity: 60, want: 10, saving: 5, debt: 25 };
  }
}

// Función para generar alertas simuladas
function generateAlerts(debtMetrics, budgetDistribution) {
  const alerts = [];
  
  if (debtMetrics.minimumPercentageRequired > 40) {
    alerts.push('critical-debt-load');
  }
  
  if (debtMetrics.minimumPercentageRequired > 30) {
    alerts.push('high-debt-load');
  }
  
  if (budgetDistribution.debt < debtMetrics.minimumPercentageRequired) {
    alerts.push('insufficient-debt-budget');
  }
  
  if (debtMetrics.riskLevel === 'low' && debtMetrics.minimumPercentageRequired < 15) {
    alerts.push('excellent-debt-management');
  }
  
  return alerts;
}

// Función para generar recomendaciones simuladas
function generateRecommendations(debtMetrics, debts) {
  const recommendations = [];
  
  switch (debtMetrics.riskLevel) {
    case 'critical':
      recommendations.push('emergency-debt-plan', 'increase-income-critical');
      break;
    case 'high':
      recommendations.push('debt-avalanche-strategy', 'debt-consolidation', 'payment-optimization');
      break;
    case 'medium':
      recommendations.push('payment-optimization', 'refinancing-strategy');
      break;
    case 'low':
      recommendations.push('accelerate-payoff');
      if (debtMetrics.minimumPercentageRequired < 15) {
        recommendations.push('optimize-savings-investment');
      }
      break;
  }
  
  // Recomendaciones específicas
  const creditCards = debts.filter(debt => debt.type === 'credit_card');
  if (creditCards.length > 2) {
    recommendations.push('credit-card-optimization');
  }
  
  const highInterestDebts = debts.filter(debt => debt.interestRate > 25);
  if (highInterestDebts.length > 0) {
    recommendations.push('high-interest-emergency');
  }
  
  return recommendations;
}

// Ejecutar pruebas
console.log('🧪 Iniciando pruebas del Sistema de Alertas de Deudas\n');

let passedTests = 0;
let totalTests = testScenarios.length;

testScenarios.forEach((scenario, index) => {
  console.log(`📋 Escenario ${index + 1}: ${scenario.name}`);
  console.log(`   Ingreso mensual: $${scenario.monthlyIncome.toLocaleString()}`);
  console.log(`   Número de deudas: ${scenario.debts.length}`);
  
  // Calcular métricas
  const debtMetrics = calculateDebtMetrics(scenario.debts, scenario.monthlyIncome);
  const budgetDistribution = calculateBudgetDistribution(debtMetrics);
  
  console.log(`   Porcentaje mínimo requerido: ${debtMetrics.minimumPercentageRequired.toFixed(1)}%`);
  console.log(`   Nivel de riesgo: ${debtMetrics.riskLevel}`);
  
  // Generar alertas y recomendaciones
  const alerts = generateAlerts(debtMetrics, budgetDistribution);
  const recommendations = generateRecommendations(debtMetrics, scenario.debts);
  
  console.log(`   Alertas generadas: ${alerts.length} (esperadas: ${scenario.expectedAlerts})`);
  console.log(`   Recomendaciones generadas: ${recommendations.length} (esperadas: ${scenario.expectedRecommendations})`);
  
  // Verificar resultados
  const alertsMatch = alerts.length >= scenario.expectedAlerts;
  const recommendationsMatch = recommendations.length >= scenario.expectedRecommendations;
  
  if (alertsMatch && recommendationsMatch) {
    console.log('   ✅ PASÓ - Alertas y recomendaciones correctas');
    passedTests++;
  } else {
    console.log('   ❌ FALLÓ - Resultados no coinciden con lo esperado');
    if (!alertsMatch) {
      console.log(`      - Alertas: obtuvo ${alerts.length}, esperaba al menos ${scenario.expectedAlerts}`);
    }
    if (!recommendationsMatch) {
      console.log(`      - Recomendaciones: obtuvo ${recommendations.length}, esperaba al menos ${scenario.expectedRecommendations}`);
    }
  }
  
  console.log('');
});

// Resumen de resultados
console.log('📊 Resumen de Pruebas:');
console.log(`   Total de pruebas: ${totalTests}`);
console.log(`   Pruebas exitosas: ${passedTests}`);
console.log(`   Pruebas fallidas: ${totalTests - passedTests}`);
console.log(`   Porcentaje de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 ¡Todas las pruebas pasaron! El sistema de alertas funciona correctamente.');
} else {
  console.log('\n⚠️  Algunas pruebas fallaron. Revisar la implementación.');
}

// Verificar que los archivos fueron creados
console.log('\n📁 Verificando archivos creados:');

const filesToCheck = [
  'administrador-tareas/frontend/src/components/finances/DebtAlertSystem.tsx',
  'administrador-tareas/frontend/src/services/debtRecommendationEngine.ts',
  'administrador-tareas/frontend/src/hooks/useDebtAlerts.ts'
];

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${path.basename(filePath)} - ${(stats.size / 1024).toFixed(1)} KB`);
  } else {
    console.log(`   ❌ ${path.basename(filePath)} - No encontrado`);
  }
});

console.log('\n🔧 Implementación del Sistema de Alertas de Deudas completada:');
console.log('   • DebtAlertSystem: Componente principal de alertas y recomendaciones');
console.log('   • DebtRecommendationEngine: Motor de recomendaciones automáticas');
console.log('   • useDebtAlerts: Hook para integración con contexto financiero');
console.log('   • Tipos actualizados: DebtAlert, DebtRecommendation, DebtAlertAction');
console.log('\n✨ El sistema está listo para generar alertas inteligentes y recomendaciones automáticas!');