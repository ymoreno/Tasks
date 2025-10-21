#!/bin/bash

echo "🐳 Iniciando despliegue con Docker..."

# Detener contenedores existentes
echo "⏹️ Deteniendo contenedores existentes..."
docker-compose down

# Limpiar imágenes antiguas (opcional)
echo "🧹 Limpiando imágenes antiguas..."
docker system prune -f

# Construir y ejecutar
echo "🔨 Construyendo y ejecutando contenedores..."
docker-compose up --build -d

# Mostrar estado
echo "📊 Estado de los contenedores:"
docker-compose ps

echo "✅ Despliegue completado!"
echo "🌐 Frontend disponible en: http://localhost"
echo "🔧 Backend disponible en: http://localhost:3001"
echo ""
echo "📋 Comandos útiles:"
echo "  Ver logs: docker-compose logs -f"
echo "  Detener: docker-compose down"
echo "  Reiniciar: docker-compose restart"