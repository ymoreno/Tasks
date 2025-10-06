import React, { useEffect, useState } from 'react';
import { weeklyService } from '../services/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Snackbar
} from '@mui/material';
import { Add, School } from '@mui/icons-material';

const UnfinishedCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCourseName, setNewCourseName] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchUnfinishedCourses = async () => {
    try {
      setLoading(true);
      const data = await weeklyService.getUnfinishedCourses();
      setCourses(data);
      setError(null);
    } catch (err) {
      setError('Error fetching unfinished courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnfinishedCourses();
  }, []);

  const handleAddCourse = async (category: 'practicas' | 'related') => {
    if (!newCourseName.trim()) return;

    try {
      const parentSubtaskId = category === 'practicas' ? 'sub_mac_practicas' : 'sub_mac_related';
      await weeklyService.addCourseToSubtask(parentSubtaskId, newCourseName.trim());
      
      // Mostrar mensaje de éxito
      setSuccessMessage(`✅ Curso "${newCourseName}" agregado exitosamente a ${category === 'practicas' ? 'Prácticas' : 'Related'}`);
      setShowSuccess(true);
      
      // Limpiar formulario
      setNewCourseName('');
      
      // Recargar lista de cursos
      await fetchUnfinishedCourses();
    } catch (error) {
      setError('Error agregando curso. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Cursos no Terminados
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona y agrega nuevos cursos a tus categorías de aprendizaje
        </Typography>
      </Box>

      {/* Sección para agregar cursos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Agregar Nuevo Curso</Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Nombre del Curso"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                placeholder="Ej: React Avanzado, Machine Learning, etc."
              />
            </CardContent>
            
            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleAddCourse('practicas')}
                disabled={!newCourseName.trim() || loading}
                color="primary"
              >
                Agregar a Prácticas
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => handleAddCourse('related')}
                disabled={!newCourseName.trim() || loading}
                color="secondary"
              >
                Agregar a Related
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Estadísticas de Cursos
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total de cursos no terminados
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {courses.length}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2">
                  Prácticas: {courses.filter(c => c.parentSubtask === 'Practicas').length} cursos
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2">
                  Related: {courses.filter(c => c.parentSubtask === 'Related').length} cursos
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de cursos */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre del Curso</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Tiempo Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((course: any) => (
                <TableRow key={course.id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {course.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: course.parentSubtask === 'Practicas' ? 'primary.main' : 'secondary.main',
                        fontWeight: 500
                      }}
                    >
                      {course.parentSubtask}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {course.timeTracking?.totalTime 
                        ? `${Math.floor(course.timeTracking.totalTime / 1000 / 60)} min`
                        : '0 min'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Mensaje de estado vacío */}
      {courses.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay cursos no terminados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agrega nuevos cursos usando el formulario de arriba
          </Typography>
        </Box>
      )}

      {/* Snackbar para mensajes de éxito */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Snackbar para errores */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setError(null)} 
            severity="error" 
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default UnfinishedCoursesPage;
