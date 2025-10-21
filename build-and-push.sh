#!/bin/bash

# Configuración
DOCKER_USERNAME="yetto"  # Usuario de Docker Hub
IMAGE_TAG="latest"
APP_NAME="administrador-tareas"

echo "🐳 Construyendo y subiendo imágenes a Docker Hub..."

# Verificar que estés logueado en Docker Hub
echo "🔐 Verificando login en Docker Hub..."
if ! docker info | grep -q "Username"; then
    echo "❌ No estás logueado en Docker Hub. Ejecuta: docker login"
    exit 1
fi

# Construir imagen del backend
echo "🔨 Construyendo imagen del backend..."
docker build -t ${DOCKER_USERNAME}/${APP_NAME}-backend:${IMAGE_TAG} ./backend

# Construir imagen del frontend
echo "🔨 Construyendo imagen del frontend..."
docker build -t ${DOCKER_USERNAME}/${APP_NAME}-frontend:${IMAGE_TAG} ./frontend

# Subir imagen del backend
echo "⬆️ Subiendo imagen del backend..."
docker push ${DOCKER_USERNAME}/${APP_NAME}-backend:${IMAGE_TAG}

# Subir imagen del frontend
echo "⬆️ Subiendo imagen del frontend..."
docker push ${DOCKER_USERNAME}/${APP_NAME}-frontend:${IMAGE_TAG}

echo "✅ Imágenes subidas exitosamente!"
echo ""
echo "📋 Imágenes disponibles en Docker Hub:"
echo "  Backend:  ${DOCKER_USERNAME}/${APP_NAME}-backend:${IMAGE_TAG}"
echo "  Frontend: ${DOCKER_USERNAME}/${APP_NAME}-frontend:${IMAGE_TAG}"
echo ""
echo "🚀 Para desplegar en otro servidor, usa docker-compose.prod.yml"