// Sistema de cache offline ligero para el administrador de tareas

interface CacheEntry {
  data: any
  timestamp: number
  action: 'create' | 'update' | 'delete'
  endpoint: string
  id?: string
}

interface PendingAction {
  id: string
  timestamp: number
  action: 'create' | 'update' | 'delete'
  endpoint: string
  data?: any
  originalId?: string
}

class OfflineCache {
  private readonly CACHE_PREFIX = 'task_cache_'
  private readonly PENDING_PREFIX = 'task_pending_'
  private readonly MAX_CACHE_SIZE = 50 
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

  // Guardar datos en cache
  set(key: string, data: any): void {
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        action: 'update',
        endpoint: key
      }
      
      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`, 
        JSON.stringify(entry)
      )
      
      this.cleanOldCache()
    } catch (error) {
      console.warn('Error guardando en cache:', error)
    }
  }

  // Obtener datos del cache
  get(key: string): any | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`)
      if (!cached) return null

      const entry: CacheEntry = JSON.parse(cached)
      
      // Verificar si el cache no ha expirado
      if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
        this.remove(key)
        return null
      }

      return entry.data
    } catch (error) {
      console.warn('Error leyendo cache:', error)
      return null
    }
  }

  // Remover del cache
  remove(key: string): void {
    try {
      localStorage.removeItem(`${this.CACHE_PREFIX}${key}`)
    } catch (error) {
      console.warn('Error removiendo cache:', error)
    }
  }

  // Agregar acción pendiente para sincronizar
  addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): void {
    try {
      const pendingAction: PendingAction = {
        ...action,
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }

      localStorage.setItem(
        `${this.PENDING_PREFIX}${pendingAction.id}`,
        JSON.stringify(pendingAction)
      )

      console.log('📝 Acción guardada para sincronizar:', action.action, action.endpoint)
    } catch (error) {
      console.warn('Error guardando acción pendiente:', error)
    }
  }

  // Obtener todas las acciones pendientes
  getPendingActions(): PendingAction[] {
    const actions: PendingAction[] = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.PENDING_PREFIX)) {
          const action = localStorage.getItem(key)
          if (action) {
            actions.push(JSON.parse(action))
          }
        }
      }
      
      // Ordenar por timestamp
      return actions.sort((a, b) => a.timestamp - b.timestamp)
    } catch (error) {
      console.warn('Error obteniendo acciones pendientes:', error)
      return []
    }
  }

  // Remover acción pendiente después de sincronizar
  removePendingAction(actionId: string): void {
    try {
      localStorage.removeItem(`${this.PENDING_PREFIX}${actionId}`)
    } catch (error) {
      console.warn('Error removiendo acción pendiente:', error)
    }
  }

  // Limpiar cache antiguo
  private cleanOldCache(): void {
    try {
      const cacheKeys: { key: string; timestamp: number }[] = []
      
      // Recopilar todas las claves de cache con timestamps
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.CACHE_PREFIX)) {
          const cached = localStorage.getItem(key)
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached)
            cacheKeys.push({ key, timestamp: entry.timestamp })
          }
        }
      }

      // Si hay demasiados items, remover los más antiguos
      if (cacheKeys.length > this.MAX_CACHE_SIZE) {
        cacheKeys
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, cacheKeys.length - this.MAX_CACHE_SIZE)
          .forEach(({ key }) => localStorage.removeItem(key))
      }

      // Remover cache expirado
      const now = Date.now()
      cacheKeys
        .filter(({ timestamp }) => now - timestamp > this.CACHE_DURATION)
        .forEach(({ key }) => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Error limpiando cache:', error)
    }
  }

  // Limpiar todo el cache
  clear(): void {
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.CACHE_PREFIX) || key?.startsWith(this.PENDING_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log('🗑️ Cache limpiado completamente')
    } catch (error) {
      console.warn('Error limpiando cache:', error)
    }
  }

  // Obtener estadísticas del cache
  getStats(): { cacheSize: number; pendingActions: number; oldestCache: number } {
    let cacheSize = 0
    let pendingActions = 0
    let oldestTimestamp = Date.now()

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.CACHE_PREFIX)) {
          cacheSize++
          const cached = localStorage.getItem(key)
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached)
            oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp)
          }
        } else if (key?.startsWith(this.PENDING_PREFIX)) {
          pendingActions++
        }
      }
    } catch (error) {
      console.warn('Error obteniendo estadísticas:', error)
    }

    return {
      cacheSize,
      pendingActions,
      oldestCache: oldestTimestamp
    }
  }
}

// Instancia singleton
export const offlineCache = new OfflineCache()
export default offlineCache