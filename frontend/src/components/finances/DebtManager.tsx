import React, { useState, useEffect } from 'react';
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
  Alert,
  Tabs,
  Tab,
  Snackbar,
  AlertTitle,
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  Person,
  Home,
  DirectionsCar,
  Store,
  Add,
  Delete,
  Payment,
  TrendingDown,
  Warning,
  Info
} from '@mui/icons-material';
import { useFinanceContext } from '@/contexts/FinanceContext';
import { Debt } from '@/types';
import { debtService } from '@/services/api';

const DebtManager: React.FC = () => {
  const {
    debts,
    debtPayments,
    expenses,
    profile,
    debtMetrics,
    budgetDistribution,
    addDebt,

    deleteDebt,
    addDebtPayment,
    fetchDebts,
    fetchDebtPayments,
    calculateDebtMetrics,
    recalculateOnDebtChange
  } = useFinanceContext();

  const [activeTab, setActiveTab] = useState(0);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const [debtForm, setDebtForm] = useState({
    name: '',
    type: 'credit_card' as const,
    totalAmount: '',
    currentBalance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '',
    paymentFrequency: 'monthly' as const,
    creditor: '',
    description: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    debtId: '',
    amount: '',
    paymentType: 'minimum' as const,
    description: ''
  });

  const [budgetValidation, setBudgetValidation] = useState<{
    isValid: boolean;
    availableBudget: number;
    exceedsBy?: number;
    warning?: string;
  } | null>(null);

  const debtTypes = {
    credit_card: { label: 'Tarjeta de Crédito', icon: <CreditCard />, color: '#FF6B6B' },
    bank_loan: { label: 'Crédito Bancario', icon: <AccountBalance />, color: '#4ECDC4' },
    personal_loan: { label: 'Préstamo Personal', icon: <Person />, color: '#45B7D1' },
    mortgage: { label: 'Hipoteca', icon: <Home />, color: '#F7DC6F' },
    vehicle_loan: { label: 'Crédito Vehicular', icon: <DirectionsCar />, color: '#BB8FCE' },
    commercial_credit: { label: 'Crédito Comercial', icon: <Store />, color: '#58D68D' }
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

  const calculatePayoffTime = (balance: number, minimumPayment: number, interestRate: number): number => {
    if (minimumPayment <= 0 || interestRate <= 0) return 0;
    
    const monthlyRate = interestRate / 100 / 12;
    const months = -Math.log(1 - (balance * monthlyRate) / minimumPayment) / Math.log(1 + monthlyRate);
    
    return Math.ceil(months);
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchDebts();
    fetchDebtPayments();
  }, []);

  // Recalcular métricas cuando cambien las deudas
  useEffect(() => {
    if (debts.length > 0 && profile) {
      calculateDebtMetrics();
    }
  }, [debts, profile]);

  // Validar presupuesto en tiempo real cuando cambie el monto del pago
  useEffect(() => {
    const validateBudget = async () => {
      if (!paymentForm.amount || !profile) {
        setBudgetValidation(null);
        return;
      }

      const paymentAmount = parseFormattedInput(paymentForm.amount);
      const debtCategory = profile.categories.find(cat => cat.type === 'debt');
      
      if (!debtCategory || paymentAmount <= 0) {
        setBudgetValidation(null);
        return;
      }

      try {
        const validation = await debtService.validatePaymentBudget(paymentAmount);
        setBudgetValidation(validation);
      } catch (error) {
        console.error('Error validando presupuesto:', error);
        setBudgetValidation(null);
      }
    };

    validateBudget();
  }, [paymentForm.amount, profile, expenses]);

  const getTotalDebt = (): number => {
    return debts.reduce((total, debt) => total + debt.currentBalance, 0);
  };

  const getTotalMinimumPayments = (): number => {
    return debts.reduce((total, debt) => total + debt.minimumPayment, 0);
  };

  const getDebtUtilization = (debt: Debt): number => {
    if (debt.totalAmount <= 0) return 0;
    return (debt.currentBalance / debt.totalAmount) * 100;
  };

  const handleAddDebt = async () => {
    try {
      const newDebtData = {
        name: debtForm.name,
        type: debtForm.type,
        totalAmount: parseFormattedInput(debtForm.totalAmount),
        currentBalance: parseFormattedInput(debtForm.currentBalance),
        interestRate: parseFloat(debtForm.interestRate),
        minimumPayment: parseFormattedInput(debtForm.minimumPayment),
        dueDate: debtForm.dueDate,
        paymentFrequency: debtForm.paymentFrequency,
        creditor: debtForm.creditor,
        description: debtForm.description,
        isActive: true
      };

      await addDebt(newDebtData);
      setDebtDialogOpen(false);
      setDebtForm({
        name: '',
        type: 'credit_card',
        totalAmount: '',
        currentBalance: '',
        interestRate: '',
        minimumPayment: '',
        dueDate: '',
        paymentFrequency: 'monthly',
        creditor: '',
        description: ''
      });

      setSnackbarMessage('Deuda agregada exitosamente. Se ha recalculado tu distribución de presupuesto.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error agregando deuda:', error);
      setSnackbarMessage('Error al agregar la deuda. Inténtalo de nuevo.');
      setSnackbarOpen(true);
    }
  };

  const handleAddPayment = async () => {
    try {
      const paymentAmount = parseFormattedInput(paymentForm.amount);
      const selectedDebt = debts.find(debt => debt.id === paymentForm.debtId);
      
      if (!selectedDebt) {
        throw new Error('Deuda no encontrada');
      }

      if (!profile) {
        throw new Error('No hay perfil financiero disponible');
      }

      const debtCategory = profile.categories.find(cat => cat.type === 'debt');
      if (!debtCategory) {
        throw new Error('No se encontró la categoría de deudas en el presupuesto');
      }

      // Validar presupuesto disponible usando el nuevo servicio
      const budgetValidation = await debtService.validatePaymentBudget(paymentAmount);

      // Mostrar advertencia si excede el presupuesto
      if (!budgetValidation.isValid && budgetValidation.warning) {
        setSnackbarMessage(`Advertencia: ${budgetValidation.warning}`);
        setSnackbarOpen(true);
      }

      // Crear datos del pago
      const newPaymentData = {
        amount: paymentAmount,
        paymentDate: new Date().toISOString(),
        paymentType: paymentForm.paymentType,
        description: paymentForm.description
      };

      // Registrar el pago de deuda
      await addDebtPayment(paymentForm.debtId, newPaymentData);

      // Note: The backend now automatically handles debt balance updates and expense creation
      // No need to manually update balance or create expenses

      // Recalcular métricas de deudas
      await recalculateOnDebtChange();

      setPaymentDialogOpen(false);
      setPaymentForm({
        debtId: '',
        amount: '',
        paymentType: 'minimum',
        description: ''
      });

      // Mostrar mensaje de éxito con información del impacto
      const updatedBalance = Math.max(0, selectedDebt.currentBalance - paymentAmount);
      let successMessage = '';
      if (updatedBalance === 0) {
        successMessage = `¡Felicitaciones! Has pagado completamente la deuda "${selectedDebt.name}". Tu presupuesto se ha actualizado automáticamente.`;
      } else {
        successMessage = `Pago registrado exitosamente.`;
      }
      
      setSnackbarMessage(successMessage);
      setSnackbarOpen(true);

    } catch (error) {
      console.error('Error registrando pago:', error);
      setSnackbarMessage(`Error al registrar el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setSnackbarOpen(true);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      const debtToDelete = debts.find(debt => debt.id === debtId);
      await deleteDebt(debtId);
      
      setSnackbarMessage(`Deuda "${debtToDelete?.name}" eliminada exitosamente. Se ha recalculado tu distribución de presupuesto.`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error eliminando deuda:', error);
      setSnackbarMessage('Error al eliminar la deuda. Inténtalo de nuevo.');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Gestión de Deudas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDebtDialogOpen(true)}
        >
          Agregar Deuda
        </Button>
      </Box>

      {/* Alertas de integración con presupuesto */}
      {debtMetrics && profile && (
        <Box sx={{ mb: 3 }}>
          {debtMetrics.riskLevel === 'high' || debtMetrics.riskLevel === 'critical' ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Alto Nivel de Endeudamiento</Typography>
              Tus deudas requieren {debtMetrics.minimumPercentageRequired.toFixed(1)}% de tu ingreso mensual. 
              {debtMetrics.riskLevel === 'critical' && ' Se recomienda reestructurar deudas urgentemente.'}
            </Alert>
          ) : debtMetrics.riskLevel === 'medium' ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Nivel Moderado de Deudas</Typography>
              Mantén un control cuidadoso de tus pagos para evitar sobreendeudamiento.
            </Alert>
          ) : debtMetrics.riskLevel === 'low' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Excelente Gestión de Deudas</Typography>
              Tus deudas están bajo control. Considera aumentar ahorros o inversiones.
            </Alert>
          )}
          
          {budgetDistribution && budgetDistribution.debt < debtMetrics.minimumPercentageRequired && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Presupuesto Insuficiente para Deudas</Typography>
              Has asignado {budgetDistribution.debt}% pero necesitas al menos {debtMetrics.minimumPercentageRequired.toFixed(1)}% 
              para cubrir pagos mínimos. Considera ajustar tu distribución de presupuesto.
            </Alert>
          )}
        </Box>
      )}

      {/* Resumen de deudas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDown sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(getTotalDebt())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deuda Total
              </Typography>
              {debtMetrics && (
                <Typography variant="caption" color="text.secondary">
                  Ratio D/I: {debtMetrics.debtToIncomeRatio.toFixed(1)}%
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Payment sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(getTotalMinimumPayments())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pagos Mínimos Mensuales
              </Typography>
              {debtMetrics && profile && (
                <Typography variant="caption" color="text.secondary">
                  {debtMetrics.minimumPercentageRequired.toFixed(1)}% del ingreso
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CreditCard sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {debts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deudas Activas
              </Typography>
              {budgetDistribution && (
                <Typography variant="caption" color="text.secondary">
                  Presupuesto: {budgetDistribution.debt}%
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {debts.filter(debt => getDebtUtilization(debt) > 80).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deudas Críticas (+80%)
              </Typography>
              {debtMetrics && (
                <Chip 
                  label={debtMetrics.riskLevel.toUpperCase()} 
                  size="small" 
                  color={
                    debtMetrics.riskLevel === 'low' ? 'success' :
                    debtMetrics.riskLevel === 'medium' ? 'warning' : 'error'
                  }
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs para diferentes vistas */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Lista de Deudas" />
          <Tab label="Historial de Pagos" />
          <Tab label="Proyecciones" />
        </Tabs>
      </Paper>

      {/* Lista de deudas */}
      {activeTab === 0 && (
        <Grid container spacing={2}>
          {debts.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                No tienes deudas registradas. ¡Agrega tu primera deuda para comenzar a gestionarlas!
              </Alert>
            </Grid>
          ) : (
            debts.map((debt) => {
              const utilization = getDebtUtilization(debt);
              const payoffMonths = calculatePayoffTime(debt.currentBalance, debt.minimumPayment, debt.interestRate);
              const debtType = debtTypes[debt.type];
              
              return (
                <Grid item xs={12} md={6} key={debt.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ color: debtType.color, mr: 1 }}>
                          {debtType.icon}
                        </Box>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {debt.name}
                        </Typography>
                        <Chip 
                          label={debtType.label} 
                          size="small" 
                          sx={{ backgroundColor: debtType.color, color: 'white' }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {debt.creditor} • {debt.interestRate}% anual
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            Balance: {formatCurrency(debt.currentBalance)}
                          </Typography>
                          <Typography variant="body2">
                            Límite: {formatCurrency(debt.totalAmount)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={utilization}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: utilization > 80 ? 'error.main' : 
                                             utilization > 50 ? 'warning.main' : 'success.main'
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Utilización: {utilization.toFixed(1)}%
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">
                          Pago mínimo: {formatCurrency(debt.minimumPayment)}
                        </Typography>
                        <Typography variant="body2">
                          Tiempo estimado: {payoffMonths} meses
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Payment />}
                          onClick={() => {
                            setPaymentForm({ ...paymentForm, debtId: debt.id });
                            setPaymentDialogOpen(true);
                          }}
                        >
                          Pagar
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteDebt(debt.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* Historial de pagos */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Historial de Pagos
          </Typography>
          {debtPayments.length === 0 ? (
            <Alert severity="info">
              No hay pagos registrados aún.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Deuda</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Descripción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {debtPayments.slice(-10).reverse().map((payment) => {
                    const debt = debts.find(d => d.id === payment.debtId);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.paymentDate).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>{debt?.name || 'Deuda eliminada'}</TableCell>
                        <TableCell>
                          <Chip
                            label={payment.paymentType === 'minimum' ? 'Mínimo' : 
                                  payment.paymentType === 'extra' ? 'Extra' : 'Completo'}
                            size="small"
                            color={payment.paymentType === 'full' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{payment.description || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Proyecciones */}
      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Proyecciones de Pago
          </Typography>
          {debts.length === 0 ? (
            <Alert severity="info">
              Agrega deudas para ver las proyecciones de pago.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {debts.map((debt) => {
                const payoffMonths = calculatePayoffTime(debt.currentBalance, debt.minimumPayment, debt.interestRate);
                const totalInterest = (debt.minimumPayment * payoffMonths) - debt.currentBalance;
                
                return (
                  <Grid item xs={12} md={6} key={debt.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {debt.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Balance actual: {formatCurrency(debt.currentBalance)}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Tiempo de pago:</strong> {payoffMonths} meses
                        </Typography>
                        <Typography variant="body1">
                          <strong>Intereses totales:</strong> {formatCurrency(totalInterest)}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Total a pagar:</strong> {formatCurrency(debt.currentBalance + totalInterest)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>
      )}

      {/* Diálogo para agregar deuda */}
      <Dialog open={debtDialogOpen} onClose={() => setDebtDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Nueva Deuda</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre de la Deuda"
                value={debtForm.name}
                onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Deuda</InputLabel>
                <Select
                  value={debtForm.type}
                  label="Tipo de Deuda"
                  onChange={(e) => setDebtForm({ ...debtForm, type: e.target.value as any })}
                >
                  {Object.entries(debtTypes).map(([key, type]) => (
                    <MenuItem key={key} value={key}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monto Total/Límite"
                value={debtForm.totalAmount ? formatNumberInput(debtForm.totalAmount) : ''}
                onChange={(e) => {
                  const numericValue = parseFormattedInput(e.target.value).toString();
                  setDebtForm({ ...debtForm, totalAmount: numericValue });
                }}
                placeholder="Ej: 5.000.000"
                helperText="Ingresa el límite total de la deuda"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Balance Actual"
                value={debtForm.currentBalance ? formatNumberInput(debtForm.currentBalance) : ''}
                onChange={(e) => {
                  const numericValue = parseFormattedInput(e.target.value).toString();
                  setDebtForm({ ...debtForm, currentBalance: numericValue });
                }}
                placeholder="Ej: 2.500.000"
                helperText="Ingresa el saldo actual de la deuda"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tasa de Interés Anual (%)"
                type="number"
                value={debtForm.interestRate}
                onChange={(e) => setDebtForm({ ...debtForm, interestRate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pago Mínimo"
                value={debtForm.minimumPayment ? formatNumberInput(debtForm.minimumPayment) : ''}
                onChange={(e) => {
                  const numericValue = parseFormattedInput(e.target.value).toString();
                  setDebtForm({ ...debtForm, minimumPayment: numericValue });
                }}
                placeholder="Ej: 300.000"
                helperText="Ingresa el pago mínimo mensual"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Acreedor/Banco"
                value={debtForm.creditor}
                onChange={(e) => setDebtForm({ ...debtForm, creditor: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Frecuencia de Pago</InputLabel>
                <Select
                  value={debtForm.paymentFrequency}
                  label="Frecuencia de Pago"
                  onChange={(e) => setDebtForm({ ...debtForm, paymentFrequency: e.target.value as any })}
                >
                  <MenuItem value="monthly">Mensual</MenuItem>
                  <MenuItem value="biweekly">Quincenal</MenuItem>
                  <MenuItem value="weekly">Semanal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción (opcional)"
                multiline
                rows={2}
                value={debtForm.description}
                onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDebtDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddDebt} variant="contained">
            Agregar Deuda
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar pago */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pago de Deuda</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Deuda</InputLabel>
            <Select
              value={paymentForm.debtId}
              label="Deuda"
              onChange={(e) => setPaymentForm({ ...paymentForm, debtId: e.target.value })}
            >
              {debts.map((debt) => (
                <MenuItem key={debt.id} value={debt.id}>
                  {debt.name} - {formatCurrency(debt.currentBalance)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Monto del Pago"
            value={paymentForm.amount ? formatNumberInput(paymentForm.amount) : ''}
            onChange={(e) => {
              const numericValue = parseFormattedInput(e.target.value).toString();
              setPaymentForm({ ...paymentForm, amount: numericValue });
            }}
            sx={{ mb: 2 }}
            placeholder="Ej: 250.000"
            helperText="Ingresa el monto del pago a realizar"
          />

          {/* Mostrar impacto en presupuesto en tiempo real */}
          {paymentForm.amount && profile && budgetValidation && (() => {
            const paymentAmount = parseFormattedInput(paymentForm.amount);
            const debtCategory = profile.categories.find(cat => cat.type === 'debt');
            
            if (!debtCategory || paymentAmount <= 0) return null;

            const severity = !budgetValidation.isValid ? 'error' : 'info';

            return (
              <Box sx={{ mb: 2 }}>
                <Alert 
                  severity={severity}
                  icon={!budgetValidation.isValid ? <Warning /> : <Info />}
                >
                  <AlertTitle>
                    {!budgetValidation.isValid ? 'Presupuesto Excedido' : 'Validación de Presupuesto'}
                  </AlertTitle>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Disponible:</strong> {formatCurrency(budgetValidation.availableBudget)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Pago:</strong> {formatCurrency(paymentAmount)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {budgetValidation.exceedsBy && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'error.main', fontWeight: 'bold' }}>
                      Exceso: {formatCurrency(budgetValidation.exceedsBy)}
                    </Typography>
                  )}

                  {budgetValidation.warning && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      {budgetValidation.warning}
                    </Typography>
                  )}
                </Alert>
              </Box>
            );
          })()}
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de Pago</InputLabel>
            <Select
              value={paymentForm.paymentType}
              label="Tipo de Pago"
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value as any })}
            >
              <MenuItem value="minimum">Pago Mínimo</MenuItem>
              <MenuItem value="extra">Pago Extra</MenuItem>
              <MenuItem value="full">Pago Completo</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Descripción (opcional)"
            value={paymentForm.description}
            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddPayment} variant="contained">
            Registrar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default DebtManager;