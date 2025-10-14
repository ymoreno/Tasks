import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
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
  Snackbar
} from '@mui/material';
import {
  CreditCard,
  Payment,
  TrendingUp,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useFinanceContext } from '@/contexts/FinanceContext';
import { BudgetCategory, Debt, DebtPayment } from '@/types';
import { DebtMetricsDisplay } from '@/components/finances/DebtMetricsDisplay';

interface DebtCategoryCardProps {
  category: BudgetCategory;
  debts: Debt[];
  debtPayments: DebtPayment[];
  monthlyIncome?: number;
  onPaymentRecord?: () => void;
}

export const DebtCategoryCard: React.FC<DebtCategoryCardProps> = ({
  category,
  debts,
  debtPayments,
  monthlyIncome,
  onPaymentRecord
}) => {
  const { addDebtPayment } = useFinanceContext();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [projectionDialogOpen, setProjectionDialogOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'minimum' | 'extra' | 'full'>('minimum');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Calcular métricas de la categoría
  const currentMonthPayments = debtPayments.filter(payment => {
    const paymentDate = new Date(payment.paymentDate);
    const currentDate = new Date();
    return paymentDate.getMonth() === currentDate.getMonth() &&
           paymentDate.getFullYear() === currentDate.getFullYear();
  });

  const totalDebtPayments = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBudget = category.budgetAmount - totalDebtPayments;
  const utilizationPercentage = category.budgetAmount > 0 ? (totalDebtPayments / category.budgetAmount) * 100 : 0;

  // Función para obtener el color del progreso
  const getProgressColor = (percentage: number): string => {
    if (percentage <= 70) return '#4CAF50'; // Verde
    if (percentage <= 90) return '#FF9800'; // Amarillo
    return '#F44336'; // Rojo
  };

  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Manejar registro de pago
  const handlePaymentSubmit = async () => {
    try {
      if (!selectedDebtId || !paymentAmount) {
        return;
      }

      const selectedDebt = debts.find(debt => debt.id === selectedDebtId);
      if (!selectedDebt) {
        return;
      }

      const amount = parseFloat(paymentAmount);
      if (amount <= 0 || amount > selectedDebt.currentBalance) {
        setSnackbarMessage('El monto del pago debe ser válido y no exceder el saldo de la deuda');
        setSnackbarOpen(true);
        return;
      }

      await addDebtPayment(selectedDebtId, {
        amount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentType,
        description: paymentDescription || undefined
      });

      // Limpiar formulario
      setSelectedDebtId('');
      setPaymentAmount('');
      setPaymentType('minimum');
      setPaymentDescription('');
      setPaymentDialogOpen(false);
      
      setSnackbarMessage('Pago registrado exitosamente');
      setSnackbarOpen(true);

      if (onPaymentRecord) {
        onPaymentRecord();
      }
    } catch (error) {
      console.error('Error registrando pago:', error);
      setSnackbarMessage('Error al registrar el pago');
      setSnackbarOpen(true);
    }
  };

  // Calcular proyección de liberación de presupuesto
  const calculateBudgetProjection = () => {
    const activeDebts = debts.filter(debt => debt.isActive);
    if (activeDebts.length === 0) return null;

    const totalMinimumPayments = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const averagePayoffTime = activeDebts.reduce((sum, debt) => {
      const monthsToPayoff = debt.currentBalance / debt.minimumPayment;
      return sum + monthsToPayoff;
    }, 0) / activeDebts.length;

    return {
      totalMinimumPayments,
      averagePayoffTime: Math.ceil(averagePayoffTime),
      budgetToBeFreed: totalMinimumPayments
    };
  };

  const projection = calculateBudgetProjection();

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CreditCard sx={{ color: category.color, mr: 1, fontSize: 28 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {category.name}
            </Typography>
            <Chip 
              label={`${category.percentage}%`} 
              sx={{ 
                backgroundColor: category.color, 
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {category.description || 'Gestión de pagos de deudas'}
          </Typography>
          
          {/* Barra de progreso del presupuesto */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                Pagado: {formatCurrency(totalDebtPayments)}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                Presupuesto: {formatCurrency(category.budgetAmount)}
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={Math.min(utilizationPercentage, 100)}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getProgressColor(utilizationPercentage),
                  borderRadius: 5
                }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography 
                variant="caption" 
                color={remainingBudget < 0 ? 'error' : 'text.secondary'}
                fontWeight={500}
              >
                {remainingBudget >= 0 
                  ? `Disponible: ${formatCurrency(remainingBudget)}` 
                  : `Excedido: ${formatCurrency(Math.abs(remainingBudget))}`
                }
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {utilizationPercentage.toFixed(1)}% utilizado
              </Typography>
            </Box>
          </Box>

          {/* Alertas de estado */}
          {remainingBudget < 0 && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ mr: 1, fontSize: 18 }} />
                Presupuesto excedido
              </Box>
            </Alert>
          )}

          {utilizationPercentage > 90 && remainingBudget >= 0 && (
            <Alert severity="warning" sx={{ mb: 2, fontSize: '0.875rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ mr: 1, fontSize: 18 }} />
                Cerca del límite presupuestario
              </Box>
            </Alert>
          )}

          {utilizationPercentage < 50 && debts.length > 0 && (
            <Alert severity="success" sx={{ mb: 2, fontSize: '0.875rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ mr: 1, fontSize: 18 }} />
                Buen control del presupuesto de deudas
              </Box>
            </Alert>
          )}
          
          {/* Métricas de deudas */}
          <DebtMetricsDisplay debts={debts} monthlyIncome={monthlyIncome} />
        </CardContent>

        {/* Acciones rápidas */}
        <Box sx={{ p: 2, pt: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              size="small" 
              variant="contained"
              startIcon={<Payment />} 
              onClick={() => setPaymentDialogOpen(true)}
              disabled={debts.filter(debt => debt.isActive).length === 0}
              sx={{ 
                backgroundColor: category.color,
                '&:hover': {
                  backgroundColor: category.color,
                  opacity: 0.8
                }
              }}
            >
              Registrar Pago
            </Button>
            <Button 
              size="small" 
              variant="outlined"
              startIcon={<TrendingUp />} 
              onClick={() => setProjectionDialogOpen(true)}
              disabled={debts.filter(debt => debt.isActive).length === 0}
              sx={{ 
                borderColor: category.color,
                color: category.color,
                '&:hover': {
                  borderColor: category.color,
                  backgroundColor: `${category.color}10`
                }
              }}
            >
              Ver Proyección
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Diálogo para registrar pago */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pago de Deuda</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Deuda</InputLabel>
              <Select
                value={selectedDebtId}
                onChange={(e) => setSelectedDebtId(e.target.value)}
                label="Deuda"
              >
                {debts.filter(debt => debt.isActive).map((debt) => (
                  <MenuItem key={debt.id} value={debt.id}>
                    {debt.name} - {formatCurrency(debt.currentBalance)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Monto del Pago"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Pago</InputLabel>
              <Select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'minimum' | 'extra' | 'full')}
                label="Tipo de Pago"
              >
                <MenuItem value="minimum">Pago Mínimo</MenuItem>
                <MenuItem value="extra">Pago Extra</MenuItem>
                <MenuItem value="full">Pago Total</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Descripción (Opcional)"
              value={paymentDescription}
              onChange={(e) => setPaymentDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handlePaymentSubmit}
            variant="contained"
            disabled={!selectedDebtId || !paymentAmount}
          >
            Registrar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de proyección */}
      <Dialog open={projectionDialogOpen} onClose={() => setProjectionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Proyección de Liberación de Presupuesto</DialogTitle>
        <DialogContent>
          {projection ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Análisis de Deudas Actuales
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Pagos Mínimos Totales
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(projection.totalMinimumPayments)}
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tiempo Promedio de Pago
                    </Typography>
                    <Typography variant="h6">
                      {projection.averagePayoffTime} meses
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Presupuesto a Liberar
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(projection.budgetToBeFreed)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Typography variant="body2" color="text.secondary">
                Una vez pagadas todas las deudas, tendrás {formatCurrency(projection.budgetToBeFreed)} 
                adicionales cada mes que podrás reasignar a ahorros, inversiones o gastos personales.
              </Typography>
            </Box>
          ) : (
            <Typography>No hay deudas activas para proyectar.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectionDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};