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

interface TaskTimerProps {
  taskName: string;
  elapsedSeconds: number;
  timerState: TimerState;
  onTick: (newSeconds: number) => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
}

const TaskTimer: React.FC<TaskTimerProps> = ({
  taskName,
  elapsedSeconds,
  timerState,
  onTick,
  onPause,
  onResume,
  onComplete
}) => {
  const [showAlarm, setShowAlarm] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const TARGET_MINUTES = 45;
  const TARGET_SECONDS = TARGET_MINUTES * 60;

  // Crear audio para la alarma (solo una vez)
  useEffect(() => {
    const createAlarmSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };
    audioRef.current = { play: createAlarmSound } as any;
  }, []);

  // Timer principal controlado por el estado del contexto
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerState === 'running') {
      interval = setInterval(() => {
        const newSeconds = elapsedSeconds + 1;
        onTick(newSeconds); // Informar al contexto del nuevo segundo

        // Alarma a los 45 minutos
        if (newSeconds >= TARGET_SECONDS) {
          setShowAlarm(true);
          playAlarm();
          onComplete(); // Completar la tarea automáticamente
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerState, elapsedSeconds, onTick, onComplete]);

  const playAlarm = () => {
    try {
      if (audioRef.current) {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            audioRef.current?.play();
          }, i * 600);
        }
      }
    } catch (error) {
      console.warn('No se pudo reproducir la alarma:', error);
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return Math.min((elapsedSeconds / TARGET_SECONDS) * 100, 100);
  };

  const getRemainingTime = (): string => {
    const remaining = Math.max(TARGET_SECONDS - elapsedSeconds, 0);
    return formatTime(remaining);
  };

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
          <Typography variant="body2" color="text.secondary">
            Objetivo: {TARGET_MINUTES} minutos | Restante: {getRemainingTime()}
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

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          {elapsedSeconds >= TARGET_SECONDS && (
            <Chip icon={<Alarm />} label="¡45 minutos completados!" color="warning" variant="filled" />
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

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          {timerState === 'running' && (
            <Button variant="outlined" startIcon={<Pause />} onClick={onPause}>
              Pausar
            </Button>
          )}
          {timerState === 'paused' && (
            <Button variant="contained" startIcon={<PlayArrow />} onClick={onResume} color="success">
              Reanudar
            </Button>
          )}
          {(timerState === 'running' || timerState === 'paused') && (
            <Button variant="contained" onClick={onComplete} color="primary">
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
            Puedes completar la tarea ahora o continuar más tarde.
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

export default TaskTimer;