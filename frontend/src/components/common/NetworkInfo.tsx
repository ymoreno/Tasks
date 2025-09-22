import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Collapse, 
  Chip,
  useTheme,
  useMediaQuery 
} from '@mui/material'
import { 
  NetworkWifi, 
  Smartphone, 
  Computer, 
  ExpandMore, 
  ExpandLess,
  Info 
} from '@mui/icons-material'

const NetworkInfo: React.FC = () => {
  const [expanded, setExpanded] = useState(false)
  const [networkInfo, setNetworkInfo] = useState<{
    isLocal: boolean
    currentUrl: string
    isMobile: boolean
  }>({
    isLocal: false,
    currentUrl: '',
    isMobile: false
  })

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    const currentUrl = window.location.href
    const isLocal = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    setNetworkInfo({
      isLocal,
      currentUrl,
      isMobile: isMobileDevice
    })
  }, [])

  if (networkInfo.isLocal && !isMobile) {
    return null // No mostrar en localhost desde desktop
  }

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 16, 
        right: 16, 
        zIndex: 1000,
        maxWidth: 320,
        boxShadow: 3
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 1,
        cursor: 'pointer'
      }} onClick={() => setExpanded(!expanded)}>
        <NetworkWifi color="primary" sx={{ mr: 1 }} />
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {networkInfo.isMobile ? '📱 Móvil' : '🖥️ Desktop'}
        </Typography>
        <Chip 
          label={networkInfo.isLocal ? 'Local' : 'Red'} 
          size="small" 
          color={networkInfo.isLocal ? 'default' : 'success'}
          sx={{ mr: 1 }}
        />
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Información de Conexión
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {networkInfo.isMobile ? <Smartphone /> : <Computer />}
            <Typography variant="body2" sx={{ ml: 1 }}>
              {networkInfo.isMobile ? 'Dispositivo móvil' : 'Computadora'}
            </Typography>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            URL actual: {networkInfo.currentUrl}
          </Typography>
          
          {!networkInfo.isLocal && (
            <Box sx={{ 
              p: 1, 
              backgroundColor: 'success.light', 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Info color="success" sx={{ mr: 1, fontSize: 16 }} />
              <Typography variant="caption" color="success.dark">
                ✅ Conectado desde la red local
              </Typography>
            </Box>
          )}
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            💡 Tip: Ambos dispositivos deben estar en la misma red WiFi
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default NetworkInfo