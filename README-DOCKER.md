# 🐳 Administrador de Tareas - Docker Hub

## 🚀 Despliegue Rápido

### Para Subir a Docker Hub (desde este repositorio):

```bash
# 1. Login en Docker Hub
docker login

# 2. Construir y subir imágenes
./build-docker.sh
```

### Para Desplegar en Cualquier Servidor:

```bash
# Opción 1: Script automatizado
curl -O https://raw.githubusercontent.com/your-username/Tasks/master/deploy-docker.sh
chmod +x deploy-docker.sh
./deploy-docker.sh

# Opción 2: Docker Compose manual
curl -O https://raw.githubusercontent.com/your-username/Tasks/master/docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Opción 3: Docker Run directo
docker network create tasks-network
docker volume create tasks-data

docker run -d \
  --name tasks-backend \
  --network tasks-network \
  -p 3001:3001 \
  -v tasks-data:/app/data \
  --restart unless-stopped \
  your-dockerhub-username/administrador-tareas-backend:latest

docker run -d \
  --name tasks-frontend \
  --network tasks-network \
  -p 80:80 \
  --restart unless-stopped \
  your-dockerhub-username/administrador-tareas-frontend:latest
```

## 📋 Imágenes Disponibles

- **Backend**: `your-dockerhub-username/administrador-tareas-backend:latest`
- **Frontend**: `your-dockerhub-username/administrador-tareas-frontend:latest`

## 🌐 URLs de Docker Hub

- [Backend en Docker Hub](https://hub.docker.com/r/your-dockerhub-username/administrador-tareas-backend)
- [Frontend en Docker Hub](https://hub.docker.com/r/your-dockerhub-username/administrador-tareas-frontend)

## 🔧 Configuración

### Puertos por Defecto
- **Frontend**: Puerto 80
- **Backend**: Puerto 3001

### Datos Persistentes
- Los datos se guardan en el volumen `tasks-data`
- Mapea a `/app/data` dentro del contenedor backend

### Health Checks
- **Backend**: `http://localhost:3001/health`
- **Frontend**: `http://localhost/`

## 📊 Monitoreo

```bash
# Ver estado
docker ps

# Ver logs
docker logs tasks-backend -f
docker logs tasks-frontend -f

# Health check
curl http://localhost:3001/health
curl http://localhost/
```

## 🔄 Actualización

```bash
# Descargar nuevas versiones
docker pull your-dockerhub-username/administrador-tareas-backend:latest
docker pull your-dockerhub-username/administrador-tareas-frontend:latest

# Reiniciar contenedores
docker-compose down
docker-compose up -d
```

## 🌍 Despliegue en la Nube

### Railway
```bash
# Usar las imágenes directamente en Railway
your-dockerhub-username/administrador-tareas-backend:latest
your-dockerhub-username/administrador-tareas-frontend:latest
```

### Render
```bash
# Configurar en Render usando Docker
your-dockerhub-username/administrador-tareas-backend:latest
your-dockerhub-username/administrador-tareas-frontend:latest
```

### DigitalOcean App Platform
```yaml
name: administrador-tareas
services:
- name: backend
  source_dir: /
  github:
    repo: ymoreno/Tasks
    branch: master
  image:
    registry_type: DOCKER_HUB
    registry: yetto
    repository: administrador-tareas-backend
    tag: latest
  http_port: 3001
  
- name: frontend
  source_dir: /
  image:
    registry_type: DOCKER_HUB
    registry: yetto
    repository: administrador-tareas-frontend
    tag: latest
  http_port: 80
```

## 🔒 Seguridad

- Las imágenes están optimizadas para producción
- Incluyen health checks automáticos
- Configuradas con restart policies
- Datos persistentes en volúmenes seguros