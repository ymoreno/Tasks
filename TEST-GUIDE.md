# 🧪 Guía de Test Completo - Administrador de Tareas

## 🚀 Inicio Rápido para Test

### 1. Iniciar aplicación
```bash
cd administrador-tareas
npm run dev
```

### 2. URLs de acceso
- **🖥️ PC**: http://localhost:3000
- **📱 Celular**: http://[TU_IP]:3000 (ejecuta `npm run ip` para ver tu IP)

## 📋 Lista de Funcionalidades a Probar

### ✅ Tareas Generales (`/tasks`)
- [ ] Ver lista vacía inicial
- [ ] Importar datos desde CSV (arrastra Tareas.csv)
- [ ] Ver 14 categorías cargadas
- [ ] Generar puntuaciones aleatorias
- [ ] Iniciar timer en una tarea
- [ ] Pausar y reanudar timer
- [ ] Finalizar timer y ver tiempo registrado
- [ ] Marcar tarea como completada
- [ ] Ver estadísticas actualizadas

### ✅ Tareas Semanales (`/weekly`)
- [ ] Ver secuencia diaria (Ejercicio → Casa → etc.)
- [ ] Completar primera tarea (Ejercicio)
- [ ] Avanzar a siguiente tarea (Casa)
- [ ] Llegar a tarea "Lista" y ver selección aleatoria
- [ ] Llegar a tarea "Portátil" y probar división Laptop/Mac
- [ ] Completar día completo
- [ ] Ver progreso del día actualizado

### ✅ Pagos y Compras (`/payments`)
- [ ] Agregar nuevo item sin URL
- [ ] Agregar item con URL de producto
- [ ] Buscar items por nombre
- [ ] Editar item existente
- [ ] Eliminar item
- [ ] Ver estadísticas actualizadas

### ✅ Estadísticas (`/stats`)
- [ ] Ver métricas en tiempo real
- [ ] Verificar tiempo total calculado
- [ ] Ver progreso semanal
- [ ] Verificar distribución por categorías
- [ ] Ver análisis de actividad

### ✅ Funcionalidades Móviles
- [ ] Acceder desde celular
- [ ] Navegación táctil
- [ ] Timers funcionando en móvil
- [ ] Todas las funcionalidades disponibles
- [ ] Sincronización entre dispositivos

### ✅ Importación/Exportación
- [ ] Importar archivo CSV original
- [ ] Importar archivo Excel
- [ ] Exportar datos a CSV
- [ ] Exportar datos a Excel
- [ ] Verificar formato compatible

## 🔧 Comandos Útiles para Test

### Datos de prueba
```bash
# Restaurar datos de ejemplo
npx ts-node backend/src/scripts/importInitialData.ts

# Limpiar todos los datos
node reset-data.js

# Verificar configuración
node verify-setup.js

# Ver IP para acceso móvil
npm run ip
```

### Verificación técnica
```bash
# Probar servicios de datos
npx ts-node backend/src/scripts/testDataService.ts

# Verificar persistencia
npx ts-node backend/src/scripts/verifyDataPersistence.ts

# Compilar sin errores
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

### API directa (para debugging)
```bash
# Health check
curl http://localhost:3001/api/health

# Ver todas las tareas
curl http://localhost:3001/api/tasks

# Estado del día
curl http://localhost:3001/api/weekly/current-day

# Ver pagos
curl http://localhost:3001/api/payments
```

## 🎯 Escenarios de Test Recomendados

### Escenario 1: Usuario Nuevo
1. Iniciar app sin datos
2. Importar CSV original
3. Generar puntuaciones aleatorias
4. Completar una secuencia semanal completa
5. Agregar algunos pagos/compras
6. Revisar estadísticas

### Escenario 2: Uso Móvil
1. Acceder desde celular
2. Iniciar timer en una tarea
3. Cambiar a otra app y volver
4. Verificar que el timer sigue corriendo
5. Completar tarea desde móvil
6. Ver sincronización en PC

### Escenario 3: Flujo Semanal Completo
1. Empezar día con "Ejercicio"
2. Completar secuencia hasta "Lista"
3. Ver tarea aleatoria seleccionada
4. Continuar hasta "Portátil"
5. Probar división Laptop/Mac
6. Completar día completo

### Escenario 4: Gestión de Tiempo
1. Iniciar múltiples tareas con timers
2. Pausar y reanudar varias veces
3. Ver estadísticas de tiempo
4. Exportar datos con tiempos
5. Verificar persistencia entre sesiones

## 📊 Métricas de Éxito

Al final del test, deberías tener:
- ✅ Todas las funcionalidades probadas
- ✅ Datos persistentes entre sesiones
- ✅ Acceso móvil funcionando
- ✅ Timers precisos y confiables
- ✅ Estadísticas correctas
- ✅ Importación/exportación funcional

## 🎉 Estado Actual

**✅ APLICACIÓN 100% FUNCIONAL**
- Backend Node.js + Express + TypeScript
- Frontend React + Material-UI + TypeScript
- Sistema de tiempo en tiempo real
- Acceso móvil configurado
- Datos limpios para test fresco

**¡Listo para el test completo de mañana!** 🚀