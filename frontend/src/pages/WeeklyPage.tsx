import React, { useEffect, useState } from 'react'
import { Box, Typography, Paper, Grid, Button, LinearProgress, Alert } from '@mui/material'
import { CheckCircle, Start, SkipNext } from '@mui/icons-material'
import { useWeeklyContext } from '@/contexts/WeeklyContext'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import TaskTimer from '@/components/weekly/TaskTimer'
import ReadingTask from '@/components/weekly/ReadingTask'
import GameTask from '@/components/weekly/GameTask'

const WeeklyPage: React.FC = () => {
  const { weeklyTasks, dayState, currentTask, loading, error, fetchWeeklyTasks, fetchCurrentDay, startTask, completeTask, completeSubtask, updateSubtaskTitle } = useWeeklyContext()
  const [timerActive, setTimerActive] = useState(false)

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchWeeklyTasks()
    fetchCurrentDay()
  }, [])

  // Calcular progreso
  const totalTasks = weeklyTasks.length
  const completedToday = dayState?.completedTasks.length || 0
  const progressPercentage = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0

  if (loading) {
    return <LoadingSpinner message="Cargando tareas semanales..." />
  }

  return (
    <Box>
      {/* Header de la página */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
          Tareas Semanales
        </Typography>
      </Box>

      {/* Mostrar errores */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Progreso del día */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Progreso del Día
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {completedToday} de {totalTasks} tareas completadas ({progressPercentage}%)
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Typography variant="body2">
          Fecha: {dayState?.date ? new Date(dayState.date).toLocaleDateString('es-ES', { 
            timeZone: 'UTC', // Forzar la zona horaria a UTC para evitar desfases
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : 'Cargando...'}
        </Typography>
      </Paper>

      {/* Contenido principal */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {dayState?.dayCompleted ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              🎉 ¡Felicitaciones! Has completado todas las tareas del día.
            </Alert>
          ) : (
            <Box>
              {/* Tarea actual */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  📋 Tarea Actual: {(() => {
                    if (!currentTask) return 'Cargando...';
                    const currentSubtask = currentTask.subtasks?.find(st => st.id === currentTask.currentSubtaskId);
                    return currentSubtask ? `${currentTask.name}: ${currentSubtask.name}` : currentTask.name;
                  })()}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  {/* Botón Empezar Tarea - solo si no ha sido iniciada */}
                  {currentTask && !currentTask.isStarted && (
                    <Button
                      variant="contained"
                      startIcon={<Start />}
                      size="large"
                      onClick={() => {
                        startTask()
                        setTimerActive(true)
                      }}
                      disabled={loading}
                      color="primary"
                    >
                      Empezar Tarea
                    </Button>
                  )}
                  
                  {/* Botón Terminar Subtarea - solo para Tarea Mac y si tiene subtareas */}
                  {currentTask && currentTask.name === 'Mac' && currentTask.isStarted && currentTask.subtasks && currentTask.subtasks.length > 0 && (
                    <Button
                      variant="outlined"
                      startIcon={<SkipNext />}
                      size="large"
                      onClick={completeSubtask}
                      disabled={loading}
                      color="secondary"
                    >
                      Terminar Subtarea
                    </Button>
                  )}

                  {/* Estado de la tarea actual */}
                  {currentTask && (
                    <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                      Estado: {currentTask.isStarted ? '🟢 En progreso' : '⭕ No iniciada'}
                    </Typography>
                  )}
                </Box>
              </Paper>

              {/* Timer - solo si la tarea está iniciada */}
              {currentTask && currentTask.isStarted && (
                <TaskTimer
                  taskName={currentTask.name}
                  isActive={timerActive}
                  onStart={() => setTimerActive(true)}
                  onPause={() => setTimerActive(false)}
                  onComplete={completeTask}
                />
              )}

              {/* Tarea de lectura especial */}
              {currentTask && currentTask.name.toLowerCase().includes('leer') && currentTask.isStarted && (
                <ReadingTask
                  isActive={timerActive}
                  subtask={currentTask.subtasks?.find(st => st.id === currentTask.currentSubtaskId)}
                  onUpdateTitle={(subtaskId, newTitle) => {
                    updateSubtaskTitle(subtaskId, newTitle);
                  }}
                />
              )}

              {/* Tarea de juego especial */}
              {currentTask && currentTask.name.toLowerCase() === 'juego' && currentTask.isStarted && (
                <GameTask
                  isActive={timerActive}
                  subtask={currentTask.subtasks?.find(st => st.id === currentTask.currentSubtaskId)}
                  onUpdateTitle={(subtaskId, newTitle) => {
                    updateSubtaskTitle(subtaskId, newTitle);
                  }}
                />
              )}
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Secuencia Completa del Día
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {weeklyTasks.map((task, index) => {
                const isCompleted = dayState?.completedTasks.includes(task.id) || false
                const isCurrent = dayState?.currentTaskIndex === index
                
                return (
                  <Paper 
                    key={task.id}
                    sx={{ 
                      p: 2, 
                      backgroundColor: isCompleted ? 'success.light' : isCurrent ? 'primary.light' : 'background.paper',
                      opacity: isCompleted ? 0.7 : 1,
                      border: isCurrent ? 2 : 0,
                      borderColor: 'primary.main'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">
                        {index + 1}. {task.name}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <Typography component="span" variant="body2" color="text.secondary">
                            {' '}({task.subtasks.length} subtareas)
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isCompleted ? '✅ Completada' : isCurrent ? '⏳ Actual' : '⭕ Pendiente'}
                      </Typography>
                    </Box>
                  </Paper>
                )
              })}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estadísticas del Día
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              📊 Total de tareas: <strong>{totalTasks}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✅ Completadas hoy: <strong>{completedToday}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ⏳ Tarea actual: <strong>{currentTask?.name || 'N/A'}</strong>
            </Typography>
            <Typography variant="body2">
              📈 Progreso: <strong>{progressPercentage}%</strong>
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tareas Especiales
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Lista</strong>: Selecciona una tarea aleatoria de las tareas generales
              <br />
              • <strong>Portátil</strong>: Se divide en Laptop vs Mac (Algoritmos → Related IA)
              <br />
              • <strong>Subtareas</strong>: Se gestionan automáticamente
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default WeeklyPage