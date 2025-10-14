import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import { 
  Notes as NotesIcon, 
  ExpandMore, 
  ExpandLess,
  Save as SaveIcon
} from '@mui/icons-material';
import { WeeklyTask } from '@/types';

interface TaskNotesProps {
  task: WeeklyTask;
  onUpdateNotes: (taskId: string, notes: string) => Promise<WeeklyTask>;
}

const TaskNotes: React.FC<TaskNotesProps> = ({ task, onUpdateNotes }) => {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sincronizar con las notas de la tarea cuando cambie
  useEffect(() => {
    setNotes(task.notes || '');
    setHasChanges(false);
  }, [task.notes]);

  // Detectar cambios en las notas
  useEffect(() => {
    setHasChanges(notes !== (task.notes || ''));
  }, [notes, task.notes]);

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      await onUpdateNotes(task.id, notes);
      setHasChanges(false);
    } catch (error) {
      console.error('Error guardando notas:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Guardar con Ctrl+Enter o Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: expanded ? 2 : 0 }}>
        <NotesIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Notas de {task.name}
        </Typography>
        
        {hasChanges && (
          <Chip 
            icon={<SaveIcon />}
            label="Sin guardar"
            color="warning"
            size="small"
            sx={{ mr: 1 }}
            onClick={handleSave}
            disabled={saving}
          />
        )}
        
        <IconButton 
          onClick={() => setExpanded(!expanded)}
          size="small"
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder={`Escribe tus notas sobre la tarea "${task.name}"...`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave} // Guardar automáticamente al perder el foco
          disabled={saving}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            }
          }}
          helperText={
            hasChanges 
              ? "Presiona Ctrl+Enter para guardar o haz clic fuera del campo"
              : `${notes.length} caracteres`
          }
        />
        
        {notes && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Última actualización: {new Date().toLocaleString()}
            </Typography>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

export default TaskNotes;