import React, { useState, useEffect } from 'react'
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Typography,
  Button,
  Paper,
  LinearProgress
} from '@mui/material'
import {
  CloudOff,
  Cloud,
  Sync,
  ExpandMore,
  ExpandLess,
  Storage
} from '@mui/icons-material'
import { networkStatus } from '@/services/networkStatus'
import { offlineCache } from '@/services/offlineCache'

const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(networkStatus.getStatus())
  const [expanded, setExpanded] = useState(false)
  const [syncStats, setSyncStats] = useState(networkStatus.getSyncStats())
  const [cacheStats, setCacheStats] = useState(offlineCache.getStats())
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Suscribirse a cambios de estado de red
    const unsubscribe = networkStatus.onStatusChange((online) => {
      setIsOnline(online)
      updateStats()
    })

    // Actualizar estadísticas periódicamente
    const interval = setInterval(updateStats, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const updateStats = () => {
    setSyncStats(networkStatus.getSyncStats())
    setCacheStats(offlineCache.getStats())
  }

  const handleForceSync = async () => {
    if (!isOnline) return
    
    setSyncing(true)
    try {
      await networkStatus.forcSync()
      updateStats()
    } catch (error) {
      console.error('Error en sincronización forzada:', error)
    } finally {
      setSyncing(false)
    }
  }

  const formatTime = (timestamp: number): string => {
    if (!timestamp) return 'Nunca'
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Hace un momento'
    if (minutes < 60) return `Hace ${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `Hace ${hours}h ${minutes % 60}m`
  }

  // No mostrar si está online y no hay acciones pendientes
  if (isOnline && syncStats.pendingActions === 0 && !expanded) {
    return null
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 1000,
        maxWidth: 320,
        boxShadow: 3,
        border: isOnline ? '1px solid #4caf50' : '1px solid #ff9800'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          cursor: 'pointer',
          backgroundColor: isOnline ? 'success.light' : 'warning.light'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {isOnline ? (
          <Cloud color="success" sx={{ mr: 1 }} />
        ) : (
          <CloudOff color="warning" sx={{ mr: 1 }} />
        )}
        
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {isOnline ? 'En línea' : 'Sin conexión'}
        </Typography>
        
        {syncStats.pendingActions > 0 && (
          <Chip
            label={syncStats.pendingActions}
            size="small"
            color="warning"
            sx={{ mr: 1 }}
          />
        )}
        
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          {/* Estado de conexión */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Estado de Conexión
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">
                {isOnline ? '🟢 Conectado al servidor' : '🔴 Modo offline activo'}
              </Typography>
              {syncStats.lastSyncAttempt > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Última sincronización: {formatTime(syncStats.lastSyncAttempt)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Acciones pendientes */}
          {syncStats.pendingActions > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Acciones Pendientes
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage fontSize="small" color="warning" />
                <Typography variant="body2">
                  {syncStats.pendingActions} cambios por sincronizar
                </Typography>
              </Box>
              
              {isOnline && (
                <Button
                  size="small"
                  startIcon={<Sync />}
                  onClick={handleForceSync}
                  disabled={syncing || syncStats.syncInProgress}
                  sx={{ mt: 1 }}
                >
                  {syncing || syncStats.syncInProgress ? 'Sincronizando...' : 'Sincronizar Ahora'}
                </Button>
              )}
              
              {(syncing || syncStats.syncInProgress) && (
                <LinearProgress sx={{ mt: 1 }} />
              )}
            </Box>
          )}

          {/* Estadísticas de cache */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Cache Local
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                📦 {cacheStats.cacheSize} elementos guardados
              </Typography>
              {cacheStats.oldestCache < Date.now() && (
                <Typography variant="caption" color="text.secondary">
                  Más antiguo: {formatTime(cacheStats.oldestCache)}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default OfflineStatus