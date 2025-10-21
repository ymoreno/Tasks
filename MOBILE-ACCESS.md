# 📱 Guía de Acceso Móvil

## 🚀 Cómo acceder desde tu celular

### Paso 1: Obtener tu IP local
```bash
npm run ip
```

### Paso 2: Iniciar la aplicación
```bash
npm run dev
```

### Paso 3: Conectar desde tu celular
1. **Asegúrate** de que tu celular esté en la **misma red WiFi** que tu computadora
2. **Abre el navegador** en tu celular
3. **Navega a**: `http://[TU_IP]:3000`
   - Ejemplo: `http://192.168.1.137:3000`

## 📋 URLs importantes

- **🖥️ PC**: http://localhost:3000
- **📱 Celular**: http://[TU_IP]:3000
- **🔌 API**: http://[TU_IP]:3001/api

## 🔧 Solución de problemas

### ❌ No puedo conectar desde el celular

1. **Verifica la red WiFi**
   - Ambos dispositivos deben estar en la misma red
   - No uses datos móviles en el celular

2. **Verifica el firewall**
   ```bash
   # macOS - Permitir conexiones entrantes
   sudo pfctl -d  # Deshabilitar temporalmente
   ```

3. **Verifica la IP**
   - La IP puede cambiar si reinicias el router
   - Ejecuta `npm run ip` para obtener la IP actual

4. **Prueba la conexión**
   ```bash
   # Desde tu celular, prueba si el backend responde
   # Abre: http://[TU_IP]:3001/api/health
   ```

### ❌ La aplicación se ve mal en móvil

- La aplicación está optimizada para móviles con Material-UI
- Si algo se ve mal, reporta el problema

### ❌ Los botones no funcionan en móvil

- Todos los botones deberían funcionar igual que en desktop
- El sistema de tiempo funciona en móvil
- Las notificaciones aparecen correctamente

## 📱 Características móviles

### ✅ Funciona perfectamente en móvil:
- ✅ **Navegación táctil** optimizada
- ✅ **Botones grandes** para dedos
- ✅ **Seguimiento de tiempo** en tiempo real
- ✅ **Todas las funcionalidades** disponibles
- ✅ **Responsive design** con Material-UI
- ✅ **Indicador de red** en la esquina inferior

### 📊 Estadísticas móviles:
- ✅ **Gráficos responsivos**
- ✅ **Métricas optimizadas** para pantalla pequeña
- ✅ **Navegación por tabs** táctil

### 🎯 Tareas semanales móviles:
- ✅ **Secuencia diaria** fácil de usar
- ✅ **Botones grandes** para completar tareas
- ✅ **Progreso visual** claro

## 🌐 Información técnica

### Configuración de red:
- **Backend**: Escucha en `0.0.0.0:3001` (todas las interfaces)
- **Frontend**: Vite configurado con `host: '0.0.0.0'`
- **CORS**: Configurado para IPs locales (192.168.x.x, 10.x.x.x, 172.x.x.x)

### Puertos utilizados:
- **3000**: Frontend (React + Vite)
- **3001**: Backend (Node.js + Express)

## 💡 Tips para uso móvil

1. **Agrega a pantalla de inicio**
   - En Safari: Compartir → Agregar a pantalla de inicio
   - En Chrome: Menú → Agregar a pantalla de inicio

2. **Modo pantalla completa**
   - La aplicación funciona como una PWA básica
   - Se ve como una app nativa

3. **Notificaciones**
   - Las notificaciones del sistema aparecen correctamente
   - Los timers funcionan en segundo plano

4. **Sincronización**
   - Los cambios se sincronizan automáticamente
   - Puedes usar la app desde PC y móvil simultáneamente

## 🎉 ¡Listo!

Tu administrador de tareas ahora es completamente accesible desde tu celular con todas las funcionalidades:

- ✅ **Gestión de tareas** táctil
- ✅ **Seguimiento de tiempo** en tiempo real
- ✅ **Tareas semanales** optimizadas
- ✅ **Pagos y compras** desde cualquier lugar
- ✅ **Estadísticas** siempre actualizadas


¡Disfruta gestionando tus tareas desde cualquier dispositivo! 📱✨