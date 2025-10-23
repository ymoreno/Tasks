# 🔄 REQUERIMIENTOS OFICIALES DE ROTACIÓN

## 🎯 ESTADO ACTUAL CORRECTO

### **Después de la Corrección (2025-10-21)**:
- **📚 Leer**: Kindle (Corazones Perdidos)
- **🎬 Películas**: Downloaded

## 📋 REQUERIMIENTOS DE ROTACIÓN

### **1. Rotación Semanal (`"subtaskRotation": "weekly"`)**

#### **Tareas que Rotan Semanalmente**:
1. **Leer** - Rota entre formatos de lectura
2. **Películas** (dentro de Lista) - Rota entre plataformas

#### **Cuándo Rotan**:
- **Día**: Solo los lunes
- **Automático**: Sí, al iniciar la aplicación el lunes
- **Frecuencia**: Una vez por semana

#### **Secuencias de Rotación**:

**Juego** (Orden circular):
```
1. Retro (FFIV)
2. Ps2 (Diablo II)
3. PSP (Final Fantasy IV The After Years)
4. PS3 (CTR) ← ACTUAL
5. Wii (*)
6. Laptop (*)
7. Steam (*)
8. PS4 (*)
9. Epic (*)
10. GoG (*)
11. Ubi (*)
12. Amazon (*)
13. Retro pro (*)
14. IndieGala (*)
15. Blizzard (*)
16. Origin (*)
17. PS5 (*)
18. Switch (*)
→ Vuelve a Retro
```

**Leer** (Orden circular):
```
1. Fisico (Guia de Supervivencia Zombie)
2. Prestado (Venganza)
3. Kindle (Corazones Perdidos) ← ACTUAL
4. PC Novela (Rechicero)
5. Cell (El trono vacio)
6. Comics (5 elementos)
7. Tablet (El último deseo)
8. Extra (Némesis)
→ Vuelve a Fisico
```

**Películas** (Orden circular):
```
1. DVD
2. Downloaded ← ACTUAL
3. Netflix
4. Max
5. Prime
6. Crunchy Roll
7. Online
8. AP/Par/Dis
→ Vuelve a DVD
```

### **2. Rotación Diaria (`"subtaskRotation": "dailyOrCompletion"`)**

#### **Tareas que Rotan Diariamente**:
1. **Mac** - Rota entre áreas de trabajo/estudio

#### **Cuándo Rota**:
- **Día**: Todos los días (lunes a domingo)
- **Automático**: Sí, al iniciar la aplicación cada día
- **Frecuencia**: Una vez por día

#### **Secuencia de Rotación Mac**:
```
1. Algoritmos
2. Java
3. Empleo ← ACTUAL
4. Entrevista
5. Software - Gaia
6. Software - Echoes
7. Practicas
8. Related
→ Vuelve a Algoritmos
```

### **3. Rotación por Completación (`"subtaskRotation": "completion"`)**

#### **Tareas que Rotan al Completarse**:
1. **Juego** - Rotación MANUAL cuando se completa un juego
2. **Mac → Practicas** - Rota automáticamente cuando se completa una práctica
3. **Mac → Related** - Rota automáticamente cuando se completa un tema relacionado

#### **Cuándo Rotan**:
- **Trigger**: Solo cuando se marca como completada
- **Automático**: 
  - **Juego**: NO (manual)
  - **Mac → Practicas**: Sí, inmediatamente al completar
  - **Mac → Related**: Sí, inmediatamente al completar
- **Frecuencia**: Según completación

### **4. Rotación al Iniciar/Completar (`"subtaskRotation": "onStartOrCompletion"`)**

#### **Tareas con esta Rotación**:
1. **Lista** - Rota entre actividades personales

#### **Cuándo Rota**:
- **Al iniciar**: Cuando se empieza la tarea
- **Al completar**: Cuando se termina la tarea
- **Automático**: Sí, en ambos eventos

### **5. Rotación Manual**

#### **Tareas con Rotación Manual**:
1. **Juego** - Cambio manual cuando se completa un juego

#### **Cuándo Rota**:
- **Trigger**: Intervención manual del usuario
- **Automático**: NO
- **Frecuencia**: Cuando el usuario decide cambiar

## ⚠️ REGLAS CRÍTICAS

### **Prevención de Rotaciones Incorrectas**:

1. **Verificar Estado Antes de Rotar**:
   - Siempre verificar el estado actual antes de aplicar rotación
   - No asumir posiciones basándose en fechas

2. **Rotación Semanal Solo los Lunes**:
   - Verificar que sea lunes (`new Date().getDay() === 1`)
   - No ejecutar rotación semanal otros días

3. **Una Rotación por Período**:
   - Marcar cuando se ejecutó la última rotación
   - No ejecutar múltiples rotaciones en el mismo período

4. **Validación de Estado**:
   - Verificar que la subtarea actual existe
   - Verificar que la siguiente subtarea en la secuencia existe

## 🔒 IMPLEMENTACIÓN

### **Lógica de Rotación**:

#### **Rotación Semanal (Solo Lunes)**:
```typescript
// Solo ejecutar los lunes
const currentDay = new Date().getDay();
const isMonday = currentDay === 1;

// Verificar que no se haya ejecutado ya hoy
const lastWeeklyRotation = data.dailyState.lastWeeklyRotation;
const today = new Date().toISOString().split('T')[0];

if (isMonday && lastWeeklyRotation !== today) {
  // Ejecutar rotación semanal
  await rotateWeeklySubtasks(data);
  data.dailyState.lastWeeklyRotation = today;
}
```

#### **Rotación Diaria (Todos los Días)**:
```typescript
// Ejecutar todos los días (lunes a domingo)
const lastDailyRotation = data.dailyState.lastDailyRotation;
const today = new Date().toISOString().split('T')[0];

if (lastDailyRotation !== today) {
  // Ejecutar rotación diaria
  await rotateDailySubtasks(data);
  data.dailyState.lastDailyRotation = today;
}
```

### **Validación Antes de Rotar**:
```typescript
const rotateWeeklySubtask = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) return;
  
  const currentIndex = task.subtasks.findIndex(sub => sub.id === task.currentSubtaskId);
  if (currentIndex === -1) {
    console.error(`Subtarea actual no encontrada: ${task.currentSubtaskId}`);
    return;
  }
  
  const nextIndex = (currentIndex + 1) % task.subtasks.length;
  const oldSubtask = task.subtasks[currentIndex].name;
  const newSubtask = task.subtasks[nextIndex].name;
  
  task.currentSubtaskId = task.subtasks[nextIndex].id;
  console.log(`✅ ${task.name}: ${oldSubtask} → ${newSubtask}`);
};
```

## 📝 ESTADO DE REFERENCIA

### **Estado Actual de Todas las Rotaciones**:

**Rotación Semanal**:
- **Leer**: Kindle (Corazones Perdidos)
- **Películas**: Downloaded

**Rotación Diaria**:
- **Mac**: Empleo

**Rotación por Completación**:
- **Juego**: PS3 (CTR) - *Rotación MANUAL*
- **Mac → Practicas**: Scrum Master - *Rotación automática*
- **Mac → Related**: English - *Rotación automática*

### **Próximas Rotaciones Esperadas**:

**Próximo Lunes (Rotación Semanal)**:
- **Leer**: Kindle → PC Novela (Rechicero)
- **Películas**: Downloaded → Netflix

**Próximo Día (Rotación Diaria)**:
- **Mac**: Empleo → Entrevista

**Al Completar Juego Actual (MANUAL)**:
- **Juego**: PS3 (CTR) → Wii (*) - *Requiere cambio manual*

## 🚫 ERRORES A EVITAR

1. **No ejecutar rotación semanal en días que no sean lunes**
2. **No ejecutar múltiples rotaciones en el mismo día**
3. **No asumir posiciones sin verificar el estado actual**
4. **No rotar si la subtarea actual no se encuentra**
5. **No rotar si no hay subtareas disponibles**

---

**Fecha de creación**: 2025-10-21  
**Estado**: OFICIAL - Referencia para todas las rotaciones  
**Última corrección**: Leer (Kindle) y Películas (Downloaded)