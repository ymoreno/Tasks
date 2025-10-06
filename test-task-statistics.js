// Script para probar las estadísticas por tarea
const axios = require('axios');

async function testTaskStatistics() {
  try {
    console.log('🧪 Probando estadísticas por tarea...\n');

    const periods = ['week', 'month', 'quarter', 'semester', 'year', 'total'];
    
    for (const period of periods) {
      console.log(`📊 Estadísticas para período: ${period.toUpperCase()}`);
      console.log('='.repeat(50));
      
      try {
        const response = await axios.get(`http://localhost:3001/api/weekly/task-statistics?period=${period}`);
        const statistics = response.data.data;
        
        if (statistics.length === 0) {
          console.log(`   No hay datos disponibles para ${period}`);
        } else {
          console.log(`   Total de tareas con datos: ${statistics.length}`);
          
          // Mostrar top 5 tareas por tiempo
          const sortedStats = statistics
            .filter(stat => (stat.periodTime || stat.totalTime) > 0)
            .sort((a, b) => (b.periodTime || b.totalTime) - (a.periodTime || a.totalTime))
            .slice(0, 5);
          
          if (sortedStats.length > 0) {
            console.log(`   Top ${sortedStats.length} tareas por tiempo:`);
            sortedStats.forEach((stat, index) => {
              const time = stat.periodTime || stat.totalTime;
              const hours = Math.floor(time / (1000 * 60 * 60));
              const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
              const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
              
              console.log(`   ${index + 1}. ${stat.taskName}: ${timeStr}`);
              
              if (period === 'total') {
                console.log(`      Sesiones: ${stat.totalSessions}, Promedio: ${Math.floor(stat.averageTime / (1000 * 60))}min`);
              }
            });
          } else {
            console.log(`   No hay tareas con tiempo registrado para ${period}`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error obteniendo estadísticas para ${period}: ${error.message}`);
      }
      
      console.log(''); // Línea en blanco
    }

    // Probar estadísticas totales con más detalle
    console.log('📈 Análisis detallado de estadísticas totales:');
    console.log('='.repeat(50));
    
    try {
      const totalResponse = await axios.get('http://localhost:3001/api/weekly/task-statistics?period=total');
      const totalStats = totalResponse.data.data;
      
      if (totalStats.length > 0) {
        let totalTime = 0;
        let totalSessions = 0;
        
        console.log('Desglose por tarea:');
        totalStats.forEach(stat => {
          totalTime += stat.totalTime;
          totalSessions += stat.totalSessions;
          
          const hours = Math.floor(stat.totalTime / (1000 * 60 * 60));
          const minutes = Math.floor((stat.totalTime % (1000 * 60 * 60)) / (1000 * 60));
          const avgMinutes = Math.floor(stat.averageTime / (1000 * 60));
          
          console.log(`• ${stat.taskName}:`);
          console.log(`  - Tiempo total: ${hours}h ${minutes}min`);
          console.log(`  - Sesiones: ${stat.totalSessions}`);
          console.log(`  - Promedio por sesión: ${avgMinutes}min`);
          console.log(`  - Días completados: ${stat.completedDays}`);
          
          // Mostrar distribución por períodos
          console.log(`  - Distribución temporal:`);
          console.log(`    * Última semana: ${Math.floor(stat.timeByPeriod.week / (1000 * 60))}min`);
          console.log(`    * Último mes: ${Math.floor(stat.timeByPeriod.month / (1000 * 60))}min`);
          console.log(`    * Último trimestre: ${Math.floor(stat.timeByPeriod.quarter / (1000 * 60))}min`);
          console.log('');
        });
        
        const totalHours = Math.floor(totalTime / (1000 * 60 * 60));
        const totalMinutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        
        console.log('📊 Resumen general:');
        console.log(`- Tiempo total invertido: ${totalHours}h ${totalMinutes}min`);
        console.log(`- Total de sesiones: ${totalSessions}`);
        console.log(`- Promedio por sesión: ${totalSessions > 0 ? Math.floor((totalTime / totalSessions) / (1000 * 60)) : 0}min`);
        console.log(`- Tareas con actividad: ${totalStats.filter(s => s.totalTime > 0).length}`);
        
      } else {
        console.log('No hay datos históricos disponibles');
      }
      
    } catch (error) {
      console.log(`❌ Error en análisis detallado: ${error.message}`);
    }

    console.log('\n✅ Prueba de estadísticas por tarea completada');

  } catch (error) {
    console.error('❌ Error general probando estadísticas:', error.message);
    if (error.response) {
      console.log('📄 Respuesta del servidor:', error.response.data);
    }
  }
}

testTaskStatistics();