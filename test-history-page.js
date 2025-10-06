// Script para probar la página de historial
const axios = require('axios');

async function testHistoryEndpoint() {
  try {
    console.log('🧪 Probando endpoint de historial...');
    
    const response = await axios.get('http://localhost:3001/api/history');
    
    console.log('✅ Respuesta exitosa del servidor');
    console.log('📊 Estructura de datos:');
    console.log(`- Success: ${response.data.success}`);
    console.log(`- Message: ${response.data.message}`);
    console.log(`- Items en historial: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      console.log('\n🎯 Items en el historial:');
      response.data.data.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} (${item.type})`);
        console.log(`   - ID: ${item.id}`);
        console.log(`   - Completado: ${new Date(item.completedDate).toLocaleString()}`);
        console.log(`   - Tiempo: ${item.timeSpent} ms`);
        console.log('');
      });
    } else {
      console.log('📭 No hay items en el historial');
    }
    
    console.log('✅ El endpoint de historial funciona correctamente');
    console.log('🌐 Ahora puedes acceder a http://localhost:5173/history en tu navegador');
    
    // Simular el comportamiento del frontend
    console.log('\n🧪 Simulando comportamiento del frontend...');
    const historyData = response.data.data || [];
    console.log(`📊 Datos procesados: ${historyData.length} items`);
    
    const bookCount = historyData.filter(item => item.type === 'Book').length;
    const gameCount = historyData.filter(item => item.type === 'Game').length;
    const courseCount = historyData.filter(item => item.type === 'Course').length;
    
    console.log(`📚 Libros: ${bookCount}`);
    console.log(`🎮 Juegos: ${gameCount}`);
    console.log(`🎓 Cursos: ${courseCount}`);
    
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

testHistoryEndpoint();