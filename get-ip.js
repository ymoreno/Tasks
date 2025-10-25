#!/usr/bin/env node

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const localIP = getLocalIP();

console.log('🌐 Información de Red:');
console.log('=====================================');
console.log(`📡 IP Local: ${localIP}`);
console.log(`🖥️  Frontend: http://localhost:3000`);
console.log(`⚙️  Backend: http://localhost:3001`);
console.log('=====================================');
console.log('📱 Para acceso móvil:');
console.log(`   Frontend: http://${localIP}:3000`);
console.log(`   Backend: http://${localIP}:3001`);
console.log('=====================================');