#!/bin/bash

echo "🚀 Desplegando Administrador de Tareas desde Docker Hub"

# Crear docker-compose.yml si no existe
if [ ! -f "docker-compose.yml" ]; then
    echo "📝 Creando docker-compose.yml..."
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Backend Service
  backend:
    image: your-dockerhub-username/administrador-tareas-backend:latest
    container_name: tasks-backend
    ports:
      - "3001:3001"
    volumes:
      - tasks-data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped
    networks:
      - tasks-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Service
  frontend:
    image: your-dockerhub-username/administrador-tareas-frontend:latest
    container_name: tasks-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - tasks-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  tasks-network:
    driver: bridge

volumes:
  tasks-data:
    driver: local
EOF
fi

# Descargar las últimas imágenes
echo "⬇️ Descargando últimas imágenes..."
docker-compose pull

# Detener contenedores existentes
echo "⏹️ Deteniendo contenedores existentes..."
docker-compose down

# Iniciar servicios
echo "▶️ Iniciando servicios..."
docker-compose up -d

# Esperar un momento para que los servicios se inicien
echo "⏳ Esperando que los servicios se inicien..."
sleep 10

# Mostrar estado
echo "📊 Estado de los contenedores:"
docker-compose ps

# Verificar health checks
echo "🏥 Verificando health checks..."
echo "Backend health: $(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo 'No disponible')"
echo "Frontend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost/ 2>/dev/null || echo 'No disponible')"

echo ""
echo "✅ Despliegue completado!"
echo "🌐 Aplicación disponible en: http://localhost"
echo "🔧 API disponible en: http://localhost:3001"
echo ""
echo "📋 Comandos útiles:"
echo "  Ver logs: docker-compose logs -f"
echo "  Detener: docker-compose down"
echo "  Actualizar: docker-compose pull && docker-compose up -d"
echo "  Estado: docker-compose ps"