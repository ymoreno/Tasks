import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  TrendingDown,
  Schedule,
  AccountBalance,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { Debt } from '@/types';

interface DebtMetricsDisplayProps {
  debts: Debt[];
  monthlyIncome?: number;
}

export const DebtMetricsDisplay: React.FC<DebtMetricsDisplayProps> = ({ debts, monthlyIncome }) => {
  // Filtrar solo deudas activas
  const activeDebts = debts.filter(debt => debt.isActive);

  // Calcular métricas
  const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const totalMinimumPayments = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  
  // Calcular ratio deuda/ingreso
  const debtToIncomeRatio = monthlyIncome && monthlyIncome > 0 
    ? (totalMinimumPayments / monthlyIncome) * 100 
    : 0;
  
  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calcular tiempo estimado para pagar deudas (solo pagos mínimos)
  const calculatePayoffTime = (debt: Debt): number => {
    if (debt.minimumPayment <= 0) return Infinity;
    
    // Cálculo simplificado sin considerar intereses compuestos
    // Para una estimación más precisa se necesitaría la tasa de interés mensual
    const monthlyRate = debt.interestRate / 100 / 12;
    
    if (monthlyRate === 0) {
      return Math.ceil(debt.currentBalance / debt.minimumPayment);
    }
    
    // Fórmula para calcular el tiempo de pago con intereses
    const numerator = Math.log(1 + (debt.currentBalance * monthlyRate) / debt.minimumPayment);
    const denominator = Math.log(1 + monthlyRate);
    
    return Math.ceil(numerator / denominator);
  };

  // Calcular tiempo promedio de pago
  const averagePayoffTime = activeDebts.length > 0 
    ? activeDebts.reduce((sum, debt) => {
        const payoffTime = calculatePayoffTime(debt);
        return sum + (payoffTime === Infinity ? 0 : payoffTime);
      }, 0) / activeDebts.filter(debt => calculatePayoffTime(debt) !== Infinity).length
    : 0;

  // Encontrar la deuda que se pagará primero
  const nextDebtToPayoff = activeDebts.reduce((earliest, debt) => {
    const payoffTime = calculatePayoffTime(debt);
    const earliestPayoffTime = calculatePayoffTime(earliest);
    
    if (payoffTime < earliestPayoffTime) {
      return debt;
    }
    return earliest;
  }, activeDebts[0]);

  const nextPayoffTime = nextDebtToPayoff ? calculatePayoffTime(nextDebtToPayoff) : 0;

  // Determinar el nivel de riesgo basado en el número de deudas y montos
  const getRiskLevel = (): { level: string; color: string; icon: React.ReactNode } => {
    if (activeDebts.length === 0) {
      return { level: 'Sin Deudas', color: 'success.main', icon: <CheckCircle /> };
    }
    
    if (activeDebts.length <= 2 && totalDebt < 5000000) {
      return { level: 'Bajo Riesgo', color: 'success.main', icon: <CheckCircle /> };
    }
    
    if (activeDebts.length <= 4 && totalDebt < 15000000) {
      return { level: 'Riesgo Moderado', color: 'warning.main', icon: <Warning /> };
    }
    
    return { level: 'Alto Riesgo', color: 'error.main', icon: <Warning /> };
  };

  const riskInfo = getRiskLevel();

  if (activeDebts.length === 0) {
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
            <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
            <Typography variant="body2" color="success.main" fontWeight={500}>
              ¡Excelente! No tienes deudas activas
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Métricas de Deudas
      </Typography>
      
      <Grid container spacing={2}>
        {/* Total de Deudas */}
        <Grid item xs={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Total Adeudado
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {formatCurrency(totalDebt)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeDebts.length} deuda{activeDebts.length !== 1 ? 's' : ''} activa{activeDebts.length !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pagos Mínimos */}
        <Grid item xs={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDown sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Pagos Mínimos
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {formatCurrency(totalMinimumPayments)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                por mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tiempo Estimado de Pago */}
        <Grid item xs={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Tiempo Promedio
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {isFinite(averagePayoffTime) ? `${Math.ceil(averagePayoffTime)} meses` : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                para pagar todo
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Ratio Deuda/Ingreso */}
        {monthlyIncome && monthlyIncome > 0 && (
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingDown sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Ratio Deuda/Ingreso
                  </Typography>
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 600,
                    color: debtToIncomeRatio > 30 ? 'error.main' : debtToIncomeRatio > 20 ? 'warning.main' : 'success.main'
                  }}
                >
                  {debtToIncomeRatio.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  del ingreso mensual
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Nivel de Riesgo */}
        <Grid item xs={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {riskInfo.icon}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Nivel de Riesgo
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 600,
                  color: riskInfo.color
                }}
              >
                {riskInfo.level}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Próxima deuda a pagar */}
      {nextDebtToPayoff && isFinite(nextPayoffTime) && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Próxima Liberación de Presupuesto
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {nextDebtToPayoff.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(nextDebtToPayoff.currentBalance)} restante
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight={500} color="success.main">
                  ~{nextPayoffTime} meses
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  +{formatCurrency(nextDebtToPayoff.minimumPayment)}/mes
                </Typography>
              </Box>
            </Box>
            
            {/* Barra de progreso para la próxima deuda */}
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, 100 - (nextDebtToPayoff.currentBalance / nextDebtToPayoff.totalAmount) * 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'success.main',
                    borderRadius: 3
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {((1 - nextDebtToPayoff.currentBalance / nextDebtToPayoff.totalAmount) * 100).toFixed(1)}% pagado
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Consejos basados en las métricas */}
      {activeDebts.length > 3 && (
        <Card variant="outlined" sx={{ mt: 2, backgroundColor: 'warning.light', borderColor: 'warning.main' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Warning sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
              <Typography variant="body2" color="warning.dark">
                <strong>Consejo:</strong> Considera consolidar tus deudas para simplificar pagos y potencialmente reducir intereses.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};