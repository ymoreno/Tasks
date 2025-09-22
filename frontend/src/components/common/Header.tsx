import React from 'react'
import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { Assignment } from '@mui/icons-material'
import OfflineIndicator from './OfflineIndicator'

const Header: React.FC = () => {
  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Assignment sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Administrador de Tareas
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.8, display: { xs: 'none', sm: 'block' } }}>
            Gestión inteligente de tareas con seguimiento de tiempo
          </Typography>
          <OfflineIndicator size="small" />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header