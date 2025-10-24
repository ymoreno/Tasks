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
    
    try {
      // Verificar que el directorio fuente existe
      if (!fs.existsSync(srcDataDir)) {
        console.error(`❌ Directorio fuente no existe: ${srcDataDir}`);
        throw new Error(`Directorio de datos no encontrado: ${srcDataDir}`);
      }
      
      // Crear directorio de destino
      if (!fs.existsSync(destDataDir)) {
        fs.mkdirSync(destDataDir, { recursive: true });
        console.log(`📁 Directorio creado: ${destDataDir}`);
      }
      
      // Listar archivos en el directorio fuente
      const allFiles = fs.readdirSync(srcDataDir);
      console.log(`📋 Archivos encontrados: ${allFiles.join(', ')}`);
      
      // Copiar archivos JSON
      const dataFiles = allFiles.filter(file => file.endsWith('.json'));
      console.log(`📄 Archivos JSON a copiar: ${dataFiles.join(', ')}`);
      
      if (dataFiles.length === 0) {
        console.warn('⚠️ No se encontraron archivos JSON para copiar');
      }
      
      for (const file of dataFiles) {
        const srcFile = path.join(srcDataDir, file);
        const destFile = path.join(destDataDir, file);
        
        // Verificar que el archivo fuente existe
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, destFile);
          const stats = fs.statSync(destFile);
          console.log(`✅ Copiado: ${file} (${stats.size} bytes)`);
        } else {
          console.error(`❌ Archivo fuente no existe: ${srcFile}`);
        }
      }
      
      // Verificar archivos copiados
      const copiedFiles = fs.readdirSync(destDataDir);
      console.log(`📁 Archivos en destino: ${copiedFiles.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Error copiando archivos de datos:', error.message);
      // No fallar el build por esto, continuar
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