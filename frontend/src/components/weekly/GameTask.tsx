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
  SportsEsports,
  CheckCircle
} from '@mui/icons-material';
import { Subtask } from '@/types';

interface GameTaskProps {
  isActive: boolean;
  subtask: Subtask | undefined;
  onUpdateTitle: (subtaskId: string, newTitle: string) => void;
}

const GameTask: React.FC<GameTaskProps> = ({ isActive, subtask, onUpdateTitle }) => {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');

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
          <SportsEsports sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h6">Detalle de Juego</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Chip
            label={subtask.name} // La plataforma: PSP, PS5, etc.
            color="secondary"
            variant="filled"
            sx={{ mb: 1 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            🎮 {subtask.title || '(Sin título)'} 
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
              Terminé el Juego
            </Button>
          </Box>
        )}
      </Paper>

      {/* Dialog para completar juego */}
      <Dialog open={showCompleteDialog} onClose={() => setShowCompleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            Completar Juego
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¡Felicitaciones por terminar "<strong>{subtask.title}</strong>"!
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
            Ingresa el título del próximo juego para la plataforma <strong>{subtask.name}</strong>:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Nuevo título del juego"
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ej: God of War Ragnarök"
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

export default GameTask;
