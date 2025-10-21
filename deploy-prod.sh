#!/bin/bash

# Configuración
DOCKER_USERNAME="your-dockerhub-username"  # Usuario de Docker Hub
IMAGE_TAG="latest"

echo "🚀 Desplegando desde Docker Hub..."

# El usuario ya está configurado como yetto

# Descargar las últimas imágenes
echo "⬇️ Descargando últimas imágenes..."
docker-compose -f docker-compose.prod.yml pull

# Detener contenedores existentes
echo "⏹️ Deteniendo contenedores existentes..."
docker-compose -f docker-compose.prod.yml down

# Iniciar servicios
echo "▶️ Iniciando servicios..."
docker-compose -f docker-compose.prod.yml up -d

# Mostrar estado
echo "📊 Estado de los contenedores:"
docker-compose -f docker-compose.prod.yml ps

# Mostrar logs
echo "📋 Logs recientes:"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo "✅ Despliegue completado!"
echo "🌐 Aplicación disponible en: http://localhost"
echo ""
echo "📋 Comandos útiles:"
echo "  Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Detener: docker-compose -f docker-compose.prod.yml down"
echo "  Actualizar: docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"