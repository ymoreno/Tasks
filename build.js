#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔨 Iniciando build optimizado...');

// Función para ejecutar comandos con límite de memoria
function runCommand(command, args, cwd, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📂 Ejecutando en ${cwd}: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=1024',
        ...options.env
      }
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falló con código ${code}`));
      }
    });
  });
}

async function build() {
  try {
    // Build backend
    console.log('🔧 Construyendo backend...');
    await runCommand('npm', ['install'], path.join(__dirname, 'backend'));
    await runCommand('npm', ['run', 'build'], path.join(__dirname, 'backend'));
    
    // Build frontend con límite de memoria
    console.log('⚛️ Construyendo frontend...');
    await runCommand('npm', ['install'], path.join(__dirname, 'frontend'));
    await runCommand('npm', ['run', 'build'], path.join(__dirname, 'frontend'), {
      env: { NODE_OPTIONS: '--max-old-space-size=1024' }
    });
    
    console.log('✅ Build completado exitosamente');
  } catch (error) {
    console.error('❌ Error durante el build:', error.message);
    process.exit(1);
  }
}

build();