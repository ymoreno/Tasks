#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del proyecto...\n');

// Verificar estructura de directorios
const requiredDirs = [
  'backend/src/routes',
  'backend/src/services', 
  'backend/src/middleware',
  'backend/src/types',
  'backend/data',
  'backend/uploads',
  'frontend/src/components/common',
  'frontend/src/components/tasks',
  'frontend/src/components/weekly',
  'frontend/src/components/payments',
  'frontend/src/contexts',
  'frontend/src/services',
  'frontend/src/types'
];

let allDirsExist = true;

console.log('📁 Verificando directorios:');
requiredDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
  if (!exists) allDirsExist = false;
});

// Verificar archivos principales
const requiredFiles = [
  'package.json',
  'backend/package.json',
  'backend/tsconfig.json',
  'backend/src/app.ts',
  'frontend/package.json',
  'frontend/tsconfig.json',
  'frontend/vite.config.ts',
  'frontend/index.html',
  'README.md',
  '.gitignore'
];

let allFilesExist = true;

console.log('\n📄 Verificando archivos principales:');
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Verificar dependencias instaladas
console.log('\n📦 Verificando dependencias:');

const backendPackageJson = path.join(__dirname, 'backend/package.json');
const frontendPackageJson = path.join(__dirname, 'frontend/package.json');

if (fs.existsSync(backendPackageJson)) {
  const backendNodeModules = path.join(__dirname, 'backend/node_modules');
  const backendDepsInstalled = fs.existsSync(backendNodeModules);
  console.log(`  ${backendDepsInstalled ? '✅' : '❌'} Backend dependencies`);
} else {
  console.log('  ❌ Backend package.json not found');
}

if (fs.existsSync(frontendPackageJson)) {
  const frontendNodeModules = path.join(__dirname, 'frontend/node_modules');
  const frontendDepsInstalled = fs.existsSync(frontendNodeModules);
  console.log(`  ${frontendDepsInstalled ? '✅' : '❌'} Frontend dependencies`);
} else {
  console.log('  ❌ Frontend package.json not found');
}

// Resumen
console.log('\n📊 Resumen:');
if (allDirsExist && allFilesExist) {
  console.log('✅ Configuración del proyecto completada exitosamente!');
  console.log('\n🚀 Próximos pasos:');
  console.log('  1. Ejecutar: npm run install:all (si no se han instalado las dependencias)');
  console.log('  2. Ejecutar: npm run dev (para iniciar desarrollo)');
  console.log('  3. Abrir: http://localhost:3000 (frontend) y http://localhost:3001/api/health (backend)');
} else {
  console.log('❌ Hay problemas en la configuración del proyecto');
  console.log('   Ejecuta el script setup.sh para completar la configuración');
}

console.log('\n📚 Documentación disponible en README.md');