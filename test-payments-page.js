// Script para probar la página de pagos
const axios = require('axios');

async function testPaymentsEndpoint() {
  try {
    console.log('🧪 Probando endpoint de pagos...');
    
    const response = await axios.get('http://localhost:3001/api/payments');
    
    console.log('✅ Respuesta exitosa del servidor');
    console.log('📊 Estructura de datos:');
    console.log(`- Success: ${response.data.success}`);
    console.log(`- Message: ${response.data.message}`);
    console.log(`- Pagos encontrados: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      console.log('\n🎯 Ejemplo de pago:');
      const firstPayment = response.data.data[0];
      console.log(`- ID: ${firstPayment.id}`);
      console.log(`- Nombre: ${firstPayment.name}`);
      console.log(`- Categoría: ${firstPayment.category}`);
      console.log(`- Prioridad: ${firstPayment.priority}`);
      console.log(`- Descripción: ${firstPayment.description || 'N/A'}`);
      console.log(`- URL: ${firstPayment.url ? 'Sí' : 'No'}`);
    }
    
    console.log('\n🧪 Probando creación de pago...');
    const newPayment = {
      name: 'Test Pago Kiro',
      category: 'Test',
      amount: 150,
      status: 'pendiente',
      isRecurring: false,
      priority: 3,
      description: 'Pago de prueba creado por script'
    };
    
    const createResponse = await axios.post('http://localhost:3001/api/payments', newPayment, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Pago creado exitosamente:');
    console.log(`- ID: ${createResponse.data.data.id}`);
    console.log(`- Nombre: ${createResponse.data.data.name}`);
    console.log(`- Categoría: ${createResponse.data.data.category}`);
    
    console.log('\n✅ El endpoint de pagos funciona correctamente');
    console.log('🌐 Ahora puedes acceder a http://localhost:5173/payments en tu navegador');
    
  } catch (error) {
    console.error('❌ Error probando endpoint:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el backend esté ejecutándose en el puerto 3001');
    }
    if (error.response) {
      console.log('📄 Respuesta del servidor:', error.response.data);
    }
  }
}

testPaymentsEndpoint();