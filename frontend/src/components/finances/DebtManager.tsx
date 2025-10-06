import React, { useState } from 'react';
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
  Tab
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
  Warning
} from '@mui/icons-material';

interface Debt {
  id: string;
  name: string;
  type: 'credit_card' | 'bank_loan' | 'personal_loan' | 'mortgage' | 'vehicle_loan' | 'commercial_credit';
  totalAmount: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  paymentFrequency: 'monthly' | 'biweekly' | 'weekly';
  creditor: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  paymentType: 'minimum' | 'extra' | 'full';
  description?: string;
  createdAt: string;
}

const DebtManager: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
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
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculatePayoffTime = (balance: number, minimumPayment: number, interestRate: number): number => {
    if (minimumPayment <= 0 || interestRate <= 0) return 0;
    
    const monthlyRate = interestRate / 100 / 12;
    const months = -Math.log(1 - (balance * monthlyRate) / minimumPayment) / Math.log(1 + monthlyRate);
    
    return Math.ceil(months);
  };

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

  const handleAddDebt = () => {
    const newDebt: Debt = {
      id: Date.now().toString(),
      name: debtForm.name,
      type: debtForm.type,
      totalAmount: parseFloat(debtForm.totalAmount),
      currentBalance: parseFloat(debtForm.currentBalance),
      interestRate: parseFloat(debtForm.interestRate),
      minimumPayment: parseFloat(debtForm.minimumPayment),
      dueDate: debtForm.dueDate,
      paymentFrequency: debtForm.paymentFrequency,
      creditor: debtForm.creditor,
      description: debtForm.description,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setDebts([...debts, newDebt]);
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
  };

  const handleAddPayment = () => {
    const newPayment: DebtPayment = {
      id: Date.now().toString(),
      debtId: paymentForm.debtId,
      amount: parseFloat(paymentForm.amount),
      paymentDate: new Date().toISOString(),
      paymentType: paymentForm.paymentType,
      description: paymentForm.description,
      createdAt: new Date().toISOString()
    };

    // Actualizar el balance de la deuda
    setDebts(debts.map(debt => {
      if (debt.id === paymentForm.debtId) {
        return {
          ...debt,
          currentBalance: Math.max(0, debt.currentBalance - parseFloat(paymentForm.amount))
        };
      }
      return debt;
    }));

    setPayments([...payments, newPayment]);
    setPaymentDialogOpen(false);
    setPaymentForm({
      debtId: '',
      amount: '',
      paymentType: 'minimum',
      description: ''
    });
  };

  const handleDeleteDebt = (debtId: string) => {
    setDebts(debts.filter(debt => debt.id !== debtId));
    setPayments(payments.filter(payment => payment.debtId !== debtId));
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
          {payments.length === 0 ? (
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
                  {payments.slice(-10).reverse().map((payment) => {
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
                type="number"
                value={debtForm.totalAmount}
                onChange={(e) => setDebtForm({ ...debtForm, totalAmount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Balance Actual"
                type="number"
                value={debtForm.currentBalance}
                onChange={(e) => setDebtForm({ ...debtForm, currentBalance: e.target.value })}
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
                type="number"
                value={debtForm.minimumPayment}
                onChange={(e) => setDebtForm({ ...debtForm, minimumPayment: e.target.value })}
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
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            sx={{ mb: 2 }}
          />
          
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
    </Box>
  );
};

export default DebtManager;