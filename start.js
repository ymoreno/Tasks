#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Administrador de Tareas...');

// Cambiar al directorio del backend
process.chdir(path.join(__dirname, 'backend'));

// Configurar variables de entorno
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3001';

console.log(`📡 Puerto: ${process.env.PORT}`);
console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);

// Ejecutar la aplicación
const app = spawn('node', ['dist/app.js'], {
  stdio: 'inherit',
  env: process.env
});

app.on('error', (error) => {
  console.error('❌ Error al iniciar la aplicación:', error);
  process.exit(1);
});

app.on('exit', (code) => {
  console.log(`🔄 Aplicación terminó con código: ${code}`);
  process.exit(code);
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando aplicación...');
  app.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando aplicación...');
  app.kill('SIGINT');
});