#!/bin/bash

# Configuración para Docker Hub
# Edita este archivo con tu información

# Tu usuario de Docker Hub
DOCKER_USERNAME="your-dockerhub-username"

# Nombre de la aplicación (se usará como prefijo para las imágenes)
APP_NAME="administrador-tareas"

# Tag de la imagen (puedes usar 'latest', versión específica, etc.)
IMAGE_TAG="latest"

# Función para actualizar archivos con la configuración
update_config() {
    echo "📝 Actualizando configuración con usuario: $DOCKER_USERNAME"
    
    # Actualizar build-and-push.sh
    sed -i "s/tu-usuario-dockerhub/$DOCKER_USERNAME/g" build-and-push.sh
    
    # Actualizar docker-compose.prod.yml
    sed -i "s/tu-usuario-dockerhub/$DOCKER_USERNAME/g" docker-compose.prod.yml
    
    # Actualizar deploy-prod.sh
    sed -i "s/tu-usuario-dockerhub/$DOCKER_USERNAME/g" deploy-prod.sh
    
    echo "✅ Configuración actualizada!"
}

# Función para mostrar información
show_info() {
    echo "🐳 Configuración de Docker Hub"
    echo "================================"
    echo "Usuario: $DOCKER_USERNAME"
    echo "App: $APP_NAME"
    echo "Tag: $IMAGE_TAG"
    echo ""
    echo "Imágenes que se crearán:"
    echo "  - $DOCKER_USERNAME/$APP_NAME-backend:$IMAGE_TAG"
    echo "  - $DOCKER_USERNAME/$APP_NAME-frontend:$IMAGE_TAG"
}

# Verificar si se pasó el usuario como parámetro
if [ "$1" != "" ]; then
    DOCKER_USERNAME="$1"
    update_config
fi

show_info

echo ""
echo "📋 Pasos siguientes:"
echo "1. Edita este archivo y cambia 'tu-usuario-dockerhub' por tu usuario real"
echo "2. Ejecuta: ./docker-hub-config.sh tu-usuario-real"
echo "3. Ejecuta: docker login"
echo "4. Ejecuta: ./build-and-push.sh"