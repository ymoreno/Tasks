#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testSimpleDashboard() {
  console.log('🧪 Prueba simple del dashboard...\n');

  try {
    // 1. Verificar backend
    console.log('1. Verificando backend...');
    await axios.get(`${API_BASE}/health`);
    console.log('✅ Backend OK\n');

    // 2. Crear perfil simple
    console.log('2. Creando perfil financiero...');
    const profileData = {
      monthlyIncome: 5000000,
      distributionType: 'recommended'
    };

    const profileResponse = await axios.post(`${API_BASE}/finance/profile`, profileData);
    console.log('✅ Perfil creado:', profileResponse.data);
    console.log('');

    // 3. Verificar categorías
    console.log('3. Verificando categorías...');
    const profile = profileResponse.data;
    if (profile && profile.categories) {
      console.log('✅ Categorías encontradas:', profile.categories.length);
      profile.categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.type}): ${cat.percentage}%`);
      });
    } else {
      console.log('❌ No se encontraron categorías');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testSimpleDashboard();