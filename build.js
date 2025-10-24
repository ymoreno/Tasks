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
    
    // Copiar archivos de datos al directorio dist del backend
    console.log('📁 Copiando archivos de datos...');
    const fs = require('fs');
    const srcDataDir = path.join(__dirname, 'backend', 'data');
    const destDataDir = path.join(__dirname, 'backend', 'dist', 'data');
    
    // Crear directorio de destino
    if (!fs.existsSync(destDataDir)) {
      fs.mkdirSync(destDataDir, { recursive: true });
    }
    
    // Copiar archivos JSON
    const dataFiles = fs.readdirSync(srcDataDir).filter(file => file.endsWith('.json'));
    for (const file of dataFiles) {
      const srcFile = path.join(srcDataDir, file);
      const destFile = path.join(destDataDir, file);
      fs.copyFileSync(srcFile, destFile);
      console.log(`📄 Copiado: ${file}`);
    }
    
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