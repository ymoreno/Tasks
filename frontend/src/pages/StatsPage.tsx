import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { TrendingUp, Payment } from '@mui/icons-material';
import { useWeeklyContext } from '@/contexts/WeeklyContext';
import { usePaymentContext } from '@/contexts/PaymentContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getHistory } from '../services/historyService';
import { CompletedItem } from '../types';

const StatsPage: React.FC = () => {
  const { weeklyTasks, dayState, fetchWeeklyTasks, fetchCurrentDay } = useWeeklyContext();
  const { payments, fetchPayments } = usePaymentContext();
  const [history, setHistory] = useState<CompletedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar todos los datos
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWeeklyTasks(),
        fetchCurrentDay(),
        fetchPayments(),
        getHistory().then(setHistory),
      ]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  // Calcular estadísticas
  const weeklyProgress = weeklyTasks.length > 0 && dayState
    ? Math.round((dayState.completedTasks.length / weeklyTasks.length) * 100)
    : 0;

  if (loading) {
    return <LoadingSpinner message="Cargando estadísticas..." />;
  }

  return (
    <Box>
      {/* Header de la página */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
          Estadísticas y Análisis
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Análisis de tu productividad y patrones de trabajo
        </Typography>
      </Box>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {weeklyProgress}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Progreso Semanal
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayState?.completedTasks.length || 0} de {weeklyTasks.length} tareas
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Payment sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {payments.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Items de Compra
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {payments.filter(p => p.url).length} con URL
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Análisis detallado */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, minHeight: 300 }}>
            <Typography variant="h6" gutterBottom>
              Historial de Tiempos
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tarea</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tiempo Invertido (minutos)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{new Date(item.completedDate).toLocaleString()}</TableCell>
                      <TableCell>{item.timeSpent ? (item.timeSpent / 60000).toFixed(2) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatsPage;
