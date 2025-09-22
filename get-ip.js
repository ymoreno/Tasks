#!/usr/bin/env node

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Buscar IPv4 no loopback
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const localIP = getLocalIP();

console.log('🌐 Información de Red');
console.log('====================');
console.log(`📱 IP Local: ${localIP}`);
console.log(`🖥️  Acceso desde PC: http://localhost:3000`);
console.log(`📱 Acceso desde celular: http://${localIP}:3000`);
console.log(`🔌 Backend API: http://${localIP}:3001/api`);
console.log('');
console.log('📋 Instrucciones:');
console.log('1. Asegúrate de que tu celular esté en la misma red WiFi');
console.log('2. Ejecuta: npm run dev');
console.log(`3. Abre en tu celular: http://${localIP}:3000`);
console.log('');
console.log('🔧 Si no funciona, verifica:');
console.log('- Firewall deshabilitado o con excepción para puertos 3000 y 3001');
console.log('- Ambos dispositivos en la misma red WiFi');
console.log('- IP correcta (puede cambiar si reinicias el router)');

module.exports = { getLocalIP };