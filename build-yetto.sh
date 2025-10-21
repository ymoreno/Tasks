#!/bin/bash

echo "🐳 Construyendo y subiendo imágenes Docker"

# Verificar que estés logueado en Docker Hub
echo "🔐 Verificando login en Docker Hub..."
if ! docker info | grep -q "Username"; then
    echo "❌ No estás logueado en Docker Hub. Ejecuta: docker login"
    exit 1
fi

# Construir imagen del backend
echo "🔨 Construyendo imagen del backend..."
docker build -t your-dockerhub-username/administrador-tareas-backend:latest ./backend

if [ $? -ne 0 ]; then
    echo "❌ Error construyendo imagen del backend"
    exit 1
fi

# Construir imagen del frontend
echo "🔨 Construyendo imagen del frontend..."
docker build -t your-dockerhub-username/administrador-tareas-frontend:latest ./frontend

if [ $? -ne 0 ]; then
    echo "❌ Error construyendo imagen del frontend"
    exit 1
fi

# Subir imagen del backend
echo "⬆️ Subiendo imagen del backend..."
docker push your-dockerhub-username/administrador-tareas-backend:latest

if [ $? -ne 0 ]; then
    echo "❌ Error subiendo imagen del backend"
    exit 1
fi

# Subir imagen del frontend
echo "⬆️ Subiendo imagen del frontend..."
docker push your-dockerhub-username/administrador-tareas-frontend:latest

if [ $? -ne 0 ]; then
    echo "❌ Error subiendo imagen del frontend"
    exit 1
fi

echo "✅ Imágenes subidas exitosamente!"
echo ""
echo "📋 Imágenes disponibles en Docker Hub:"
echo "  Backend:  your-dockerhub-username/administrador-tareas-backend:latest"
echo "  Frontend: your-dockerhub-username/administrador-tareas-frontend:latest"
echo ""
echo "🚀 Para desplegar en otro servidor:"
echo "  1. Descarga docker-compose.prod.yml"
echo "  2. Ejecuta: docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "🌐 URLs de Docker Hub:"
echo "  https://hub.docker.com/r/your-dockerhub-username/administrador-tareas-backend"
echo "  https://hub.docker.com/r/your-dockerhub-username/administrador-tareas-frontend"