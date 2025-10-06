// Script para probar el sistema de finanzas personales
const axios = require('axios');

async function testFinanceSystem() {
  try {
    console.log('🧪 Probando sistema de finanzas personales...\n');

    // 1. Verificar si existe un perfil financiero
    console.log('1️⃣ Verificando perfil financiero existente...');
    let profileResponse = await axios.get('http://localhost:3001/api/finance/profile');
    console.log(`✅ Estado del perfil: ${profileResponse.data.data ? 'Existe' : 'No existe'}`);

    // 2. Crear perfil financiero si no existe
    if (!profileResponse.data.data) {
      console.log('\n2️⃣ Creando nuevo perfil financiero...');
      const createProfileResponse = await axios.post('http://localhost:3001/api/finance/profile', {
        monthlyIncome: 5000000, // 5 millones COP
        distributionType: 'recommended'
      });
      
      const profile = createProfileResponse.data.data;
      console.log(`✅ Perfil creado exitosamente`);
      console.log(`   Ingreso mensual: $${profile.monthlyIncome.toLocaleString()}`);
      console.log(`   Tipo de distribución: ${profile.distributionType}`);
      console.log(`   Categorías creadas: ${profile.categories.length}`);
      
      // Mostrar categorías
      console.log('\n📋 Categorías del presupuesto:');
      profile.categories.forEach(category => {
        console.log(`   • ${category.name}: ${category.percentage}% ($${category.budgetAmount.toLocaleString()})`);
        console.log(`     Tipo: ${category.type}, Descripción: ${category.description}`);
      });
    } else {
      console.log('   Usando perfil existente');
    }

    // 3. Obtener perfil actualizado
    profileResponse = await axios.get('http://localhost:3001/api/finance/profile');
    const profile = profileResponse.data.data;

    // 4. Agregar algunos gastos de prueba
    console.log('\n3️⃣ Agregando gastos de prueba...');
    const testExpenses = [
      {
        categoryId: profile.categories.find(c => c.name === 'Vivienda')?.id,
        amount: 1200000,
        description: 'Alquiler mensual',
        date: new Date().toISOString()
      },
      {
        categoryId: profile.categories.find(c => c.name === 'Alimentación')?.id,
        amount: 150000,
        description: 'Mercado semanal',
        date: new Date().toISOString()
      },
      {
        categoryId: profile.categories.find(c => c.name === 'Entretenimiento')?.id,
        amount: 80000,
        description: 'Cine y cena',
        date: new Date().toISOString()
      },
      {
        categoryId: profile.categories.find(c => c.name === 'Transporte')?.id,
        amount: 200000,
        description: 'Combustible',
        date: new Date().toISOString()
      }
    ];

    for (const expense of testExpenses) {
      if (expense.categoryId) {
        const expenseResponse = await axios.post('http://localhost:3001/api/finance/expenses', expense);
        console.log(`   ✅ Gasto agregado: ${expense.description} - $${expense.amount.toLocaleString()}`);
      }
    }

    // 5. Obtener todos los gastos
    console.log('\n4️⃣ Obteniendo lista de gastos...');
    const expensesResponse = await axios.get('http://localhost:3001/api/finance/expenses');
    const expenses = expensesResponse.data.data;
    console.log(`✅ Total de gastos registrados: ${expenses.length}`);

    if (expenses.length > 0) {
      console.log('📋 Últimos gastos:');
      expenses.slice(-5).forEach(expense => {
        const category = profile.categories.find(c => c.id === expense.categoryId);
        console.log(`   • ${expense.description}: $${expense.amount.toLocaleString()} (${category?.name || 'Sin categoría'})`);
      });
    }

    // 6. Calcular resumen financiero
    console.log('\n5️⃣ Calculando resumen financiero...');
    const summaryResponse = await axios.get('http://localhost:3001/api/finance/summary');
    const summary = summaryResponse.data.data;
    
    console.log('📊 Resumen Financiero:');
    console.log(`   💰 Ingreso total: $${summary.totalIncome.toLocaleString()}`);
    console.log(`   📋 Presupuesto total: $${summary.totalBudget.toLocaleString()}`);
    console.log(`   💸 Total gastado: $${summary.totalSpent.toLocaleString()}`);
    console.log(`   💵 Disponible: $${summary.totalRemaining.toLocaleString()}`);
    console.log(`   📈 Porcentaje usado: ${Math.round((summary.totalSpent / summary.totalBudget) * 100)}%`);

    // 7. Desglose por categorías
    console.log('\n📊 Desglose por categorías:');
    summary.categoryBreakdown.forEach(category => {
      const usedPercentage = category.budgeted > 0 ? Math.round((category.spent / category.budgeted) * 100) : 0;
      const status = category.remaining >= 0 ? '✅' : '⚠️';
      
      console.log(`   ${status} ${category.categoryName}:`);
      console.log(`      Presupuestado: $${category.budgeted.toLocaleString()} (${category.percentage}%)`);
      console.log(`      Gastado: $${category.spent.toLocaleString()} (${usedPercentage}%)`);
      console.log(`      ${category.remaining >= 0 ? 'Disponible' : 'Excedido'}: $${Math.abs(category.remaining).toLocaleString()}`);
      console.log('');
    });

    // 8. Probar actualización de perfil
    console.log('6️⃣ Probando actualización de perfil...');
    const updateResponse = await axios.put('http://localhost:3001/api/finance/profile', {
      monthlyIncome: 5500000 // Aumentar ingreso
    });
    console.log(`✅ Perfil actualizado. Nuevo ingreso: $${updateResponse.data.data.monthlyIncome.toLocaleString()}`);

    // 9. Probar eliminación de gasto
    if (expenses.length > 0) {
      console.log('\n7️⃣ Probando eliminación de gasto...');
      const expenseToDelete = expenses[expenses.length - 1];
      await axios.delete(`http://localhost:3001/api/finance/expenses/${expenseToDelete.id}`);
      console.log(`✅ Gasto eliminado: ${expenseToDelete.description}`);
    }

    // 10. Resumen final
    console.log('\n8️⃣ Resumen final del sistema...');
    const finalSummaryResponse = await axios.get('http://localhost:3001/api/finance/summary');
    const finalSummary = finalSummaryResponse.data.data;
    
    console.log('🎯 Estado final del sistema:');
    console.log(`   💰 Ingreso: $${finalSummary.totalIncome.toLocaleString()}`);
    console.log(`   💸 Gastado: $${finalSummary.totalSpent.toLocaleString()}`);
    console.log(`   💵 Disponible: $${finalSummary.totalRemaining.toLocaleString()}`);
    console.log(`   📊 Eficiencia del presupuesto: ${Math.round((finalSummary.totalSpent / finalSummary.totalBudget) * 100)}%`);

    console.log('\n✅ Prueba del sistema de finanzas completada exitosamente');
    console.log('🎉 El gestor de finanzas personales está funcionando correctamente');

  } catch (error) {
    console.error('❌ Error probando sistema de finanzas:', error.message);
    if (error.response) {
      console.log('📄 Respuesta del servidor:', error.response.data);
    }
  }
}

testFinanceSystem();