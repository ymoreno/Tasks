import React, { useEffect, useState } from 'react';
import { getHistory } from '../services/historyService';
import { CompletedItem } from '../types';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<CompletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (err) {
        setError('Error fetching history');
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

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
      <Typography variant="h4" gutterBottom>
        Historial de Items Completados
      </Typography>

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
    </Box>
  );
};

export default HistoryPage;
