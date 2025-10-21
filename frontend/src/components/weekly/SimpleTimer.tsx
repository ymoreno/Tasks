import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import { PlayArrow, Pause, Alarm, Timer } from '@mui/icons-material';
import { TimerState } from '@/types';

interface SimpleTimerProps {
  taskName: string;
  elapsedSeconds: number;
  timerState: TimerState;
  onTick: (newSeconds: number) => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
}

const SimpleTimer: React.FC<SimpleTimerProps> = ({
  taskName,
  elapsedSeconds,
  timerState,
  onTick,
  onPause,
  onResume,
  onComplete
}) => {
  const [showAlarm, setShowAlarm] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const TARGET_MINUTES = 45;
  const TARGET_SECONDS = TARGET_MINUTES * 60;

  // Inicializar AudioContext en la primera interacción del usuario
  const initializeAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    } catch (error) {
      console.warn('Error inicializando audio:', error);
    }
  };

  // Timer principal - Basado en el patrón de FreeCodeCamp
  useEffect(() => {
    if (timerState === 'running') {
      // Inicializar tiempo de inicio si no existe
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      }

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const totalElapsed = Math.floor((now - startTimeRef.current!) / 1000);
        
        // Actualizar el tiempo
        onTick(totalElapsed);

        // Verificar si se completaron los 45 minutos
        if (totalElapsed >= TARGET_SECONDS) {
          setShowAlarm(true);
          playAlarm();
          onPause();
        }
      }, 1000);
    } else {
      // Limpiar interval cuando no está corriendo
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Si se pausa, mantener el tiempo de inicio para poder reanudar
      if (timerState === 'stopped') {
        startTimeRef.current = null;
      }
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState, onTick]);

  // Función para crear sonido de alarma
  const createAlarmSound = async () => {
    try {
      // Inicializar AudioContext si no existe
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      // Reanudar el contexto si está suspendido
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Crear oscilador para el sonido
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Conectar nodos
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar frecuencia (tono de alarma)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz
      oscillator.type = 'square'; // Sonido más distintivo

      // Configurar volumen con fade out
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);

      // Reproducir por 3 segundos máximo
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 3);

    } catch (error) {
      console.warn('Error creando sonido de alarma:', error);
    }
  };

  // Función para reproducir alarma
  const playAlarm = async () => {
    // Reproducir sonido de alarma (3 segundos máximo)
    await createAlarmSound();

    // Notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('¡Tiempo completado!', {
        body: `Has completado 45 minutos en: ${taskName}`,
        icon: '/favicon.ico',
        tag: 'task-timer'
      });
    }

    // Vibración si está disponible
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 200, 300]);
    }

    // Auto-cerrar alarma después de 10 segundos
    setTimeout(() => {
      setShowAlarm(false);
    }, 10000);
  };

  // Formatear tiempo
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular progreso
  const getProgressPercentage = (): number => {
    return Math.min((elapsedSeconds / TARGET_SECONDS) * 100, 100);
  };

  // Tiempo restante
  const getRemainingTime = (): string => {
    const remaining = Math.max(TARGET_SECONDS - elapsedSeconds, 0);
    return formatTime(remaining);
  };

  // Color del timer
  const getTimerColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'error';
    if (percentage >= 80) return 'warning';
    return 'primary';
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Timer sx={{ mr: 1 }} />
          <Typography variant="h6">Timer: {taskName}</Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h3" component="div" color={getTimerColor()}>
            {formatTime(elapsedSeconds)}
          </Typography>
          <Typography variant="body2" color={elapsedSeconds >= TARGET_SECONDS ? 'error.main' : 'text.secondary'}>
            Objetivo: {TARGET_MINUTES} minutos | {elapsedSeconds >= TARGET_SECONDS ? 'TIEMPO EXCEDIDO' : `Restante: ${getRemainingTime()}`}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={getProgressPercentage()}
            color={getTimerColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {elapsedSeconds >= TARGET_SECONDS && (
            <Chip
              icon={<Alarm />}
              label={elapsedSeconds > TARGET_SECONDS ? `¡TIEMPO EXCEDIDO! (+${Math.floor((elapsedSeconds - TARGET_SECONDS) / 60)}min)` : "¡45 minutos completados!"}
              color="error"
              variant="filled"
            />
          )}
          {timerState === 'running' && (
            <Chip label="En ejecución" color="success" variant="filled" />
          )}
          {timerState === 'paused' && (
            <Chip label="Pausado" color="warning" variant="outlined" />
          )}
          {timerState === 'stopped' && (
            <Chip label="Detenido" color="default" variant="outlined" />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          {timerState === 'running' && (
            <Button 
              variant="outlined" 
              startIcon={<Pause />} 
              onClick={() => {
                initializeAudio();
                onPause();
              }}
            >
              Pausar
            </Button>
          )}
          {timerState === 'paused' && (
            <Button 
              variant="contained" 
              startIcon={<PlayArrow />} 
              onClick={() => {
                initializeAudio();
                onResume();
              }} 
              color="success"
            >
              Reanudar
            </Button>
          )}
          {(timerState === 'running' || timerState === 'paused') && (
            <Button 
              variant="contained" 
              onClick={() => {
                initializeAudio();
                onComplete();
              }} 
              color="primary"
            >
              Completar Tarea
            </Button>
          )}
          {timerState === 'stopped' && (
            <Typography variant="body2" color="text.secondary">
              La tarea ha finalizado.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Diálogo de alarma */}
      <Dialog open={showAlarm} onClose={() => setShowAlarm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Alarm sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
          <Typography variant="h5">¡Tiempo Completado!</Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Has completado {TARGET_MINUTES} minutos en la tarea: <strong>{taskName}</strong>
          </Alert>
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Has alcanzado el tiempo objetivo de 45 minutos. Puedes completar la tarea ahora o continuar trabajando en ella.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1 }}>
          <Button onClick={() => setShowAlarm(false)} variant="outlined">
            Continuar
          </Button>
          <Button onClick={() => { setShowAlarm(false); onComplete(); }} variant="contained" color="success">
            Completar Tarea
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimpleTimer;