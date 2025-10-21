import { useState, useEffect, useCallback } from 'react'
import { networkStatus } from '@/services/networkStatus'
import { offlineCache } from '@/services/offlineCache'

interface OfflineState {
  isOnline: boolean
  pendingActions: number
  cacheSize: number
  isLoading: boolean
  lastSync: number
}

interface OfflineActions {
  forceSync: () => Promise<void>
  clearCache: () => void
  refreshData: () => void
}

/**
 * Hook ligero para manejar estado offline
 * Proporciona información del estado de conexión y acciones básicas
 */
export const useOfflineState = (): [OfflineState, OfflineActions] => {
  const [state, setState] = useState<OfflineState>({
    isOnline: networkStatus.getStatus(),
    pendingActions: 0,
    cacheSize: 0,
    isLoading: false,
    lastSync: 0
  })

  const updateState = useCallback(() => {
    const syncStats = networkStatus.getSyncStats()
    const cacheStats = offlineCache.getStats()
    
    setState(prev => ({
      ...prev,
      isOnline: syncStats.isOnline,
      pendingActions: syncStats.pendingActions,
      cacheSize: cacheStats.cacheSize,
      isLoading: syncStats.syncInProgress,
      lastSync: syncStats.lastSyncAttempt
    }))
  }, [])

  useEffect(() => {
    // Estado inicial
    updateState()

    // Suscribirse a cambios de red
    const unsubscribe = networkStatus.onStatusChange(() => {
      updateState()
    })

    // Actualizar cada 10 segundos
    const interval = setInterval(updateState, 10000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [updateState])

  // Acciones disponibles
  const actions: OfflineActions = {
    forceSync: async () => {
      if (!state.isOnline) return
      
      setState(prev => ({ ...prev, isLoading: true }))
      try {
        await networkStatus.forcSync()
        updateState()
      } catch (error) {
        console.error('Error en sincronización:', error)
      } finally {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    },

    clearCache: () => {
      offlineCache.clear()
      updateState()
    },

    refreshData: () => {
      updateState()
    }
  }

  return [state, actions]
}

/**
 * Hook simplificado que solo retorna si está online/offline
 */
export const useNetworkStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(networkStatus.getStatus())

  useEffect(() => {
    const unsubscribe = networkStatus.onStatusChange(setIsOnline)
    return unsubscribe
  }, [])

  return isOnline
}

/**
 * Hook para obtener solo las acciones pendientes
 */
export const usePendingActions = (): number => {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      setPendingCount(networkStatus.getSyncStats().pendingActions)
    }

    updateCount()
    const unsubscribe = networkStatus.onStatusChange(updateCount)
    const interval = setInterval(updateCount, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  return pendingCount
}

export default useOfflineState