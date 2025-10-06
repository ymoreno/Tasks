import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import {
  AccountBalance,
  Add,
  Delete,
  TrendingUp,
  AttachMoney,
  Savings,
  ShoppingCart
} from '@mui/icons-material';
import { useFinanceContext } from '@/contexts/FinanceContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DebtManager from '@/components/finances/DebtManager';

const FinancesPage: React.FC = () => {
  const {
    profile,
    expenses,
    summary,
    loading,
    error,
    createProfile,
    addExpense,
    deleteExpense,
    fetchProfile,
    fetchExpenses,
    calculateSummary
  } = useFinanceContext();

  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    monthlyIncome: '',
    distributionType: 'recommended' as 'recommended' | 'custom',
    categoryId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      await fetchProfile();
      await fetchExpenses();
    };
    loadData();
  }, []);

  // Calcular resumen cuando cambien los datos
  useEffect(() => {
    if (profile && expenses.length >= 0) {
      calculateSummary();
    }
  }, [profile, expenses]);

  // Mostrar diálogo de configuración si no hay perfil
  useEffect(() => {
    if (!loading && !profile) {
      setSetupDialogOpen(true);
    }
  }, [loading, profile]);

  const handleCreateProfile = async () => {
    if (!formData.monthlyIncome || parseFloat(formData.monthlyIncome) <= 0) {
      return;
    }

    await createProfile(parseFloat(formData.monthlyIncome), formData.distributionType);
    setSetupDialogOpen(false);
    setFormData({ ...formData, monthlyIncome: '' });
  };

  const handleAddExpense = async () => {
    if (!formData.categoryId || !formData.amount || !formData.description) {
      return;
    }

    await addExpense({
      categoryId: formData.categoryId,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date
    });

    setExpenseDialogOpen(false);
    setFormData({
      ...formData,
      categoryId: '',
      amount: '',
      description: ''
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'necessity': return <ShoppingCart />;
      case 'want': return <TrendingUp />;
      case 'saving': return <Savings />;
      default: return <AttachMoney />;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando finanzas..." />;
  }

  return (
    <Box>
      {/* Header de la página */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
            Gestor de Finanzas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra tu presupuesto y controla tus gastos
          </Typography>
        </Box>
        
        {profile && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setExpenseDialogOpen(true)}
          >
            Agregar Gasto
          </Button>
        )}
      </Box>

      {/* Mostrar errores */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {profile ? (
        <>
          {/* Tabs de navegación */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Presupuesto" />
              <Tab label="Deudas" />
              <Tab label="Resumen General" />
            </Tabs>
          </Paper>

          {/* Contenido según tab activa */}
          {activeTab === 0 && (
            <>
              {/* Resumen financiero */}
          {summary && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(summary.totalIncome)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ingreso Mensual
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(summary.totalSpent)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Gastado
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Savings sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(summary.totalRemaining)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Disponible
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AttachMoney sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {Math.round((summary.totalSpent / summary.totalBudget) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Presupuesto Usado
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Categorías de presupuesto */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribución del Presupuesto
            </Typography>
            <Grid container spacing={2}>
              {profile.categories.map((category) => {
                const spent = summary?.categoryBreakdown.find(c => c.categoryId === category.id)?.spent || 0;
                const remaining = category.budgetAmount - spent;
                const percentage = category.budgetAmount > 0 ? (spent / category.budgetAmount) * 100 : 0;
                
                return (
                  <Grid item xs={12} md={6} key={category.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ color: category.color, mr: 1 }}>
                            {getCategoryIcon(category.type)}
                          </Box>
                          <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {category.name}
                          </Typography>
                          <Chip 
                            label={`${category.percentage}%`} 
                            size="small" 
                            sx={{ backgroundColor: category.color, color: 'white' }}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {category.description}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              Gastado: {formatCurrency(spent)}
                            </Typography>
                            <Typography variant="body2">
                              Presupuesto: {formatCurrency(category.budgetAmount)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(percentage, 100)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: percentage > 100 ? 'error.main' : category.color
                              }
                            }}
                          />
                          <Typography variant="caption" color={remaining < 0 ? 'error' : 'text.secondary'}>
                            {remaining >= 0 ? `Disponible: ${formatCurrency(remaining)}` : `Excedido: ${formatCurrency(Math.abs(remaining))}`}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>

          {/* Lista de gastos recientes */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gastos Recientes
            </Typography>
            {expenses.length === 0 ? (
              <Alert severity="info">
                No hay gastos registrados. ¡Agrega tu primer gasto!
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.slice(-10).reverse().map((expense) => {
                      const category = profile.categories.find(c => c.id === expense.categoryId);
                      return (
                        <TableRow key={expense.id}>
                          <TableCell>
                            {new Date(expense.date).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={category?.name || 'Sin categoría'}
                              size="small"
                              sx={{ backgroundColor: category?.color, color: 'white' }}
                            />
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => deleteExpense(expense.id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
            </>
          )}

          {/* Tab de Deudas */}
          {activeTab === 1 && (
            <DebtManager />
          )}

          {/* Tab de Resumen General */}
          {activeTab === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Resumen Financiero Completo
              </Typography>
              <Alert severity="info">
                Esta sección mostrará un resumen completo incluyendo presupuesto, gastos y deudas.
                Próximamente: gráficos de flujo de caja, proyecciones y análisis financiero.
              </Alert>
            </Paper>
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AccountBalance sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Configura tu Perfil Financiero
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Para comenzar, necesitamos conocer tu ingreso mensual y preferencias de distribución.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setSetupDialogOpen(true)}
          >
            Configurar Ahora
          </Button>
        </Paper>
      )}

      {/* Diálogo de configuración inicial */}
      <Dialog open={setupDialogOpen} onClose={() => !profile && setSetupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Perfil Financiero</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Ingreso Mensual"
            type="number"
            value={formData.monthlyIncome}
            onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
            sx={{ mb: 3, mt: 1 }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Tipo de Distribución</InputLabel>
            <Select
              value={formData.distributionType}
              label="Tipo de Distribución"
              onChange={(e) => setFormData({ ...formData, distributionType: e.target.value as any })}
            >
              <MenuItem value="recommended">Recomendada (50/30/20)</MenuItem>
              <MenuItem value="custom">Personalizada</MenuItem>
            </Select>
          </FormControl>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Distribución Recomendada:</strong><br />
              • 50% Necesidades (vivienda, alimentación, transporte)<br />
              • 30% Deseos (entretenimiento, compras personales)<br />
              • 20% Ahorros (emergencias, inversiones)
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupDialogOpen(false)} disabled={!profile}>
            Cancelar
          </Button>
          <Button onClick={handleCreateProfile} variant="contained">
            Crear Perfil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar gasto */}
      <Dialog open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={formData.categoryId}
              label="Categoría"
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              {profile?.categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Monto"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
          />
          
          <TextField
            fullWidth
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Fecha"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddExpense} variant="contained">
            Agregar Gasto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinancesPage;