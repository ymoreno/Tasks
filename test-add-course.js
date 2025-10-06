// Script para probar la funcionalidad de agregar cursos
const axios = require('axios');

async function testAddCourse() {
  try {
    console.log('🧪 Probando funcionalidad de agregar cursos...\n');
    
    // Obtener cursos actuales
    console.log('📚 Obteniendo cursos actuales...');
    const beforeResponse = await axios.get('http://localhost:3001/api/weekly/unfinished-courses');
    const coursesBefore = beforeResponse.data.data;
    console.log(`- Cursos antes: ${coursesBefore.length}`);
    
    const practicasBefore = coursesBefore.filter(c => c.parentSubtask === 'Practicas').length;
    const relatedBefore = coursesBefore.filter(c => c.parentSubtask === 'Related').length;
    console.log(`- Prácticas: ${practicasBefore}, Related: ${relatedBefore}`);
    
    // Agregar un curso a Prácticas
    console.log('\n🔄 Agregando curso a Prácticas...');
    const newPracticasCourse = `Test Prácticas ${Date.now()}`;
    await axios.post('http://localhost:3001/api/weekly/add-course', {
      parentSubtaskId: 'sub_mac_practicas',
      courseName: newPracticasCourse
    });
    console.log(`✅ Curso agregado: "${newPracticasCourse}"`);
    
    // Agregar un curso a Related
    console.log('\n🔄 Agregando curso a Related...');
    const newRelatedCourse = `Test Related ${Date.now()}`;
    await axios.post('http://localhost:3001/api/weekly/add-course', {
      parentSubtaskId: 'sub_mac_related',
      courseName: newRelatedCourse
    });
    console.log(`✅ Curso agregado: "${newRelatedCourse}"`);
    
    // Verificar que se agregaron
    console.log('\n📚 Verificando cursos después de agregar...');
    const afterResponse = await axios.get('http://localhost:3001/api/weekly/unfinished-courses');
    const coursesAfter = afterResponse.data.data;
    console.log(`- Cursos después: ${coursesAfter.length}`);
    
    const practicasAfter = coursesAfter.filter(c => c.parentSubtask === 'Practicas').length;
    const relatedAfter = coursesAfter.filter(c => c.parentSubtask === 'Related').length;
    console.log(`- Prácticas: ${practicasAfter}, Related: ${relatedAfter}`);
    
    // Verificar incremento
    const practicasIncrement = practicasAfter - practicasBefore;
    const relatedIncrement = relatedAfter - relatedBefore;
    
    console.log('\n📈 Resultados:');
    console.log(`- Incremento Prácticas: +${practicasIncrement}`);
    console.log(`- Incremento Related: +${relatedIncrement}`);
    
    if (practicasIncrement === 1 && relatedIncrement === 1) {
      console.log('✅ ¡Funcionalidad de agregar cursos funciona correctamente!');
    } else {
      console.log('❌ Algo salió mal con la funcionalidad de agregar cursos');
    }
    
    // Buscar los cursos agregados
    const addedPracticasCourse = coursesAfter.find(c => c.name === newPracticasCourse);
    const addedRelatedCourse = coursesAfter.find(c => c.name === newRelatedCourse);
    
    if (addedPracticasCourse && addedRelatedCourse) {
      console.log('\n🎯 Cursos agregados encontrados:');
      console.log(`- "${addedPracticasCourse.name}" en ${addedPracticasCourse.parentSubtask}`);
      console.log(`- "${addedRelatedCourse.name}" en ${addedRelatedCourse.parentSubtask}`);
    }
    
    console.log('\n✅ Prueba completada exitosamente');
    console.log('🌐 Ahora puedes usar la página de Cursos no Terminados para agregar más cursos');
    
  } catch (error) {
    console.error('❌ Error probando funcionalidad:', error.message);
    if (error.response) {
      console.log('📄 Respuesta del servidor:', error.response.data);
    }
  }
}

testAddCourse();