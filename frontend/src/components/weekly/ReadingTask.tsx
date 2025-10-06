import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  MenuBook,
  AutoStories,
  CheckCircle
} from '@mui/icons-material';
import { Subtask } from '@/types';

interface ReadingTaskProps {
  isActive: boolean;
  subtask: Subtask | undefined;
  onUpdateTitle: (subtaskId: string, newTitle: string) => void;
}

const ReadingTask: React.FC<ReadingTaskProps> = ({ isActive, subtask, onUpdateTitle }) => {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const getFormatColor = (format: string = '') => {
    switch (format.toLowerCase()) {
      case 'fisico': return 'primary';
      case 'prestado': return 'secondary';
      case 'kindle': return 'success';
      case 'pc novela': return 'info';
      case 'cell': return 'warning';
      case 'comics': return 'error';
      case 'tablet': return 'default';
      case 'extra': return 'primary';
      default: return 'default';
    }
  };

  const handleConfirmComplete = () => {
    if (!subtask || !newTitle.trim()) return;
    onUpdateTitle(subtask.id, newTitle.trim());
    setShowCompleteDialog(false);
    setNewTitle('');
  };

  if (!subtask) {
    return null; // No mostrar nada si no hay una subtarea definida
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MenuBook sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h6">Detalle de Lectura</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Chip
            label={subtask.name} // El formato: Kindle, Cell, etc.
            color={getFormatColor(subtask.name) as any}
            variant="filled"
            icon={<AutoStories />}
            sx={{ mb: 1 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            📖 {subtask.title || '(Sin título)'} 
          </Typography>
        </Box>

        {isActive && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={() => setShowCompleteDialog(true)}
              color="success"
            >
              Terminé el Libro
            </Button>
          </Box>
        )}
      </Paper>

      {/* Dialog para completar libro */}
      <Dialog open={showCompleteDialog} onClose={() => setShowCompleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            Completar Libro
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¡Felicitaciones por terminar "<strong>{subtask.title}</strong>"!
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
            Ingresa el título del próximo libro para el formato <strong>{subtask.name}</strong>:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Nuevo título del libro"
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ej: El imperio final"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmComplete} variant="contained" disabled={!newTitle.trim()} color="success">
            Guardar y Actualizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReadingTask;
