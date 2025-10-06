#!/usr/bin/env node

/**
 * Test simple para verificar que el backend esté funcionando después de los cambios de Lista
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`🔍 Testing ${endpoint} - ${description}`);
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    console.log(`✅ SUCCESS: ${endpoint} - Status ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ ERROR: ${endpoint} - ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testBackendHealth() {
  console.log('🚀 TESTING BACKEND HEALTH AFTER LISTA CHANGES\n');

  const endpoints = [
    ['/weekly/tasks', 'Get weekly tasks'],
    ['/weekly/current-day', 'Get current day state'],
    ['/weekly/rotation-summary', 'Get rotation summary'],
    ['/weekly/progress', 'Get weekly progress']
  ];

  let successCount = 0;
  let totalCount = endpoints.length;

  for (const [endpoint, description] of endpoints) {
    const success = await testEndpoint(endpoint, description);
    if (success) successCount++;
    console.log(''); // Empty line for readability
  }

  console.log(`📊 RESULTS: ${successCount}/${totalCount} endpoints working`);
  
  if (successCount === totalCount) {
    console.log('🎉 ALL ENDPOINTS WORKING - Backend is healthy!');
  } else {
    console.log('⚠️  SOME ENDPOINTS FAILING - Backend needs attention');
  }
}

// Ejecutar el test
if (require.main === module) {
  testBackendHealth().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(`Test failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testBackendHealth };