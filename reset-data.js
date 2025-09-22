#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🗑️  Limpiando datos del Administrador de Tareas...');
console.log('================================================');

// Rutas de archivos de datos
const dataDir = path.join(__dirname, 'backend/data');
const backupDir = path.join(dataDir, 'backups');

// Archivos a eliminar
const filesToDelete = [
  path.join(dataDir, 'tasks.json'),
  path.join(dataDir, 'weekly-tasks.json'),
  path.join(dataDir, 'payments.json')
];

// Función para eliminar archivo si existe
function deleteFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Eliminado: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`ℹ️  No existe: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error eliminando ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

// Función para limpiar directorio de respaldos
function cleanBackups() {
  try {
    if (fs.existsSync(backupDir)) {
      const backupFiles = fs.readdirSync(backupDir);
      let deletedCount = 0;
      
      backupFiles.forEach(file => {
        const filePath = path.join(backupDir, file);
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
        } catch (error) {
          console.log(`❌ Error eliminando respaldo ${file}:`, error.message);
        }
      });
      
      console.log(`✅ Eliminados ${deletedCount} archivos de respaldo`);
      return deletedCount;
    } else {
      console.log('ℹ️  Directorio de respaldos no existe');
      return 0;
    }
  } catch (error) {
    console.log('❌ Error limpiando respaldos:', error.message);
    return 0;
  }
}

// Ejecutar limpieza
console.log('\n📁 Eliminando archivos de datos principales:');
let deletedFiles = 0;
filesToDelete.forEach(file => {
  if (deleteFileIfExists(file)) {
    deletedFiles++;
  }
});

console.log('\n📦 Limpiando respaldos:');
const deletedBackups = cleanBackups();

console.log('\n📊 Resumen de limpieza:');
console.log(`   • Archivos de datos eliminados: ${deletedFiles}`);
console.log(`   • Respaldos eliminados: ${deletedBackups}`);
console.log(`   • Total de archivos eliminados: ${deletedFiles + deletedBackups}`);

console.log('\n🎯 Estado del sistema:');
console.log('   ✅ Datos limpiados completamente');
console.log('   ✅ Sistema listo para test completo');
console.log('   ✅ Al iniciar la app, se creará todo desde cero');

console.log('\n💡 Para test completo mañana:');
console.log('   1. npm run dev');
console.log('   2. Los datos se crearán automáticamente al usar la app');
console.log('   3. Puedes reimportar tus datos CSV si quieres');

console.log('\n🔄 Para restaurar datos de ejemplo:');
console.log('   npx ts-node backend/src/scripts/importInitialData.ts');

console.log('\n✨ ¡Listo para el test de mañana!');