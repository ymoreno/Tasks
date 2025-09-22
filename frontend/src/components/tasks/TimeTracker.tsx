import React, { useState, useEffect } from 'react'
import { Box, Button, Typography, Chip } from '@mui/material'
import { PlayArrow, Pause, Stop, Timer } from '@mui/icons-material'
import { TimeTracking } from '@/types'
import { timeService } from '@/services/api'

interface TimeTrackerProps {
  taskId: string
  taskName: string
  timeTracking: TimeTracking
  onTimeUpdate?: (taskId: string, timeTracking: TimeTracking) => void
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ 
  taskId, 
  timeTracking, 
  onTimeUpdate 
}) => {
  const [currentTime, setCurrentTime] = useState(timeTracking.totalTime)
  const [isRunning, setIsRunning] = useState(timeTracking.isActive)
  const [sessionStart, setSessionStart] = useState<Date | null>(
    timeTracking.startTime ? new Date(timeTracking.startTime) : null
  )

  // Actualizar timer cada segundo cuando está activo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && sessionStart) {
      interval = setInterval(() => {
        const now = new Date()
        const sessionTime = now.getTime() - sessionStart.getTime()
        setCurrentTime(timeTracking.totalTime + sessionTime)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, sessionStart, timeTracking.totalTime])

  // Formatear tiempo en formato legible
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Iniciar seguimiento
  const handleStart = async () => {
    try {
      const updatedTask = await timeService.startTracking(taskId)
      setIsRunning(true)
      setSessionStart(new Date())
      onTimeUpdate?.(taskId, updatedTask.timeTracking)
    } catch (error) {
      console.error('Error iniciando seguimiento:', error)
    }
  }

  // Pausar seguimiento
  const handlePause = async () => {
    try {
      const updatedTask = await timeService.pauseTracking(taskId)
      setIsRunning(false)
      setSessionStart(null)
      setCurrentTime(updatedTask.timeTracking.totalTime)
      onTimeUpdate?.(taskId, updatedTask.timeTracking)
    } catch (error) {
      console.error('Error pausando seguimiento:', error)
    }
  }

  // Reanudar seguimiento
  const handleResume = async () => {
    try {
      const updatedTask = await timeService.resumeTracking(taskId)
      setIsRunning(true)
      setSessionStart(new Date())
      onTimeUpdate?.(taskId, updatedTask.timeTracking)
    } catch (error) {
      console.error('Error reanudando seguimiento:', error)
    }
  }

  // Detener seguimiento
  const handleStop = async () => {
    try {
      const updatedTask = await timeService.stopTracking(taskId)
      setIsRunning(false)
      setSessionStart(null)
      setCurrentTime(updatedTask.timeTracking.totalTime)
      onTimeUpdate?.(taskId, updatedTask.timeTracking)
    } catch (error) {
      console.error('Error deteniendo seguimiento:', error)
    }
  }

  const hasTime = currentTime > 0
  const canStart = !isRunning && !timeTracking.isActive
  const canPause = isRunning && timeTracking.isActive
  const canResume = !isRunning && timeTracking.isActive && timeTracking.sessions.length > 0
  const canStop = timeTracking.isActive

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      {/* Display de tiempo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Timer color={isRunning ? 'primary' : 'disabled'} />
        <Typography 
          variant="h6" 
          sx={{ 
            fontFamily: 'monospace',
            color: isRunning ? 'primary.main' : 'text.secondary',
            minWidth: '60px'
          }}
        >
          {formatTime(currentTime)}
        </Typography>
        {isRunning && (
          <Chip 
            label="EN VIVO" 
            color="primary" 
            size="small" 
            sx={{ animation: 'pulse 2s infinite' }}
          />
        )}
      </Box>

      {/* Botones de control */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {canStart && (
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayArrow />}
            onClick={handleStart}
            color="success"
          >
            Iniciar
          </Button>
        )}

        {canPause && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Pause />}
            onClick={handlePause}
            color="warning"
          >
            Pausar
          </Button>
        )}

        {canResume && (
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayArrow />}
            onClick={handleResume}
            color="success"
          >
            Reanudar
          </Button>
        )}

        {canStop && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Stop />}
            onClick={handleStop}
            color="error"
          >
            Finalizar
          </Button>
        )}
      </Box>

      {/* Información adicional */}
      {hasTime && (
        <Typography variant="caption" color="text.secondary">
          {timeTracking.sessions.length} sesión{timeTracking.sessions.length !== 1 ? 'es' : ''}
        </Typography>
      )}

      {/* Estilos CSS en JS para la animación */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  )
}

export default TimeTracker