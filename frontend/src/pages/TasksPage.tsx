import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Assignment, Timer, TrendingUp } from '@mui/icons-material';
import { useTaskContext } from '@/contexts/TaskContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
// import TimeTracker from '@/components/tasks/TimeTracker';

const TasksPage: React.FC = () => {
  const { tasks, loading, error, fetchTasks } = useTaskContext();

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Cargando tareas..." />;
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const categories = Object.keys(tasks);
  const totalTasks = categories.reduce((sum, cat) => sum + tasks[cat].tasks.length, 0);
  const completedTasks = categories.reduce((sum, cat) => 
    sum + tasks[cat].tasks.filter(task => task.completed).length, 0
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Gestión de Tareas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra tus tareas por categorías con sistema de puntuación
        </Typography>
      </Box>

      {/* Estadísticas generales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Tareas</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {totalTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Completadas</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {completedTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timer color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Progreso</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Categorías</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {categories.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de tareas por categoría */}
      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} key={category}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                {category}
                <Chip 
                  label={`${tasks[category].tasks.length} tareas`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarea</TableCell>
                      <TableCell>Puntuación Actual</TableCell>
                      <TableCell>Total Puntuaciones</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Tiempo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tasks[category].tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {task.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.currentScore || 'Sin puntuación'}
                            color={task.currentScore ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {task.scores.length} puntuaciones
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.completed ? 'Completada' : 'Pendiente'}
                            color={task.completed ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {Math.floor(task.timeTracking.totalTime / 1000 / 60)} min
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {categories.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay tareas disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Las tareas se cargarán automáticamente cuando estén disponibles
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TasksPage;