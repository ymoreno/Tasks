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
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now());
  const audioContextRef = useRef<AudioContext | null>(null);

  const TARGET_MINUTES = 45;
  const TARGET_SECONDS = TARGET_MINUTES * 60;

  // Solicitar permisos de notificación al montar el componente
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Inicializar audio context cuando el usuario interactúe
  const initializeAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setAudioEnabled(true);
    } catch (error) {
      console.warn('Error inicializando audio:', error);
    }
  };

  // Función para crear y reproducir un sonido de alarma
  const createAlarmSound = async () => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
        await initializeAudio();
      }

      if (!audioContextRef.current) return;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Configurar el sonido (tono más agudo y distintivo)
      oscillator.frequency.setValueAtTime(1200, audioContextRef.current.currentTime);
      oscillator.type = 'square'; // Sonido más distintivo

      // Configurar el volumen con fade in/out
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioContextRef.current.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.3);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.3);

      return new Promise<void>((resolve) => {
        oscillator.onended = () => resolve();
      });
    } catch (error) {
      console.warn('Error creando sonido de alarma:', error);
      // Fallback: vibración si está disponible
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }
  };

  // Timer principal controlado por el estado del contexto
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerState === 'running') {
      interval = setInterval(() => {
        const now = Date.now();
        const timeSinceLastTick = now - lastTickTime;

        // Detectar si el sistema estuvo pausado (más de 2 segundos desde el último tick)
        if (timeSinceLastTick > 2000) {
          // Calcular el tiempo real que debería haber transcurrido
          if (startTime) {
            const startDate = new Date(`1970-01-01T${startTime}`);
            const currentTimeStr = new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            const currentDate = new Date(`1970-01-01T${currentTimeStr}`);
            const realElapsedMs = currentDate.getTime() - startDate.getTime();
            const realElapsedSeconds = Math.floor(realElapsedMs / 1000);

            // Corregir el timer al tiempo real
            if (realElapsedSeconds > elapsedSeconds) {
              onTick(realElapsedSeconds);
              setLastTickTime(now);

              // Verificar alarma después de la corrección
              if (realElapsedSeconds >= TARGET_SECONDS && elapsedSeconds < TARGET_SECONDS) {
                setShowAlarm(true);
                playAlarm();
                onPause();
              }

              return; // Salir para evitar el tick normal
            }
          }
        }

        // Tick normal
        const newSeconds = elapsedSeconds + 1;
        onTick(newSeconds);
        setLastTickTime(now);

        // Alarma a los 45 minutos (activar cuando se alcanza o supera por primera vez)
        if (newSeconds >= TARGET_SECONDS && elapsedSeconds < TARGET_SECONDS) {
          setShowAlarm(true);
          playAlarm();
          // Pausar automáticamente el timer
          onPause();
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerState, elapsedSeconds, onTick, onComplete, lastTickTime, startTime]);

  // Capturar tiempo de inicio y fin
  useEffect(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    if (timerState === 'running' && !startTime) {
      // Capturar tiempo de inicio cuando el timer comience a correr
      setStartTime(timeString);
      setEndTime(null); // Limpiar tiempo de fin anterior
      setLastTickTime(Date.now()); // Inicializar el tiempo del último tick
    } else if ((timerState === 'stopped' || timerState === 'paused') && elapsedSeconds >= TARGET_SECONDS && !endTime) {
      // Capturar tiempo de fin cuando se complete, pause o detenga después de 45 minutos
      setEndTime(timeString);
    } else if (timerState === 'stopped' && elapsedSeconds === 0) {
      // Reset cuando se detiene completamente el timer
      setStartTime(null);
      setEndTime(null);
    }
  }, [timerState, elapsedSeconds, startTime, endTime]);

  // Verificación independiente de alarma (backup)
  useEffect(() => {
    if (timerState === 'running' && elapsedSeconds >= TARGET_SECONDS && !showAlarm) {
      setShowAlarm(true);
      playAlarm();
      onPause();
    }
  }, [elapsedSeconds, timerState, showAlarm]);

  const playAlarm = async () => {

    try {
      // Reproducir 3 beeps con pausa entre ellos
      for (let i = 0; i < 3; i++) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
        await createAlarmSound();
      }
    } catch (error) {
      console.warn('No se pudo reproducir la alarma de audio:', error);
    }

    // Intentar notificación del navegador como respaldo
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('¡Tiempo completado!', {
          body: `Has completado 45 minutos en: ${taskName}`,
          icon: '/favicon.ico',
          tag: 'task-timer',
          requireInteraction: false
        });
      }
    } catch (notificationError) {
      console.warn('No se pudo mostrar notificación:', notificationError);
    }

    // Vibración como respaldo adicional
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 200, 300, 200, 300]);
      }
    } catch (vibrationError) {
      console.warn('No se pudo activar vibración:', vibrationError);
    }

    // Cerrar automáticamente el diálogo después de 10 segundos
    setTimeout(() => {
      setShowAlarm(false);
    }, 10000);
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
          <Typography variant="body2" color={elapsedSeconds >= TARGET_SECONDS ? 'error.main' : 'text.secondary'}>
            Objetivo: {TARGET_MINUTES} minutos | {elapsedSeconds >= TARGET_SECONDS ? 'TIEMPO EXCEDIDO' : `Restante: ${getRemainingTime()}`}
          </Typography>

          {/* Timestamps de tiempo real */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'info.dark' }}>
              ⏰ Verificación de Tiempo Real
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                  Hora de Inicio
                </Typography>
                <Typography variant="h6" sx={{ color: startTime ? 'success.main' : 'text.disabled' }}>
                  {startTime || '--:--:--'}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                  Hora de Fin (45min)
                </Typography>
                <Typography variant="h6" sx={{ color: endTime ? 'error.main' : 'text.disabled' }}>
                  {endTime || '--:--:--'}
                </Typography>
              </Box>
              {startTime && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                    {endTime ? 'Duración Real' : 'Tiempo Real Transcurrido'}
                  </Typography>
                  <Typography variant="h6" sx={{ color: endTime ? 'warning.main' : 'info.main' }}>
                    {(() => {
                      const startDate = new Date(`1970-01-01T${startTime}`);
                      const currentTime = endTime || new Date().toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      });
                      const endDate = new Date(`1970-01-01T${currentTime}`);
                      const realDurationMs = endDate.getTime() - startDate.getTime();
                      const realDurationMin = Math.floor(realDurationMs / 60000);
                      const realDurationSec = Math.floor((realDurationMs % 60000) / 1000);
                      return `${realDurationMin}:${realDurationSec.toString().padStart(2, '0')}`;
                    })()}
                  </Typography>
                </Box>
              )}
              {startTime && timerState === 'running' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                    Desfase Detectado
                  </Typography>
                  <Typography variant="h6" sx={{
                    color: (() => {
                      const timerMin = Math.floor(elapsedSeconds / 60);
                      const startDate = new Date(`1970-01-01T${startTime}`);
                      const now = new Date();
                      const currentTime = now.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      });
                      const endDate = new Date(`1970-01-01T${currentTime}`);
                      const realDurationMs = endDate.getTime() - startDate.getTime();
                      const realMin = Math.floor(realDurationMs / 60000);
                      const diff = Math.abs(timerMin - realMin);
                      return diff <= 1 ? 'success.main' : diff <= 3 ? 'warning.main' : 'error.main';
                    })()
                  }}>
                    {(() => {
                      const timerMin = Math.floor(elapsedSeconds / 60);
                      const startDate = new Date(`1970-01-01T${startTime}`);
                      const now = new Date();
                      const currentTime = now.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      });
                      const endDate = new Date(`1970-01-01T${currentTime}`);
                      const realDurationMs = endDate.getTime() - startDate.getTime();
                      const realMin = Math.floor(realDurationMs / 60000);
                      const diff = timerMin - realMin;
                      return diff === 0 ? '✅ Sincronizado' : `${diff > 0 ? '+' : ''}${diff}min`;
                    })()}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                Compara con tu reloj real
              </Typography>
              {startTime && (
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setStartTime(null);
                    setEndTime(null);
                  }}
                >
                  Reset Tiempos
                </Button>
              )}
            </Box>
          </Box>
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
          {audioEnabled && (timerState === 'running' || timerState === 'paused') && (
            <Chip icon={<Alarm />} label="Alarma activa" color="info" variant="outlined" size="small" />
          )}
          {startTime && timerState === 'running' && (
            <Chip
              label="🔄 Auto-corrección activa"
              color="secondary"
              variant="outlined"
              size="small"
            />
          )}
          {timerState === 'running' && elapsedSeconds < TARGET_SECONDS && (
            <Chip
              label={`🔔 Alarma en ${Math.ceil((TARGET_SECONDS - elapsedSeconds) / 60)}min`}
              color="info"
              variant="outlined"
              size="small"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
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
          {!audioEnabled && (timerState === 'running' || timerState === 'paused') && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Alarm />}
              onClick={initializeAudio}
              color="warning"
            >
              Habilitar Alarma
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

export default TaskTimer;