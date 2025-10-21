# 🐳 Guía de Despliegue con Docker

## Requisitos Previos

- Docker instalado
- Docker Compose instalado
- Puertos 80 y 3001 disponibles

## 🚀 Despliegue Rápido

### Producción

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd administrador-tareas

# Ejecutar script de despliegue
./deploy.sh
```

### Desarrollo

```bash
# Ejecutar en modo desarrollo
docker-compose -f docker-compose.dev.yml up --build
```

## 📋 Comandos Útiles

### Gestión de Contenedores

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Ver logs
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Ver estado
docker-compose ps
```

### Mantenimiento

```bash
# Limpiar sistema Docker
docker system prune -f

# Reconstruir imágenes
docker-compose build --no-cache

# Actualizar y reiniciar
docker-compose pull && docker-compose up -d
```

## 🌐 Acceso a la Aplicación

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **Desarrollo Frontend**: http://localhost:5173

## 📁 Estructura de Archivos

```
administrador-tareas/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── nginx.conf
│   ├── .dockerignore
│   └── src/
├── docker-compose.yml          # Producción
├── docker-compose.dev.yml      # Desarrollo
└── deploy.sh                   # Script de despliegue
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# Backend
NODE_ENV=production
PORT=3001

# Frontend
VITE_API_URL=http://localhost:3001
```

### Persistencia de Datos

Los datos se persisten en:
- `./backend/data` → `/app/data` (en contenedor)

### Puertos

- **Frontend**: 80 (producción) / 5173 (desarrollo)
- **Backend**: 3001

## 🐛 Solución de Problemas

### Puertos en Uso

```bash
# Verificar puertos
sudo lsof -i :80
sudo lsof -i :3001

# Cambiar puertos en docker-compose.yml si es necesario
```

### Problemas de Permisos

```bash
# Dar permisos al directorio de datos
sudo chown -R $USER:$USER ./backend/data
```

### Logs de Depuración

```bash
# Ver logs específicos
docker-compose logs backend
docker-compose logs frontend

# Entrar al contenedor
docker exec -it tasks-backend sh
docker exec -it tasks-frontend sh
```

## 🔄 Actualización

```bash
# Actualizar código
git pull origin master

# Reconstruir y reiniciar
docker-compose down
docker-compose up --build -d
```