// Script para probar la página de cursos no terminados
const axios = require('axios');

async function testUnfinishedCoursesEndpoint() {
  try {
    console.log('🧪 Probando endpoint de cursos no terminados...');
    
    const response = await axios.get('http://localhost:3001/api/weekly/unfinished-courses');
    
    console.log('✅ Respuesta exitosa del servidor');
    console.log('📊 Estructura de datos:');
    console.log(`- Success: ${response.data.success}`);
    console.log(`- Message: ${response.data.message}`);
    console.log(`- Cursos no terminados: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      console.log('\n📚 Categorías de cursos:');
      
      // Agrupar por tarea padre
      const coursesByParent = {};
      response.data.data.forEach(course => {
        const key = course.parentSubtask 
          ? `${course.parentTask} -> ${course.parentSubtask}`
          : course.parentTask;
        
        if (!coursesByParent[key]) {
          coursesByParent[key] = [];
        }
        coursesByParent[key].push(course);
      });
      
      Object.keys(coursesByParent).forEach(parent => {
        console.log(`\n🎯 ${parent} (${coursesByParent[parent].length} cursos):`);
        coursesByParent[parent].slice(0, 5).forEach((course, index) => {
          console.log(`   ${index + 1}. ${course.name}`);
        });
        if (coursesByParent[parent].length > 5) {
          console.log(`   ... y ${coursesByParent[parent].length - 5} más`);
        }
      });
      
      console.log('\n📈 Estadísticas:');
      const macCourses = response.data.data.filter(c => c.parentTask === 'Mac').length;
      const practicasCourses = response.data.data.filter(c => c.parentSubtask === 'Practicas').length;
      const relatedCourses = response.data.data.filter(c => c.parentSubtask === 'Related').length;
      
      console.log(`- Cursos de Mac: ${macCourses}`);
      console.log(`- Cursos de Prácticas: ${practicasCourses}`);
      console.log(`- Cursos Related: ${relatedCourses}`);
      
    } else {
      console.log('📭 No hay cursos no terminados');
    }
    
    console.log('\n✅ El endpoint de cursos no terminados funciona correctamente');
    console.log('🌐 Ahora puedes acceder a http://localhost:5173/unfinished-courses en tu navegador');
    
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

testUnfinishedCoursesEndpoint();