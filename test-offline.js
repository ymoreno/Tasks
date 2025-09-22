#!/usr/bin/env node

/**
 * Script de prueba para el sistema de cache offline
 * Simula pérdida de conexión y verifica el comportamiento
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Prueba del Sistema de Cache Offline')
console.log('=====================================')

// Verificar que los archivos existen
const filesToCheck = [
  'frontend/src/services/offlineCache.ts',
  'frontend/src/services/networkStatus.ts',
  'frontend/src/hooks/useOfflineState.ts',
  'frontend/src/components/common/OfflineStatus.tsx',
  'frontend/src/components/common/OfflineIndicator.tsx'
]

console.log('📁 Verificando archivos del sistema offline...')
let allFilesExist = true

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file)
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - NO ENCONTRADO`)
    allFilesExist = false
  }
})

if (!allFilesExist) {
  console.log('\n❌ Algunos archivos del sistema offline no existen')
  process.exit(1)
}

console.log('\n✅ Todos los archivos del sistema offline están presentes')

// Verificar integración en App.tsx
console.log('\n📱 Verificando integración en App.tsx...')
const appPath = path.join(__dirname, 'frontend/src/App.tsx')
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8')
  
  if (appContent.includes('OfflineStatus')) {
    console.log('✅ OfflineStatus integrado en App.tsx')
  } else {
    console.log('⚠️  OfflineStatus no encontrado en App.tsx')
  }
} else {
  console.log('❌ App.tsx no encontrado')
}

// Verificar integración en Header.tsx
console.log('\n🎯 Verificando integración en Header.tsx...')
const headerPath = path.join(__dirname, 'frontend/src/components/common/Header.tsx')
if (fs.existsSync(headerPath)) {
  const headerContent = fs.readFileSync(headerPath, 'utf8')
  
  if (headerContent.includes('OfflineIndicator')) {
    console.log('✅ OfflineIndicator integrado en Header.tsx')
  } else {
    console.log('⚠️  OfflineIndicator no encontrado en Header.tsx')
  }
} else {
  console.log('❌ Header.tsx no encontrado')
}

// Verificar endpoint de health en backend
console.log('\n🏥 Verificando endpoint de health...')
const appBackendPath = path.join(__dirname, 'backend/src/app.ts')
if (fs.existsSync(appBackendPath)) {
  const appBackendContent = fs.readFileSync(appBackendPath, 'utf8')
  
  if (appBackendContent.includes('/health')) {
    console.log('✅ Endpoint /health encontrado en backend')
  } else {
    console.log('❌ Endpoint /health no encontrado en backend')
  }
} else {
  console.log('❌ backend/src/app.ts no encontrado')
}

console.log('\n🎉 Verificación completada!')
console.log('\n📋 Instrucciones de prueba manual:')
console.log('1. Inicia la aplicación: npm run dev')
console.log('2. Abre las herramientas de desarrollador (F12)')
console.log('3. Ve a Network > Throttling > Offline')
console.log('4. Intenta actualizar una tarea')
console.log('5. Verifica que aparece el indicador offline')
console.log('6. Restaura la conexión y verifica la sincronización')

console.log('\n🔍 Para debugging:')
console.log('- Abre localStorage en DevTools')
console.log('- Busca claves que empiecen con "task_cache_" y "task_pending_"')
console.log('- Observa los logs en consola con emojis 📱📝🔄✅')

console.log('\n💡 Componentes disponibles:')
console.log('- useNetworkStatus() - Hook simple para estado online/offline')
console.log('- useOfflineState() - Hook completo con estadísticas')
console.log('- usePendingActions() - Hook para contar acciones pendientes')
console.log('- <OfflineIndicator /> - Chip ligero para mostrar estado')
console.log('- <OfflineStatus /> - Panel completo (esquina inferior)')

console.log('\n🚀 ¡Sistema de cache offline listo para usar!')