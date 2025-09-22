import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  Alarm,
  Timer
} from '@mui/icons-material'

interface TaskTimerProps {
  taskName: string
  isActive: boolean
  onStart: () => void
  onPause: () => void
  onComplete: () => void
}

const TaskTimer: React.FC<TaskTimerProps> = ({
  taskName,
  isActive,
  onStart,
  onPause,
  onComplete
}) => {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showAlarm, setShowAlarm] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const TARGET_MINUTES = 45
  const TARGET_SECONDS = TARGET_MINUTES * 60

  // Crear audio para la alarma
  useEffect(() => {
    // Crear un tono de alarma usando Web Audio API
    const createAlarmSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }

    audioRef.current = { play: createAlarmSound } as any
  }, [])

  // Controla el estado del timer basado en la prop `isActive`
  useEffect(() => {
    if (isActive) {
      setIsRunning(true)
      setIsPaused(false)
    } else {
      if (isRunning) {
        setIsPaused(true)
      }
    }
  }, [isActive, isRunning])

  // Timer principal
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1
          
          // Alarma a los 45 minutos
          if (newSeconds === TARGET_SECONDS) {
            setShowAlarm(true)
            playAlarm()
          }
          
          return newSeconds
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused])

  const playAlarm = () => {
    try {
      if (audioRef.current) {
        // Reproducir múltiples tonos para hacer más notoria la alarma
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            audioRef.current?.play()
          }, i * 600)
        }
      }
    } catch (error) {
      console.warn('No se pudo reproducir la alarma:', error)
    }
  }

  const handlePause = () => {
    setIsPaused(true)
    onPause()
  }

  const handleResume = () => {
    setIsPaused(false)
    onStart()
  }

  const handleComplete = () => {
    setIsRunning(false)
    setIsPaused(false)
    setSeconds(0)
    onComplete()
  }

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = (): number => {
    return Math.min((seconds / TARGET_SECONDS) * 100, 100)
  }

  const getRemainingTime = (): string => {
    const remaining = Math.max(TARGET_SECONDS - seconds, 0)
    return formatTime(remaining)
  }

  const getTimerColor = () => {
    const percentage = getProgressPercentage()
    if (percentage >= 100) return 'error'
    if (percentage >= 80) return 'warning'
    return 'primary'
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Timer sx={{ mr: 1 }} />
          <Typography variant="h6">
            Timer: {taskName}
          </Typography>
        </Box>

        {/* Display del tiempo */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h3" component="div" color={getTimerColor()}>
            {formatTime(seconds)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Objetivo: {TARGET_MINUTES} minutos | Restante: {getRemainingTime()}
          </Typography>
        </Box>

        {/* Barra de progreso */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={getProgressPercentage()}
            color={getTimerColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Estado y controles */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          {seconds >= TARGET_SECONDS && (
            <Chip
              icon={<Alarm />}
              label="¡45 minutos completados!"
              color="warning"
              variant="filled"
            />
          )}
          {isRunning && !isPaused && (
            <Chip label="En ejecución" color="success" variant="filled" />
          )}
          {isPaused && (
            <Chip label="Pausado" color="warning" variant="outlined" />
          )}
        </Box>

        {/* Botones de control */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          {isRunning ? (
            <>
              {!isPaused ? (
                <Button
                  variant="outlined"
                  startIcon={<Pause />}
                  onClick={handlePause}
                >
                  Pausar
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleResume}
                  color="success"
                >
                  Reanudar
                </Button>
              )}
              <Button
                variant="contained"
                onClick={handleComplete}
                color="primary"
              >
                Completar Tarea
              </Button>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              El timer se ha detenido.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Dialog de alarma */}
      <Dialog
        open={showAlarm}
        onClose={() => setShowAlarm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Alarm sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
          <Typography variant="h5">¡Tiempo Completado!</Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Has completado {TARGET_MINUTES} minutos en la tarea: <strong>{taskName}</strong>
          </Alert>
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            ¿Quieres continuar trabajando o completar la tarea?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1 }}>
          <Button
            onClick={() => setShowAlarm(false)}
            variant="outlined"
          >
            Continuar
          </Button>
          <Button
            onClick={() => {
              setShowAlarm(false)
              handleComplete()
            }}
            variant="contained"
            color="success"
          >
            Completar Tarea
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TaskTimer