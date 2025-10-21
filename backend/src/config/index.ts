import path from 'path';

// Configuración centralizada de la aplicación
export const config = {
  // Configuración del servidor
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // CORS config
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      // Permitir cualquier IP local para desarrollo
      /^http:\/\/192\.168\.\d+\.\d+:3000$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:3000$/
    ],
    credentials: true,
  },

  // Configuración de archivos
  files: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB por defecto
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    allowedTypes: ['.csv', '.xlsx', '.xls'],
  },

  // Configuración de paths
  paths: {
    data: path.join(__dirname, '../../data'),
    uploads: path.join(__dirname, '../../uploads'),
    backups: path.join(__dirname, '../../data/backups'),
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Configuración de la API
  api: {
    prefix: '/api',
    version: 'v1',
  },
};

// Validar configuración crítica
export const validateConfig = (): void => {
  const requiredEnvVars = ['NODE_ENV'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Variable de entorno requerida no encontrada: ${envVar}`);
    }
  }

  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error(`Puerto inválido: ${config.server.port}`);
  }

  console.log('✅ Configuración validada correctamente');
};

export default config;