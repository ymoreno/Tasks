# Administrador de Tareas

Sistema de gestión de tareas con seguimiento de tiempo, desarrollado con Node.js y React.

## 🏗️ Estructura del Proyecto

```
administrador-tareas/
├── backend/                 # Servidor Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/         # Rutas de la API REST
│   │   ├── services/       # Lógica de negocio y persistencia
│   │   ├── middleware/     # Middleware personalizado
│   │   ├── types/          # Definiciones de tipos TypeScript
│   │   └── app.ts          # Configuración principal del servidor
│   ├── data/               # Archivos JSON de datos
│   ├── uploads/            # Archivos subidos temporalmente
│   ├── dist/               # Código compilado (generado)
│   └── package.json
├── frontend/               # Aplicación React + TypeScript + Material-UI
│   ├── src/
│   │   ├── components/     # Componentes React organizados por funcionalidad
│   │   ├── contexts/       # Context API para gestión de estado
│   │   ├── services/       # Servicios para comunicación con API
│   │   ├── types/          # Tipos TypeScript compartidos
│   │   └── main.tsx        # Punto de entrada de React
│   ├── dist/               # Build de producción (generado)
│   └── package.json
├── package.json            # Scripts principales y dependencias compartidas
└── README.md               # Este archivo
```

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación
```bash
# Instalar todas las dependencias
npm run install:all

# O manualmente:
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Desarrollo
```bash
# Ejecutar backend y frontend simultáneamente
npm run dev

# O ejecutar por separado:
npm run server:dev  # Backend en puerto 3001
npm run client:dev  # Frontend en puerto 3000
```

### Build para Producción
```bash
npm run build
npm start
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web minimalista
- **TypeScript** - Tipado estático
- **Multer** - Manejo de archivos
- **Papa Parse** - Procesamiento de CSV
- **ExcelJS** - Procesamiento de Excel
- **Jest** - Testing

### Frontend
- **React 18** - Librería de UI
- **TypeScript** - Tipado estático
- **Material-UI** - Componentes de UI
- **Vite** - Build tool y dev server
- **Axios** - Cliente HTTP
- **Chart.js** - Gráficos y visualizaciones
- **React Router** - Navegación

## 📋 Funcionalidades

### ✅ Tareas Generales
- Gestión CRUD de tareas por categorías
- Puntuaciones aleatorias para selección espontánea
- Filtros y búsqueda avanzada
- Seguimiento de tiempo con inicio/pausa/fin

### 📅 Tareas Semanales
- Flujo secuencial diario (Ejercicio → Casa → Leer → ...)
- Manejo especial de tarea "Lista" (selección aleatoria)
- División de tarea "Portátil" (Laptop vs Mac)
- Sistema de subtareas con reordenamiento automático
- Botón "Día Completado"

### 💰 Pagos y Compras
- Lista de productos y compras futuras
- URLs de productos con validación
- Categorización y búsqueda

### 📊 Estadísticas y Análisis
- Tiempo total y promedio por tarea
- Gráficos de productividad
- Distribución por categorías
- Exportación de datos

### 📁 Importación/Exportación
- Importar desde CSV y Excel
- Exportar datos en múltiples formatos
- Validación y mapeo automático de datos

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# E2E tests
npm run test:e2e
```

## 📚 Documentación de API

Una vez ejecutando el servidor, la documentación de la API estará disponible en:
- Salud del servidor: `GET /api/health`
- Tareas: `/api/tasks`
- Tareas semanales: `/api/weekly`
- Pagos: `/api/payments`
- Tiempo: `/api/time`
- Archivos: `/api/files`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.