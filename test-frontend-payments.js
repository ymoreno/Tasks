// Script para simular el comportamiento del frontend con pagos
const axios = require('axios');

// Simular el comportamiento del paymentService
const paymentService = {
  async getAllPayments() {
    const response = await axios.get('http://localhost:3001/api/payments');
    return response.data.data || [];
  },

  async createPayment(paymentData) {
    const response = await axios.post('http://localhost:3001/api/payments', paymentData, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data.data;
  }
};

// Simular el comportamiento del contexto
async function testPaymentContext() {
  try {
    console.log('🧪 Simulando comportamiento del PaymentContext...\n');
    
    // Simular fetchPayments
    console.log('🔄 Ejecutando fetchPayments...');
    const payments = await paymentService.getAllPayments();
    console.log(`✅ Pagos cargados: ${payments.length} items`);
    console.log(`📊 Tipos de datos: ${typeof payments}, isArray: ${Array.isArray(payments)}`);
    
    if (payments.length > 0) {
      console.log('🎯 Primer pago:');
      console.log(`   - Nombre: ${payments[0].name}`);
      console.log(`   - Categoría: ${payments[0].category}`);
      console.log(`   - ID: ${payments[0].id}`);
    }
    
    // Simular createPayment
    console.log('\n🔄 Ejecutando createPayment...');
    const newPaymentData = {
      name: 'Test Frontend Payment',
      category: 'Test Frontend',
      amount: 200,
      status: 'pendiente',
      isRecurring: false,
      priority: 2,
      description: 'Pago creado desde simulación frontend'
    };
    
    const newPayment = await paymentService.createPayment(newPaymentData);
    console.log('✅ Pago creado exitosamente:');
    console.log(`   - ID: ${newPayment.id}`);
    console.log(`   - Nombre: ${newPayment.name}`);
    console.log(`   - Categoría: ${newPayment.category}`);
    
    // Verificar que se agregó a la lista
    console.log('\n🔄 Verificando lista actualizada...');
    const updatedPayments = await paymentService.getAllPayments();
    console.log(`✅ Lista actualizada: ${updatedPayments.length} items`);
    
    const createdPayment = updatedPayments.find(p => p.id === newPayment.id);
    if (createdPayment) {
      console.log('✅ El pago creado está en la lista');
    } else {
      console.log('❌ El pago creado NO está en la lista');
    }
    
    console.log('\n✅ Simulación del frontend completada exitosamente');
    console.log('💡 Si ves este mensaje, el problema no está en el backend');
    console.log('🔍 Revisa la consola del navegador para ver los logs del frontend');
    
  } catch (error) {
    console.error('❌ Error en simulación:', error.message);
    if (error.response) {
      console.log('📄 Respuesta del servidor:', error.response.data);
    }
  }
}

testPaymentContext();