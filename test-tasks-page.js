// Script para probar la página de tareas
const axios = require('axios');

async function testTasksEndpoint() {
  try {
    console.log('🧪 Probando endpoint de tareas...');
    
    const response = await axios.get('http://localhost:3001/api/tasks');
    
    console.log('✅ Respuesta exitosa del servidor');
    console.log('📊 Estructura de datos:');
    console.log(`- Success: ${response.data.success}`);
    console.log(`- Message: ${response.data.message}`);
    
    const categories = Object.keys(response.data.data);
    console.log(`- Categorías encontradas: ${categories.length}`);
    
    categories.forEach(category => {
      const tasks = response.data.data[category].tasks;
      console.log(`  • ${category}: ${tasks.length} tareas`);
    });
    
    console.log('\n🎯 Ejemplo de tarea:');
    const firstCategory = categories[0];
    const firstTask = response.data.data[firstCategory].tasks[0];
    console.log(`- ID: ${firstTask.id}`);
    console.log(`- Nombre: ${firstTask.name}`);
    console.log(`- Categoría: ${firstTask.category}`);
    console.log(`- Puntuaciones: ${firstTask.scores.length} registradas`);
    console.log(`- Completada: ${firstTask.completed}`);
    
    console.log('\n✅ El endpoint de tareas funciona correctamente');
    console.log('🌐 Ahora puedes acceder a http://localhost:5173/tasks en tu navegador');
    
  } catch (error) {
    console.error('❌ Error probando endpoint:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el backend esté ejecutándose en el puerto 3001');
    }
  }
}

testTasksEndpoint();