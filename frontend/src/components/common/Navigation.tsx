import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Paper, 
  Tabs, 
  Tab, 
  Box,
  useTheme,
  useMediaQuery 
} from '@mui/material'
import { 
  Assignment, 
  Schedule, 
  Payment, 
  Analytics 
} from '@mui/icons-material'

const Navigation: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Determinar la pestaña activa basada en la ruta
  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/' || path === '/weekly') return 0
    if (path === '/payments') return 1
    if (path === '/stats') return 2
    return 0
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const routes = ['/weekly', '/payments', '/stats']
    navigate(routes[newValue])
  }

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        borderRadius: 0,
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Box sx={{ px: { xs: 1, sm: 3 } }}>
        <Tabs
          value={getActiveTab()}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          textColor="primary"
          indicatorColor="primary"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: 56,
            '& .MuiTab-root': {
              minHeight: 56,
              textTransform: 'none',
              fontSize: isMobile ? '0.8rem' : '0.95rem',
              fontWeight: 500,
              minWidth: isMobile ? 'auto' : 160,
              padding: isMobile ? '6px 8px' : '12px 16px',
            }
          }}
        >
          <Tab
            icon={<Schedule />}
            label={isMobile ? 'Semanal' : 'Tareas Semanales'}
            iconPosition="start"
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<Payment />}
            label={isMobile ? 'Pagos' : 'Pagos y Compras'}
            iconPosition="start"
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<Analytics />}
            label="Estadísticas"
            iconPosition="start"
            sx={{ gap: 1 }}
          />
        </Tabs>
      </Box>
    </Paper>
  )
}

export default Navigation