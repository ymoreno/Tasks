import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import api from '@/services/api';

interface RotationItem {
  taskName: string;
  currentSubtask: string;
  currentTitle?: string;
  nestedSubtask?: string;
  nestedTitle?: string;
}

const RotationSummary: React.FC = () => {
  const [rotations, setRotations] = useState<RotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRotationSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/weekly/rotation-summary');
      setRotations(response.data.data);
    } catch (err) {
      console.error('Error fetching rotation summary:', err);
      setError('Error al cargar el resumen de rotaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRotationSummary();
  }, []);

  const formatRotationDisplay = (item: RotationItem): string => {
    let display = item.currentSubtask;
    
    if (item.nestedSubtask) {
      display += ` → ${item.nestedSubtask}`;
    }
    
    return display;
  };

  const getRotationTitle = (item: RotationItem): string | undefined => {
    return item.nestedTitle || item.currentTitle;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          <Refresh sx={{ mr: 1, verticalAlign: 'middle' }} />
          Rotaciones Actuales
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cargando...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          <Refresh sx={{ mr: 1, verticalAlign: 'middle' }} />
          Rotaciones Actuales
        </Typography>
        <Alert severity="error">
          {error}
        </Alert>
      </Paper>
    );
  }

  if (rotations.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          <Refresh sx={{ mr: 1, verticalAlign: 'middle' }} />
          Rotaciones Actuales
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No hay tareas con rotación configuradas
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        <Refresh sx={{ mr: 1, verticalAlign: 'middle' }} />
        Rotaciones Actuales
      </Typography>
      
      <List dense>
        {rotations.map((item, index) => (
          <React.Fragment key={`${item.taskName}-${index}`}>
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {item.taskName}:
                    </Typography>
                    <Chip 
                      label={formatRotationDisplay(item)}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                }
                secondary={getRotationTitle(item) && (
                  <Typography variant="caption" color="text.secondary">
                    {getRotationTitle(item)}
                  </Typography>
                )}
              />
            </ListItem>
            {index < rotations.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Información de rotaciones para esta semana
      </Typography>
    </Paper>
  );
};

export default RotationSummary;