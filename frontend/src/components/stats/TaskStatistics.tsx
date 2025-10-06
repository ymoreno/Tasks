import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import { Timer, TrendingUp } from '@mui/icons-material';
import api from '@/services/api';

interface TaskStatistic {
  taskName: string;
  totalTime: number;
  totalSessions: number;
  averageTime: number;
  completedDays: number;
  timeByPeriod: {
    week: number;
    month: number;
    quarter: number;
    semester: number;
    year: number;
    total: number;
  };
  periodTime?: number;
}

const TaskStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<TaskStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('total');

  const periodLabels = {
    week: 'Última Semana',
    month: 'Último Mes',
    quarter: 'Último Trimestre',
    semester: 'Último Semestre',
    year: 'Último Año',
    total: 'Total Histórico'
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/weekly/task-statistics?period=${selectedPeriod}`);
      setStatistics(response.data.data || []);
    } catch (err) {
      console.error('Error fetching task statistics:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod]);

  const formatTime = (milliseconds: number): string => {
    if (milliseconds === 0) return '0min';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const getTimeForPeriod = (stat: TaskStatistic): number => {
    if (selectedPeriod === 'total') {
      return stat.totalTime;
    }
    return stat.periodTime || stat.timeByPeriod[selectedPeriod as keyof typeof stat.timeByPeriod] || 0;
  };

  const sortedStatistics = [...statistics].sort((a, b) => {
    const timeA = getTimeForPeriod(a);
    const timeB = getTimeForPeriod(b);
    return timeB - timeA;
  });

  const maxTime = sortedStatistics.length > 0 ? getTimeForPeriod(sortedStatistics[0]) : 0;

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          Estadísticas por Tarea
        </Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Cargando estadísticas...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          Estadísticas por Tarea
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          Estadísticas por Tarea
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={selectedPeriod}
            label="Período"
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <MenuItem value="week">Última Semana</MenuItem>
            <MenuItem value="month">Último Mes</MenuItem>
            <MenuItem value="quarter">Último Trimestre</MenuItem>
            <MenuItem value="semester">Último Semestre</MenuItem>
            <MenuItem value="year">Último Año</MenuItem>
            <MenuItem value="total">Total Histórico</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {sortedStatistics.length === 0 ? (
        <Alert severity="info">
          No hay datos disponibles para el período seleccionado: {periodLabels[selectedPeriod as keyof typeof periodLabels]}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Mostrando datos para: {periodLabels[selectedPeriod as keyof typeof periodLabels]}
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tarea</strong></TableCell>
                  <TableCell align="right"><strong>Tiempo Total</strong></TableCell>
                  <TableCell align="right"><strong>Sesiones</strong></TableCell>
                  <TableCell align="right"><strong>Promedio</strong></TableCell>
                  <TableCell align="center"><strong>Progreso Visual</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedStatistics.map((stat, index) => {
                  const periodTime = getTimeForPeriod(stat);
                  const progressPercentage = maxTime > 0 ? (periodTime / maxTime) * 100 : 0;
                  
                  return (
                    <TableRow key={stat.taskName} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Timer fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight="medium">
                            {stat.taskName}
                          </Typography>
                          {index === 0 && periodTime > 0 && (
                            <Chip label="Top" size="small" color="primary" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatTime(periodTime)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {selectedPeriod === 'total' ? stat.totalSessions : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {selectedPeriod === 'total' ? formatTime(stat.averageTime) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ width: '100%', maxWidth: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progressPercentage}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(progressPercentage)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {selectedPeriod === 'total' && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Nota:</strong> Las estadísticas de "Sesiones" y "Promedio" solo están disponibles para el período "Total Histórico".
                Para otros períodos se muestra únicamente el tiempo total invertido.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default TaskStatistics;