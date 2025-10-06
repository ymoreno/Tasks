// Script para probar los cambios en el sistema de pagos
const axios = require('axios');

async function testPaymentChanges() {
  try {
    console.log('🧪 Probando cambios en el sistema de pagos...\n');

    // 1. Crear un pago de prueba con prioridad por defecto (10)
    console.log('1️⃣ Creando pago con prioridad por defecto...');
    const newPayment = {
      name: 'Pago de Prueba',
      amount: 50000,
      category: 'Servicios',
      description: 'Pago de prueba para verificar funcionalidades',
      status: 'pendiente',
      isRecurring: false,
      priority: 5, // Prioridad por defecto (media)
      dueDate: new Date().toISOString()
    };

    const createResponse = await axios.post('http://localhost:3001/api/payments', newPayment);
    const createdPayment = createResponse.data.data;
    console.log(`✅ Pago creado: ${createdPayment.name} (Prioridad: ${createdPayment.priority} - Media)`);

    // 2. Crear un pago recurrente semestral
    console.log('\n2️⃣ Creando pago recurrente semestral...');
    const recurringPayment = {
      name: 'Pago Semestral',
      amount: 120000,
      category: 'Suscripciones',
      description: 'Pago recurrente cada 6 meses',
      status: 'pendiente',
      isRecurring: true,
      recurrence: 'semestral',
      priority: 3,
      dueDate: new Date().toISOString()
    };

    const recurringResponse = await axios.post('http://localhost:3001/api/payments', recurringPayment);
    const createdRecurring = recurringResponse.data.data;
    console.log(`✅ Pago recurrente creado: ${createdRecurring.name} (${createdRecurring.recurrence})`);

    // 3. Obtener todos los pagos
    console.log('\n3️⃣ Obteniendo todos los pagos...');
    const paymentsResponse = await axios.get('http://localhost:3001/api/payments');
    const payments = paymentsResponse.data.data;
    console.log(`📋 Total de pagos: ${payments.length}`);
    
    payments.forEach(payment => {
      console.log(`   • ${payment.name} - Prioridad: ${payment.priority} - Recurrente: ${payment.isRecurring ? payment.recurrence : 'No'}`);
    });

    // 4. Probar disminución de prioridades (simulando inicio de mes)
    console.log('\n4️⃣ Probando disminución de prioridades (inicio de mes)...');
    const decreaseResponse = await axios.post('http://localhost:3001/api/payments/decrease-priorities');
    const updatedCount = decreaseResponse.data.data.updatedCount;
    console.log(`✅ Prioridades disminuidas (menos críticas) para ${updatedCount} pagos`);

    // Verificar cambios
    const updatedPaymentsResponse = await axios.get('http://localhost:3001/api/payments');
    const updatedPayments = updatedPaymentsResponse.data.data;
    console.log('📊 Prioridades después de la disminución:');
    updatedPayments.forEach(payment => {
      console.log(`   • ${payment.name} - Prioridad: ${payment.priority}`);
    });

    // 5. Ejecutar pago no recurrente
    console.log('\n5️⃣ Ejecutando pago no recurrente...');
    const nonRecurringPayment = updatedPayments.find(p => !p.isRecurring);
    if (nonRecurringPayment) {
      const executeResponse = await axios.post(`http://localhost:3001/api/payments/${nonRecurringPayment.id}/execute`);
      const result = executeResponse.data.data;
      console.log(`✅ ${executeResponse.data.message}`);
      console.log(`   Movido al histórico: ${result.moved}`);
    }

    // 6. Ejecutar pago recurrente
    console.log('\n6️⃣ Ejecutando pago recurrente...');
    const recurringPaymentToExecute = updatedPayments.find(p => p.isRecurring);
    if (recurringPaymentToExecute) {
      const executeRecurringResponse = await axios.post(`http://localhost:3001/api/payments/${recurringPaymentToExecute.id}/execute`);
      const recurringResult = executeRecurringResponse.data.data;
      console.log(`✅ ${executeRecurringResponse.data.message}`);
      console.log(`   Movido al histórico: ${recurringResult.moved}`);
      if (recurringResult.newPayment) {
        const priorityLabel = recurringResult.newPayment.priority === 1 ? 'Crítica' : 
                             recurringResult.newPayment.priority <= 3 ? 'Alta' : 
                             recurringResult.newPayment.priority <= 6 ? 'Media' : 'Baja';
        console.log(`   Nuevo pago creado con prioridad: ${recurringResult.newPayment.priority} (${priorityLabel})`);
        console.log(`   Nueva fecha de vencimiento: ${new Date(recurringResult.newPayment.dueDate).toLocaleDateString()}`);
      }
    }

    // 7. Verificar histórico
    console.log('\n7️⃣ Verificando histórico de pagos...');
    try {
      const historyResponse = await axios.get('http://localhost:3001/api/payments/history');
      const history = historyResponse.data.data;
      console.log(`📚 Pagos en histórico: ${history.length}`);
      history.forEach(payment => {
        console.log(`   • ${payment.name} - Pagado: ${new Date(payment.paidDate).toLocaleDateString()}`);
      });
    } catch (error) {
      console.log('📚 Histórico vacío o no disponible');
    }

    // 8. Verificar pagos actuales después de las ejecuciones
    console.log('\n8️⃣ Estado final de pagos activos...');
    const finalPaymentsResponse = await axios.get('http://localhost:3001/api/payments');
    const finalPayments = finalPaymentsResponse.data.data;
    console.log(`📋 Pagos activos restantes: ${finalPayments.length}`);
    finalPayments.forEach(payment => {
      console.log(`   • ${payment.name} - Prioridad: ${payment.priority} - Estado: ${payment.status}`);
    });

    console.log('\n✅ Prueba de cambios en pagos completada exitosamente');

  } catch (error) {
    console.error('❌ Error probando cambios en pagos:', error.message);
    if (error.response) {
      console.log('📄 Respuesta del servidor:', error.response.data);
    }
  }
}

testPaymentChanges();