import React from 'react'
import { Chip, Tooltip } from '@mui/material'
import { CloudOff, Cloud, Sync } from '@mui/icons-material'
import { useNetworkStatus, usePendingActions } from '@/hooks/useOfflineState'

interface OfflineIndicatorProps {
  size?: 'small' | 'medium'
  showText?: boolean
}

/**
 * Indicador ligero de estado offline
 * Muestra un chip pequeño con el estado de conexión
 */
const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  size = 'small', 
  showText = true 
}) => {
  const isOnline = useNetworkStatus()
  const pendingActions = usePendingActions()

  if (isOnline && pendingActions === 0) {
    return null // No mostrar nada si está online y no hay acciones pendientes
  }

  const getChipProps = () => {
    if (!isOnline) {
      return {
        icon: <CloudOff />,
        label: showText ? 'Sin conexión' : '',
        color: 'warning' as const,
        variant: 'outlined' as const
      }
    }

    if (pendingActions > 0) {
      return {
        icon: <Sync />,
        label: showText ? `${pendingActions} pendientes` : pendingActions.toString(),
        color: 'info' as const,
        variant: 'filled' as const
      }
    }

    return {
      icon: <Cloud />,
      label: showText ? 'En línea' : '',
      color: 'success' as const,
      variant: 'outlined' as const
    }
  }

  const chipProps = getChipProps()
  const tooltipText = isOnline 
    ? `${pendingActions} cambios pendientes de sincronizar`
    : 'Sin conexión - trabajando offline'

  return (
    <Tooltip title={tooltipText} arrow>
      <Chip
        {...chipProps}
        size={size}
        sx={{
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          height: size === 'small' ? 24 : 32,
          '& .MuiChip-icon': {
            fontSize: size === 'small' ? '0.875rem' : '1rem'
          }
        }}
      />
    </Tooltip>
  )
}

export default OfflineIndicator