import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Importar configuración
import config, { validateConfig } from './config';

// Importar rutas
import { weeklyRoutes } from './routes/weeklyRoutes';
import taskRoutes from './routes/taskRoutes';
import { paymentRoutes } from './routes/paymentRoutes';
import { timeRoutes } from './routes/timeRoutes';
import { fileRoutes } from './routes/fileRoutes';
import { financeRoutes } from './routes/financeRoutes';
import debtRoutes from './routes/debtRoutes';
import historyRoutes from './routes/historyRoutes';
import { healthRoutes } from './routes/healthRoutes';

// Importar middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger, requestErrorLogger } from './middleware/requestLogger';

// Importar utilidades
import { logger } from './utils/logger';

// Validar configuración al inicio
try {
  validateConfig();
} catch (error) {
  logger.error('Error en la configuración:', error);
  process.exit(1);
}

const app = express();

// Middleware de seguridad y logging
app.use(helmet());
if (config.server.isDevelopment) {
  app.use(requestLogger);
} else {
  app.use(morgan('combined'));
}

// Configuración de CORS
app.use(cors({
  origin: config.server.isProduction
    ? ['https://tu-dominio.com']
    : config.cors.origin,
  credentials: config.cors.credentials
}));

// Middleware para parsing de JSON y archivos
const maxSize = `${Math.floor(config.files.maxSize / 1024 / 1024)}mb`;
app.use(express.json({ limit: maxSize }));
app.use(express.urlencoded({ extended: true, limit: maxSize }));

// Servir archivos estáticos (para archivos subidos)
app.use('/uploads', express.static(config.paths.uploads));

// Rutas de la API
app.use(`${config.api.prefix}/weekly`, weeklyRoutes);
app.use(`${config.api.prefix}/tasks`, taskRoutes);
app.use(`${config.api.prefix}/payments`, paymentRoutes);
app.use(`${config.api.prefix}/time`, timeRoutes);
app.use(`${config.api.prefix}/files`, fileRoutes);
app.use(`${config.api.prefix}/finance`, financeRoutes);
app.use(`${config.api.prefix}/debts`, debtRoutes);
app.use(`${config.api.prefix}/history`, historyRoutes);

// Rutas de health check
app.use('/', healthRoutes);

// Ruta de salud del servidor (mantener compatibilidad)
app.get(`${config.api.prefix}/health`, (req, res) => {
  res.json({
    status: 'OK',
    environment: config.server.env,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    config: {
      port: config.server.port,
      cors: config.cors.origin,
      maxFileSize: `${Math.floor(config.files.maxSize / 1024 / 1024)}MB`
    }
  });
});

// Servir archivos estáticos del frontend en producción
if (config.server.isProduction) {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Manejar rutas del frontend (SPA)
  app.get('*', (req, res) => {
    // No interceptar rutas de la API
    if (req.path.startsWith(config.api.prefix)) {
      return res.status(404).json({ success: false, error: `Ruta de API no encontrada - ${req.path}` });
    }
    return res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Middleware de manejo de errores
app.use(notFound);
app.use(requestErrorLogger);
app.use(errorHandler);

// Inicialización del estado diario al arrancar el servidor
const initializeDailyState = async () => {
  try {
    const { WeeklyTaskService } = await import('./services/dataService');
    await WeeklyTaskService.getCurrentDayState(); // Esto ejecutará el auto-reset si es necesario
    console.log('✅ Estado diario inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando estado diario:', error);
  }
};

// Iniciar servidor en todas las interfaces de red
app.listen(config.server.port, '0.0.0.0', async () => {
  // Inicializar estado diario
  await initializeDailyState();
  logger.success('🚀 Administrador de Tareas - Backend iniciado');
  logger.info('=====================================');
  logger.info(`📡 Servidor local: http://localhost:${config.server.port}`);
  logger.info(`📱 Acceso móvil: http://[TU_IP]:${config.server.port}`);
  logger.info(`🔗 API: http://localhost:${config.server.port}${config.api.prefix}`);
  logger.info(`🏥 Health: http://localhost:${config.server.port}${config.api.prefix}/health`);
  logger.info(`📊 Ambiente: ${config.server.env}`);
  logger.info(`🌐 CORS: ${config.cors.origin}`);
  logger.info(`📁 Uploads: ${config.paths.uploads}`);
  logger.info(`💾 Data: ${config.paths.data}`);
  logger.info('=====================================');
  logger.info('💡 Para acceder desde tu celular:');
  logger.info('   1. Encuentra tu IP local con: ifconfig | grep inet');
  logger.info('   2. Usa: http://[TU_IP]:3001 en tu celular');
  logger.info('=====================================');
});

export default app;