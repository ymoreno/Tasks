import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip
} from '@mui/material';
import { Add, Book, SportsEsports, School } from '@mui/icons-material';
import { useWeeklyContext } from '@/contexts/WeeklyContext';

interface AddCompletedItemProps {
  open: boolean;
  onClose: () => void;
}

const AddCompletedItem: React.FC<AddCompletedItemProps> = ({ open, onClose }) => {
  const { addCompletedItem } = useWeeklyContext();
  const [type, setType] = useState<'Book' | 'Game' | 'Course'>('Game');
  const [name, setName] = useState('');
  const [timeSpent, setTimeSpent] = useState('45');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const timeInSeconds = parseInt(timeSpent) * 60; // Convertir minutos a segundos
      await addCompletedItem(type, name.trim(), timeInSeconds);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error agregando item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setTimeSpent('45');
    setType('Game');
    setSuccess(false);
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'Book': return <Book />;
      case 'Game': return <SportsEsports />;
      case 'Course': return <School />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'Book': return 'Libro';
      case 'Game': return 'Juego';
      case 'Course': return 'Curso';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Add />
        Agregar {getTypeLabel()} Completado
      </DialogTitle>
      
      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡{getTypeLabel()} "{name}" agregado al historial exitosamente!
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Selector de Tipo */}
          <FormControl fullWidth>
            <InputLabel>Tipo de Item</InputLabel>
            <Select
              value={type}
              label="Tipo de Item"
              onChange={(e) => setType(e.target.value as 'Book' | 'Game' | 'Course')}
            >
              <MenuItem value="Game">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SportsEsports fontSize="small" />
                  Juego
                </Box>
              </MenuItem>
              <MenuItem value="Book">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Book fontSize="small" />
                  Libro
                </Box>
              </MenuItem>
              <MenuItem value="Course">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School fontSize="small" />
                  Curso
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Nombre del Item */}
          <TextField
            fullWidth
            label={`Nombre del ${getTypeLabel()}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              type === 'Game' ? 'ej: Street Sense, Final Fantasy VII' :
              type === 'Book' ? 'ej: El Señor de los Anillos, 1984' :
              'ej: React Avanzado, Machine Learning'
            }
            InputProps={{
              startAdornment: getIcon()
            }}
          />

          {/* Tiempo Dedicado */}
          <TextField
            fullWidth
            label="Tiempo Dedicado (minutos)"
            type="number"
            value={timeSpent}
            onChange={(e) => setTimeSpent(e.target.value)}
            inputProps={{ min: 1, max: 999 }}
            helperText="Tiempo aproximado que dedicaste a completar este item"
          />

          {/* Preview */}
          {name && (
            <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Vista Previa:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={getIcon()}
                  label={type}
                  size="small"
                  color={type === 'Game' ? 'primary' : type === 'Book' ? 'secondary' : 'success'}
                />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({timeSpent} min)
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || loading}
          startIcon={getIcon()}
        >
          {loading ? 'Agregando...' : `Agregar ${getTypeLabel()}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCompletedItem;