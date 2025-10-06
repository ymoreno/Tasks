#!/usr/bin/env node

/**
 * Test para verificar que Peliculas está configurado para empezar con AP/Par/Dis
 * el lunes 6 de octubre
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testPeliculasRotation() {
  try {
    console.log('🎬 VERIFICANDO ROTACIÓN DE PELICULAS');
    console.log('Confirmando que mañana lunes 6 de octubre empieza AP/Par/Dis\n');

    const response = await axios.get(`${BASE_URL}/weekly/tasks`);
    const weeklyTasks = response.data.data;
    
    // Buscar tarea Lista
    const listaTask = weeklyTasks.find(task => task.name === 'Lista');
    if (!listaTask) {
      console.log('❌ Tarea Lista no encontrada');
      return;
    }
    
    // Buscar subtarea Peliculas
    const peliculasSubtask = listaTask.subtasks.find(sub => sub.name === 'Peliculas');
    if (!peliculasSubtask) {
      console.log('❌ Subtarea Peliculas no encontrada');
      return;
    }
    
    // Verificar rotación actual
    const currentPeliculaId = peliculasSubtask.currentSubtaskId;
    const currentPelicula = peliculasSubtask.subtasks.find(sub => sub.id === currentPeliculaId);
    
    console.log('📊 ESTADO ACTUAL DE PELICULAS:');
    console.log(`   Subtarea actual: ${currentPelicula?.name || 'No encontrada'}`);
    console.log(`   ID actual: ${currentPeliculaId}`);
    
    // Verificar que sea AP/Par/Dis
    if (currentPelicula?.name === 'AP/Par/Dis') {
      console.log('✅ CORRECTO: Peliculas está configurado para AP/Par/Dis');
      console.log('✅ Mañana lunes 6 de octubre empezará con AP/Par/Dis');
    } else {
      console.log(`❌ INCORRECTO: Peliculas está en "${currentPelicula?.name}", debería ser "AP/Par/Dis"`);
    }
    
    // Mostrar secuencia completa
    console.log('\n🔄 SECUENCIA COMPLETA DE PELICULAS:');
    peliculasSubtask.subtasks.forEach((sub, index) => {
      const isCurrent = sub.id === currentPeliculaId;
      console.log(`   ${index + 1}. ${sub.name} ${isCurrent ? '← ACTUAL (para mañana lunes)' : ''}`);
    });
    
    // Mostrar próxima rotación
    const currentIndex = peliculasSubtask.subtasks.findIndex(sub => sub.id === currentPeliculaId);
    const nextIndex = (currentIndex + 1) % peliculasSubtask.subtasks.length;
    const nextPelicula = peliculasSubtask.subtasks[nextIndex];
    
    console.log(`\n📅 PRÓXIMA SEMANA (lunes 13 octubre): ${nextPelicula.name}`);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

// Ejecutar el test
testPeliculasRotation().then(() => {
  console.log('\n🏁 Verificación de rotación de Peliculas completada.');
});