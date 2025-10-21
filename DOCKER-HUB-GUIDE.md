# 🐳 Guía de Docker Hub - Administrador de Tareas

## 📋 Pasos para Subir a Docker Hub

### 1. **Configuración Inicial**

```bash
# 1. Configura tu usuario de Docker Hub
./docker-hub-config.sh tu-usuario-dockerhub

# 2. Login en Docker Hub
docker login
```

### 2. **Construir y Subir Imágenes**

```bash
# Construir y subir automáticamente
./build-and-push.sh
```

### 3. **Desplegar desde Docker Hub**

```bash
# En cualquier servidor con Docker
wget https://raw.githubusercontent.com/tu-repo/administrador-tareas/master/docker-compose.prod.yml
wget https://raw.githubusercontent.com/tu-repo/administrador-tareas/master/deploy-prod.sh

# Ejecutar despliegue
chmod +x deploy-prod.sh
./deploy-prod.sh
```

## 🚀 Despliegue Rápido

### Opción 1: Docker Compose

```bash
# Crear docker-compose.yml
version: '3.8'
services:
  backend:
    image: tu-usuario/administrador-tareas-backend:latest
    ports:
      - "3001:3001"
    volumes:
      - tasks-data:/app/data
    restart: unless-stopped
  
  frontend:
    image: tu-usuario/administrador-tareas-frontend:latest
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  tasks-data:

# Ejecutar
docker-compose up -d
```

### Opción 2: Docker Run

```bash
# Crear red
docker network create tasks-network

# Crear volumen
docker volume create tasks-data

# Backend
docker run -d \
  --name tasks-backend \
  --network tasks-network \
  -p 3001:3001 \
  -v tasks-data:/app/data \
  --restart unless-stopped \
  tu-usuario/administrador-tareas-backend:latest

# Frontend
docker run -d \
  --name tasks-frontend \
  --network tasks-network \
  -p 80:80 \
  --restart unless-stopped \
  tu-usuario/administrador-tareas-frontend:latest
```

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# Backend
docker run -d \
  -e NODE_ENV=production \
  -e PORT=3001 \
  tu-usuario/administrador-tareas-backend:latest
```

### Puertos Personalizados

```bash
# Cambiar puerto del frontend
docker run -d -p 8080:80 tu-usuario/administrador-tareas-frontend:latest

# Cambiar puerto del backend
docker run -d -p 3002:3001 tu-usuario/administrador-tareas-backend:latest
```

### Persistencia de Datos

```bash
# Usar directorio local
docker run -d \
  -v /ruta/local/datos:/app/data \
  tu-usuario/administrador-tareas-backend:latest

# Usar volumen nombrado
docker volume create mi-tasks-data
docker run -d \
  -v mi-tasks-data:/app/data \
  tu-usuario/administrador-tareas-backend:latest
```

## 📊 Monitoreo

### Health Checks

```bash
# Verificar estado del backend
curl http://localhost:3001/health

# Verificar estado del frontend
curl http://localhost/
```

### Logs

```bash
# Ver logs del backend
docker logs tasks-backend -f

# Ver logs del frontend
docker logs tasks-frontend -f
```

## 🔄 Actualización

```bash
# Descargar nuevas imágenes
docker pull tu-usuario/administrador-tareas-backend:latest
docker pull tu-usuario/administrador-tareas-frontend:latest

# Reiniciar contenedores
docker-compose down
docker-compose up -d
```

## 🌐 Servicios en la Nube

### AWS ECS

```json
{
  "family": "administrador-tareas",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "tu-usuario/administrador-tareas-backend:latest",
      "portMappings": [{"containerPort": 3001}],
      "memory": 512
    },
    {
      "name": "frontend", 
      "image": "tu-usuario/administrador-tareas-frontend:latest",
      "portMappings": [{"containerPort": 80}],
      "memory": 256
    }
  ]
}
```

### Google Cloud Run

```bash
# Backend
gcloud run deploy tasks-backend \
  --image tu-usuario/administrador-tareas-backend:latest \
  --port 3001

# Frontend
gcloud run deploy tasks-frontend \
  --image tu-usuario/administrador-tareas-frontend:latest \
  --port 80
```

### Azure Container Instances

```bash
# Backend
az container create \
  --resource-group myResourceGroup \
  --name tasks-backend \
  --image tu-usuario/administrador-tareas-backend:latest \
  --ports 3001

# Frontend
az container create \
  --resource-group myResourceGroup \
  --name tasks-frontend \
  --image tu-usuario/administrador-tareas-frontend:latest \
  --ports 80
```

## 🔒 Seguridad

### Usar Tags Específicos

```bash
# En lugar de 'latest', usa versiones específicas
docker pull tu-usuario/administrador-tareas-backend:v1.0.0
```

### Escaneo de Vulnerabilidades

```bash
# Escanear imágenes
docker scan tu-usuario/administrador-tareas-backend:latest
```

## 📋 Troubleshooting

### Problemas Comunes

1. **Puerto en uso**: Cambiar puertos en docker-compose.yml
2. **Permisos de datos**: `sudo chown -R 1000:1000 ./data`
3. **Memoria insuficiente**: Aumentar límites en docker-compose.yml
4. **Red no accesible**: Verificar configuración de red y firewall