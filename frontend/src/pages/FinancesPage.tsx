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
  Tab,
  Divider
} from '@mui/material';
import {
  AccountBalance,
  Add,
  Delete,
  TrendingUp,
  AttachMoney,
  Savings,
  ShoppingCart,
  CreditCard,
  Assessment,
  TrendingDown,
  Security
} from '@mui/icons-material';
import { useFinanceContext } from '@/contexts/FinanceContext';
import { BudgetDistribution } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DebtManager from '@/components/finances/DebtManager';
import { BudgetDistributionSelector } from '@/components/finances/BudgetDistributionSelector';
import { DebtCategoryCard } from '@/components/finances/DebtCategoryCard';

const FinancesPage: React.FC = () => {
  const {
    profile,
    expenses,
    debts,
    debtPayments,
    summary,
    debtSummary,
    debtMetrics,
    loading,
    error,
    createProfile,
    updateProfile,
    addExpense,
    deleteExpense,
    fetchProfile,
    fetchExpenses,
    fetchDebts,
    fetchDebtPayments,
    calculateSummary,
    calculateDebtSummary,
    calculateDebtMetrics,
    updateBudgetDistribution
  } = useFinanceContext();

  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDistribution, setSelectedDistribution] = useState<BudgetDistribution | null>(null);
  const [formData, setFormData] = useState({
    monthlyIncome: '',
    distributionType: 'debt-aware' as 'recommended' | 'custom' | 'debt-aware',
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
      await fetchDebts();
      await fetchDebtPayments();
    };
    loadData();
  }, []);

  // Calcular métricas de deudas cuando cambien los datos relevantes
  useEffect(() => {
    if (profile && debts) {
      calculateDebtMetrics();
      if (debts.length > 0) {
        calculateDebtSummary();
      }
    }
  }, [profile, debts]);

  // Calcular resumen cuando cambien los datos
  useEffect(() => {
    if (profile && expenses.length >= 0) {
      calculateSummary();
    }
  }, [profile, expenses]);

  // Pre-llenar formulario cuando se edita perfil existente
  useEffect(() => {
    if (setupDialogOpen && profile) {
      setFormData(prev => ({
        ...prev,
        monthlyIncome: profile.monthlyIncome.toString(),
        distributionType: profile.distributionType || 'debt-aware'
      }));
      
      // Resetear distribución seleccionada para que el selector calcule la actual
      setSelectedDistribution(null);
    }
  }, [setupDialogOpen, profile]);

  const handleCreateOrUpdateProfile = async () => {
    const income = parseFormattedInput(formData.monthlyIncome);
    if (!formData.monthlyIncome || income <= 0) {
      return;
    }

    try {
      if (profile) {
        // Actualizar perfil existente
        const updates: any = {
          monthlyIncome: income,
          distributionType: formData.distributionType
        };

        // Si hay deudas y se seleccionó distribución inteligente o personalizada, incluir configuración de deudas
        if (debts && debts.length > 0 && (formData.distributionType === 'debt-aware' || formData.distributionType === 'custom')) {
          updates.debtSettings = {
            includeDebtCategory: true,
            autoCalculateFromDebts: formData.distributionType === 'debt-aware',
            alertThresholds: {
              highDebt: 30,
              criticalDebt: 40
            }
          };
        }

        await updateProfile(updates);

        // Si se seleccionó una distribución específica, aplicarla
        if (selectedDistribution && formData.distributionType === 'custom') {
          await updateBudgetDistribution(selectedDistribution);
        }
      } else {
        // Crear nuevo perfil
        await createProfile(income, formData.distributionType);

        // Si se seleccionó una distribución específica para el nuevo perfil, aplicarla después de la creación
        if (selectedDistribution && formData.distributionType === 'custom') {
          // Esperar un poco para que el perfil se cree completamente
          setTimeout(async () => {
            await updateBudgetDistribution(selectedDistribution);
          }, 500);
        }
      }
      
      setSetupDialogOpen(false);
      setFormData({ ...formData, monthlyIncome: '' });
      setSelectedDistribution(null);
    } catch (error) {
      console.error('Error al crear/actualizar perfil:', error);
    }
  };

  const handleAddExpense = async () => {
    const amount = parseFormattedInput(formData.amount);
    if (!formData.categoryId || !formData.amount || !formData.description || amount <= 0) {
      return;
    }

    await addExpense({
      categoryId: formData.categoryId,
      amount: amount,
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Formatear número para input (sin símbolo de moneda)
  const formatNumberInput = (value: string): string => {
    // Remover todo excepto números
    const numbers = value.replace(/[^0-9]/g, '');
    if (!numbers) return '';
    
    // Formatear con separadores de miles
    return new Intl.NumberFormat('es-CO').format(parseInt(numbers));
  };

  // Obtener valor numérico de input formateado
  const parseFormattedInput = (value: string): number => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? parseInt(numbers) : 0;
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'necessity': return <ShoppingCart />;
      case 'debt': return <CreditCard />;
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AccountBalance />}
              onClick={() => setSetupDialogOpen(true)}
            >
              Editar Perfil
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setExpenseDialogOpen(true)}
            >
              Agregar Gasto
            </Button>
          </Box>
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
              {/* Primera fila - Métricas básicas */}
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

              {/* Segunda fila - Métricas de deudas (si existen) */}
              {debtMetrics && debts && debts.length > 0 && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <CreditCard sx={{ 
                          fontSize: 40, 
                          color: debtMetrics.riskLevel === 'low' ? 'success.main' : 
                                 debtMetrics.riskLevel === 'medium' ? 'warning.main' : 'error.main', 
                          mb: 1 
                        }} />
                        <Typography variant="h6" fontWeight="bold">
                          {formatCurrency(debtMetrics.totalDebt)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Deudas
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <TrendingDown sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {formatCurrency(debtMetrics.totalMinimumPayments)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pagos Mínimos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Assessment sx={{ 
                          fontSize: 40, 
                          color: debtMetrics.debtToIncomeRatio < 20 ? 'success.main' : 
                                 debtMetrics.debtToIncomeRatio < 40 ? 'warning.main' : 'error.main', 
                          mb: 1 
                        }} />
                        <Typography variant="h6" fontWeight="bold">
                          {debtMetrics.debtToIncomeRatio.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ratio Deuda/Ingreso
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Security sx={{ 
                          fontSize: 40, 
                          color: debtMetrics.riskLevel === 'low' ? 'success.main' : 
                                 debtMetrics.riskLevel === 'medium' ? 'warning.main' : 'error.main', 
                          mb: 1 
                        }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                          {debtMetrics.riskLevel === 'low' ? 'Bajo' :
                           debtMetrics.riskLevel === 'medium' ? 'Medio' :
                           debtMetrics.riskLevel === 'high' ? 'Alto' : 'Crítico'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Nivel de Riesgo
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
          )}

          {/* Categorías de presupuesto */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribución del Presupuesto
            </Typography>
            
            {/* Categorías Básicas (Necesidades, Deseos, Ahorros) */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                💰 Categorías Principales
              </Typography>
              <Grid container spacing={2}>
                {(() => {
                  // Filtrar solo categorías que NO son deudas
                  const basicCategories = profile.categories.filter(cat => cat.type !== 'debt');
                  const categoryOrder = ['necessity', 'want', 'saving'];
                  const sortedBasicCategories = [...basicCategories].sort((a, b) => {
                    const aIndex = categoryOrder.indexOf(a.type);
                    const bIndex = categoryOrder.indexOf(b.type);
                    return aIndex - bIndex;
                  });

                  return sortedBasicCategories.map((category) => {
                    const spent = summary?.categoryBreakdown.find(c => c.categoryId === category.id)?.spent || 0;
                    const remaining = category.budgetAmount - spent;
                    const percentage = category.budgetAmount > 0 ? (spent / category.budgetAmount) * 100 : 0;
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ color: category.color, mr: 1 }}>
                                {getCategoryIcon(category.type)}
                              </Box>
                              <Typography variant="subtitle1" sx={{ flexGrow: 1, fontSize: '0.95rem' }}>
                                {category.name}
                              </Typography>
                              <Chip 
                                label={`${category.percentage}%`} 
                                size="small" 
                                sx={{ backgroundColor: category.color, color: 'white', fontSize: '0.75rem' }}
                              />
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              {category.description}
                            </Typography>
                            
                            <Box sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption">
                                  Gastado: {formatCurrency(spent)}
                                </Typography>
                                <Typography variant="caption">
                                  Presupuesto: {formatCurrency(category.budgetAmount)}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(percentage, 100)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: percentage > 100 ? 'error.main' : category.color
                                  }
                                }}
                              />
                              <Typography variant="caption" color={remaining < 0 ? 'error' : 'text.secondary'} display="block" sx={{ mt: 0.5 }}>
                                {remaining >= 0 ? `Disponible: ${formatCurrency(remaining)}` : `Excedido: ${formatCurrency(Math.abs(remaining))}`}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  });
                })()}
              </Grid>
            </Box>

            {/* Categorías de Deudas - Solo si existen */}
            {profile.categories.some(cat => cat.type === 'debt') && (
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  💳 Gestión de Deudas
                </Typography>
                <Grid container spacing={2}>
                  {profile.categories
                    .filter(cat => cat.type === 'debt')
                    .map((category) => (
                      <Grid item xs={12} sm={6} md={6} lg={4} key={category.id}>
                        <DebtCategoryCard
                          category={category}
                          debts={debts || []}
                          debtPayments={debtPayments || []}
                          monthlyIncome={profile.monthlyIncome}
                          onPaymentRecord={() => {
                            // Refrescar datos después de registrar pago
                            calculateSummary();
                            calculateDebtSummary();
                          }}
                        />
                      </Grid>
                    ))}
                </Grid>
              </Box>
            )}
          </Paper>

          {/* Indicadores de salud financiera y progreso */}
          {debtMetrics && debts && debts.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Salud Financiera y Progreso
              </Typography>
              
              <Grid container spacing={3}>
                {/* Progreso hacia libertad financiera */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                        Progreso hacia Libertad Financiera
                      </Typography>
                      
                      {(() => {
                        const activeDebts = debts.filter(debt => debt.isActive);
                        if (activeDebts.length === 0) {
                          return (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                ¡Felicitaciones! No tienes deudas activas. Has alcanzado la libertad financiera en este aspecto.
                              </Typography>
                            </Alert>
                          );
                        }

                        const totalOriginalDebt = activeDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);
                        const totalCurrentDebt = activeDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
                        const progressPercentage = totalOriginalDebt > 0 ? ((totalOriginalDebt - totalCurrentDebt) / totalOriginalDebt) * 100 : 0;
                        
                        // Calcular tiempo estimado para pagar todas las deudas
                        const averageMonthsToPayoff = activeDebts.reduce((sum, debt) => {
                          const monthsToPayoff = debt.minimumPayment > 0 ? debt.currentBalance / debt.minimumPayment : 0;
                          return sum + monthsToPayoff;
                        }, 0) / activeDebts.length;

                        return (
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">
                                Deuda pagada: {formatCurrency(totalOriginalDebt - totalCurrentDebt)}
                              </Typography>
                              <Typography variant="body2">
                                Deuda restante: {formatCurrency(totalCurrentDebt)}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(progressPercentage, 100)}
                              sx={{
                                height: 10,
                                borderRadius: 5,
                                mb: 2,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 'success.main'
                                }
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Progreso: {progressPercentage.toFixed(1)}% completado
                            </Typography>
                            {averageMonthsToPayoff > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                Tiempo estimado: {Math.ceil(averageMonthsToPayoff)} meses con pagos mínimos
                              </Typography>
                            )}
                          </Box>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Indicadores de salud financiera */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Security sx={{ mr: 1, color: 'primary.main' }} />
                        Indicadores de Salud Financiera
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        {/* Ratio deuda/ingreso */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2">Ratio Deuda/Ingreso</Typography>
                            <Chip
                              label={`${debtMetrics.debtToIncomeRatio.toFixed(1)}%`}
                              size="small"
                              color={debtMetrics.debtToIncomeRatio < 20 ? 'success' : 
                                     debtMetrics.debtToIncomeRatio < 40 ? 'warning' : 'error'}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {debtMetrics.debtToIncomeRatio < 20 ? 'Excelente - Nivel de deuda muy manejable' :
                             debtMetrics.debtToIncomeRatio < 40 ? 'Aceptable - Mantén control sobre nuevas deudas' :
                             'Preocupante - Considera reestructurar o consolidar deudas'}
                          </Typography>
                        </Box>

                        {/* Porcentaje de ingresos destinado a deudas */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2">Ingresos a Pagos de Deuda</Typography>
                            <Chip
                              label={`${debtMetrics.minimumPercentageRequired.toFixed(1)}%`}
                              size="small"
                              color={debtMetrics.minimumPercentageRequired < 20 ? 'success' : 
                                     debtMetrics.minimumPercentageRequired < 30 ? 'warning' : 'error'}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {debtMetrics.minimumPercentageRequired < 20 ? 'Muy bueno - Tienes flexibilidad financiera' :
                             debtMetrics.minimumPercentageRequired < 30 ? 'Moderado - Controla gastos adicionales' :
                             'Alto - Prioriza el pago de deudas'}
                          </Typography>
                        </Box>

                        {/* Proyección de liberación de presupuesto */}
                        {debtSummary && (
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Presupuesto a Liberar
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {formatCurrency(debtMetrics.totalMinimumPayments)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Monto mensual que se liberará al pagar todas las deudas
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          )}

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
      <Dialog open={setupDialogOpen} onClose={() => setSetupDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {profile ? 'Editar Perfil Financiero' : 'Configurar Perfil Financiero'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Ingreso Mensual"
            value={formData.monthlyIncome ? formatNumberInput(formData.monthlyIncome) : ''}
            onChange={(e) => {
              const numericValue = parseFormattedInput(e.target.value).toString();
              setFormData({ ...formData, monthlyIncome: numericValue });
            }}
            sx={{ mb: 3, mt: 1 }}
            placeholder="Ej: 3.500.000"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
            helperText="Ingresa tu ingreso mensual neto"
          />
          
          <Divider sx={{ my: 3 }} />
          
          {/* Selector de Distribución de Presupuesto */}
          <Typography variant="h6" gutterBottom>
            Distribución del Presupuesto
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona cómo quieres distribuir tu presupuesto mensual entre las diferentes categorías.
          </Typography>
          
          {formData.monthlyIncome && parseFormattedInput(formData.monthlyIncome) > 0 ? (
            <Box sx={{ mt: 2 }}>
              <BudgetDistributionSelector
                currentProfile={profile ? {
                  ...profile,
                  monthlyIncome: parseFormattedInput(formData.monthlyIncome)
                } : {
                  id: 'temp',
                  monthlyIncome: parseFormattedInput(formData.monthlyIncome),
                  distributionType: formData.distributionType,
                  categories: [],
                  createdAt: new Date().toISOString()
                }}
                debts={debts || []}
                onDistributionChange={(distribution: BudgetDistribution, type: 'recommended' | 'custom' | 'debt-aware') => {
                  setSelectedDistribution(distribution);
                  setFormData({ ...formData, distributionType: type });
                }}
              />
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Ingresa tu ingreso mensual para ver las opciones de distribución del presupuesto.
              </Typography>
            </Alert>
          )}
          
          {/* Información contextual */}
          {debts && debts.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Deudas Detectadas:</strong> Se recomienda usar la distribución inteligente que considera tus deudas actuales para una planificación financiera más precisa.
              </Typography>
            </Alert>
          )}
          
          {formData.distributionType === 'recommended' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Distribución Tradicional (50/30/20):</strong><br />
                • 50% Necesidades (vivienda, alimentación, transporte)<br />
                • 30% Deseos (entretenimiento, compras personales)<br />
                • 20% Ahorros (emergencias, inversiones)
              </Typography>
            </Alert>
          )}
          
          {formData.distributionType === 'debt-aware' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Distribución Inteligente:</strong> El sistema calcula automáticamente la mejor distribución considerando tus deudas actuales y nivel de ingresos para optimizar tu salud financiera.
              </Typography>
            </Alert>
          )}
          
          {formData.distributionType === 'custom' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Distribución Personalizada:</strong> Puedes ajustar manualmente los porcentajes según tus necesidades específicas. El sistema validará que la suma sea 100% y te alertará sobre posibles riesgos.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateOrUpdateProfile} 
            variant="contained"
            disabled={!formData.monthlyIncome || parseFormattedInput(formData.monthlyIncome) <= 0}
          >
            {profile ? 'Actualizar Perfil' : 'Crear Perfil'}
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
            value={formData.amount ? formatNumberInput(formData.amount) : ''}
            onChange={(e) => {
              const numericValue = parseFormattedInput(e.target.value).toString();
              setFormData({ ...formData, amount: numericValue });
            }}
            sx={{ mb: 2 }}
            placeholder="Ej: 85.000"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
            helperText="Ingresa el monto del gasto"
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