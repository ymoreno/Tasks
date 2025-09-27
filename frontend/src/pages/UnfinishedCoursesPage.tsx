import React, { useEffect, useState } from 'react';
import { weeklyService } from '../services/api';
import { Subtask } from '../types';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';

const UnfinishedCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnfinishedCourses = async () => {
      try {
        const data = await weeklyService.getUnfinishedCourses();
        setCourses(data);
      } catch (err) {
        setError('Error fetching unfinished courses');
      }
      setLoading(false);
    };

    fetchUnfinishedCourses();
  }, []);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cursos no Terminados
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre del Curso</TableCell>
              <TableCell>Tarea Padre</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{course.name}</TableCell>
                <TableCell>{course.parentName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UnfinishedCoursesPage;
