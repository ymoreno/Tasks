#!/bin/bash

# Script de configuración para el Administrador de Tareas
echo "🚀 Configurando Administrador de Tareas..."

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Se requiere Node.js 18+. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependencias del proyecto principal
echo "📦 Instalando dependencias principales..."
npm install

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install
cd ..

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

# Crear archivos de configuración de entorno
echo "⚙️ Creando archivos de configuración..."

# Backend .env
cat > backend/.env << EOL
NODE_ENV=development
PORT=3001
EOL

# Frontend .env
cat > frontend/.env << EOL
VITE_API_URL=http://localhost:3001/api
EOL

echo "✅ Configuración completada!"
echo ""
echo "🎯 Para ejecutar el proyecto:"
echo "   npm run dev          # Ejecutar backend y frontend"
echo "   npm run server:dev   # Solo backend (puerto 3001)"
echo "   npm run client:dev   # Solo frontend (puerto 3000)"
echo ""
echo "📚 Documentación disponible en README.md"