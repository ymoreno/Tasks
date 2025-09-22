import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import {
  CheckCircle
} from '@mui/icons-material';
import { Subtask } from '@/types';

interface GenericSubtaskCompletionProps {
  isActive: boolean;
  subtask: Subtask | undefined;
  onSubtaskComplete: () => void; // Function to call when subtask is completed
}

const GenericSubtaskCompletion: React.FC<GenericSubtaskCompletionProps> = ({ isActive, subtask, onSubtaskComplete }) => {

  if (!subtask) {
    return null; // No mostrar nada si no hay una subtarea definida
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Detalle de Subtarea</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Chip
            label={subtask.name}
            color="primary"
            variant="filled"
            sx={{ mb: 1 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {subtask.title || '(Sin título)'} 
          </Typography>
        </Box>

        {isActive && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={onSubtaskComplete}
              color="success"
            >
              Completar Subtarea
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default GenericSubtaskCompletion;
