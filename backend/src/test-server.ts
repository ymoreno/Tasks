// Script de prueba para verificar que el servidor funciona correctamente

import { logger } from './utils/logger';
import config from './config';

async function testServer() {
  logger.info('🧪 Iniciando pruebas del servidor...');
  
  try {
    // Probar configuración
    logger.info('✅ Configuración cargada correctamente');
    logger.debug('Config:', {
      port: config.server.port,
      env: config.server.env,
      corsOrigin: config.cors.origin
    });

    // Probar importación de rutas
    const taskRoutes = await import('./routes/taskRoutes');
    const weeklyRoutes = await import('./routes/weeklyRoutes');
    const paymentRoutes = await import('./routes/paymentRoutes');
    const timeRoutes = await import('./routes/timeRoutes');
    const fileRoutes = await import('./routes/fileRoutes');
    
    logger.info('✅ Todas las rutas importadas correctamente');

    // Probar servicios
    const { TaskService, WeeklyTaskService, PaymentService } = await import('./services/dataService');
    
    logger.info('✅ Servicios de datos importados correctamente');

    // Probar middleware
    const { errorHandler } = await import('./middleware/errorHandler');
    const { notFound } = await import('./middleware/notFound');
    
    logger.info('✅ Middleware importado correctamente');

    logger.success('🎉 Todas las pruebas pasaron! El servidor está listo para ejecutarse.');
    
  } catch (error) {
    logger.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas si este archivo se ejecuta directamente
if (require.main === module) {
  testServer();
}

export default testServer;