import React, { useEffect, useState } from 'react';
import { getHistory } from '../services/historyService';
import { CompletedItem } from '../types';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Select, MenuItem, FormControl, InputLabel, Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import AddCompletedItem from '@/components/history/AddCompletedItem';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<CompletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [showAddCompletedDialog, setShowAddCompletedDialog] = useState(false);

  const fetchHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (err) {
      setError('Error fetching history');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Función para refrescar el historial después de agregar un item
  const handleItemAdded = () => {
    fetchHistory();
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'All') return true;
    return item.type === filter;
  });

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
          Historial de Items Completados
        </Typography>
      </Box>

      <FormControl sx={{ mb: 2, minWidth: 120 }}>
        <InputLabel>Filtrar por tipo</InputLabel>
        <Select
          value={filter}
          label="Filtrar por tipo"
          onChange={(e) => setFilter(e.target.value)}
        >
          <MenuItem value="All">Todos</MenuItem>
          <MenuItem value="Course">Cursos</MenuItem>
          <MenuItem value="Book">Libros</MenuItem>
          <MenuItem value="Game">Juegos</MenuItem>
        </Select>
      </FormControl>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Fecha de Finalización</TableCell>
              <TableCell>Tiempo Invertido (minutos)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{new Date(item.completedDate).toLocaleString()}</TableCell>
                <TableCell>{item.timeSpent ? (item.timeSpent / 60000).toFixed(2) : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Botón flotante para agregar items completados */}
      <Fab
        color="primary"
        aria-label="Agregar item completado"
        onClick={() => setShowAddCompletedDialog(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <Add />
      </Fab>

      {/* Diálogo para agregar items completados */}
      <AddCompletedItem
        open={showAddCompletedDialog}
        onClose={() => {
          setShowAddCompletedDialog(false);
          handleItemAdded(); // Refrescar la lista después de agregar
        }}
      />
    </Box>
  );
};

export default HistoryPage;
