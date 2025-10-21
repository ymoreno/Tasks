// Servicio ligero para detectar conectividad y sincronizar datos

import { offlineCache } from './offlineCache'
import api from './api'

type NetworkStatusCallback = (isOnline: boolean) => void

class NetworkStatusService {
  private isOnline: boolean = navigator.onLine
  private callbacks: NetworkStatusCallback[] = []
  private syncInProgress: boolean = false
  private lastSyncAttempt: number = 0
  private readonly SYNC_COOLDOWN = 5000 // 5 segundos entre intentos

  constructor() {
    this.setupEventListeners()
    this.checkInitialConnection()
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada')
      this.setOnlineStatus(true)
    })

    window.addEventListener('offline', () => {
      console.log('📴 Conexión perdida - modo offline activado')
      this.setOnlineStatus(false)
    })

    // Verificar conectividad periódicamente
    setInterval(() => {
      this.pingServer()
    }, 300000) // Cada 5 minutos
  }

  // Verificar conexión inicial
  private async checkInitialConnection(): Promise<void> {
    await this.pingServer()
  }

  // Ping al servidor para verificar conectividad real
  private async pingServer(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      })
      
      const wasOnline = this.isOnline
      const isNowOnline = response.ok
      
      if (wasOnline !== isNowOnline) {
        this.setOnlineStatus(isNowOnline)
      }
    } catch (error) {
      if (this.isOnline) {
        console.log('⚠️ Servidor no responde - activando modo offline')
        this.setOnlineStatus(false)
      }
    }
  }

  // Establecer estado de conexión
  private setOnlineStatus(online: boolean): void {
    const wasOnline = this.isOnline
    this.isOnline = online

    // Notificar a los callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(online)
      } catch (error) {
        console.warn('Error en callback de red:', error)
      }
    })

    // Si volvemos online, intentar sincronizar
    if (!wasOnline && online) {
      setTimeout(() => this.syncPendingActions(), 1000)
    }
  }

  // Suscribirse a cambios de estado de red
  onStatusChange(callback: NetworkStatusCallback): () => void {
    this.callbacks.push(callback)
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  // Obtener estado actual
  getStatus(): boolean {
    return this.isOnline
  }

  // Sincronizar acciones pendientes
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return
    }

    // Cooldown para evitar spam de sincronización
    const now = Date.now()
    if (now - this.lastSyncAttempt < this.SYNC_COOLDOWN) {
      return
    }

    this.syncInProgress = true
    this.lastSyncAttempt = now

    try {
      const pendingActions = offlineCache.getPendingActions()
      
      if (pendingActions.length === 0) {
        console.log('✅ No hay acciones pendientes para sincronizar')
        return
      }

      console.log(`🔄 Sincronizando ${pendingActions.length} acciones pendientes...`)
      
      let successCount = 0
      let errorCount = 0

      for (const action of pendingActions) {
        try {
          await this.executeAction(action)
          offlineCache.removePendingAction(action.id)
          successCount++
          console.log(`✅ Sincronizada: ${action.action} ${action.endpoint}`)
        } catch (error) {
          errorCount++
          console.warn(`❌ Error sincronizando ${action.action} ${action.endpoint}:`, error)
          
          // Si es un error 404 o 400, remover la acción (datos inválidos)
          if (error instanceof Error && (error.message.includes('404') || error.message.includes('400'))) {
            offlineCache.removePendingAction(action.id)
            console.log(`🗑️ Acción inválida removida: ${action.id}`)
          }
        }
      }

      if (successCount > 0) {
        console.log(`🎉 Sincronización completada: ${successCount} éxitos, ${errorCount} errores`)
        
        // Notificar a los callbacks que hubo cambios
        this.callbacks.forEach(callback => {
          try {
            callback(true) // Trigger refresh
          } catch (error) {
            console.warn('Error en callback de sincronización:', error)
          }
        })
      }
    } catch (error) {
      console.error('Error durante sincronización:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  // Ejecutar una acción pendiente
  private async executeAction(action: any): Promise<void> {
    const { endpoint, action: actionType, data } = action

    switch (actionType) {
      case 'create':
        if (endpoint.includes('/tasks')) {
          await api.post(endpoint, data)
        } else if (endpoint.includes('/payments')) {
          await api.post(endpoint, data)
        }
        break

      case 'update':
        await api.put(endpoint, data)
        break

      case 'delete':
        await api.delete(endpoint)
        break

      default:
        console.warn('Tipo de acción desconocida:', actionType)
    }
  }

  // Forzar sincronización manual
  async forcSync(): Promise<void> {
    this.lastSyncAttempt = 0 // Reset cooldown
    await this.syncPendingActions()
  }

  // Obtener estadísticas de sincronización
  getSyncStats(): {
    isOnline: boolean
    syncInProgress: boolean
    pendingActions: number
    lastSyncAttempt: number
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingActions: offlineCache.getPendingActions().length,
      lastSyncAttempt: this.lastSyncAttempt
    }
  }
}

// Instancia singleton
export const networkStatus = new NetworkStatusService()
export default networkStatus