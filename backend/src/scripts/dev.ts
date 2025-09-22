#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

// Verificar que las carpetas necesarias existan
const requiredDirs = [
  path.join(__dirname, '../../data'),
  path.join(__dirname, '../../uploads'),
  path.join(__dirname, '../../data/backups'),
];

async function ensureDirectories() {
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`📁 Directorio creado: ${dir}`);
    }
  }
}

async function startDevelopmentServer() {
  logger.info('🔧 Iniciando servidor de desarrollo...');
  
  // Asegurar que los directorios existan
  await ensureDirectories();
  
  // Verificar que el archivo principal exista
  const appPath = path.join(__dirname, '../app.ts');
  if (!fs.existsSync(appPath)) {
    logger.error('❌ Archivo app.ts no encontrado');
    process.exit(1);
  }
  
  // Iniciar nodemon
  const nodemon = spawn('npx', ['nodemon'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '../..'),
  });
  
  nodemon.on('error', (error) => {
    logger.error('Error iniciando nodemon', error);
    process.exit(1);
  });
  
  nodemon.on('exit', (code) => {
    logger.info(`Nodemon terminó con código: ${code}`);
    process.exit(code || 0);
  });
  
  // Manejar señales de terminación
  process.on('SIGINT', () => {
    logger.info('🛑 Deteniendo servidor de desarrollo...');
    nodemon.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    logger.info('🛑 Deteniendo servidor de desarrollo...');
    nodemon.kill('SIGTERM');
  });
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  startDevelopmentServer().catch((error) => {
    logger.error('Error iniciando servidor de desarrollo', error);
    process.exit(1);
  });
}