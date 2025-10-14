import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Chip,
  Alert,
  AlertTitle,
  Tooltip,
  IconButton,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { 
  FinancialProfile, 
  Debt, 
  BudgetDistribution, 
  DebtMetrics,
  ValidationResult
} from '@/types';
import { debtAwareBudgetCalculator } from '@/services/debtAwareBudgetCalculator';
import { formatCurrency } from '@/utils/formatters';
import { CustomDistributionForm } from './CustomDistributionForm';

interface BudgetDistributionSelectorProps {
  currentProfile: FinancialProfile | null;
  debts: Debt[];
  onDistributionChange: (distribution: BudgetDistribution, distributionType: 'recommended' | 'custom' | 'debt-aware') => void;
  initialDistribution?: BudgetDistribution;
  initialDistributionType?: 'recommended' | 'custom' | 'debt-aware';
}

interface DistributionOption {
  type: 'recommended' | 'custom' | 'debt-aware';
  label: string;
  description: string;
  distribution: BudgetDistribution;
  isRecommended?: boolean;
}

export const BudgetDistributionSelector: React.FC<BudgetDistributionSelectorProps> = ({
  currentProfile,
  debts,
  onDistributionChange,
  initialDistribution,
  initialDistributionType = 'debt-aware'
}) => {
  const [distributionType, setDistributionType] = useState<'recommended' | 'custom' | 'debt-aware'>(initialDistributionType);
  const [debtMetrics, setDebtMetrics] = useState<DebtMetrics | null>(null);
  const [distributionOptions, setDistributionOptions] = useState<DistributionOption[]>([]);
  const [selectedDistribution, setSelectedDistribution] = useState<BudgetDistribution | null>(initialDistribution || null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Calcular métricas de deudas cuando cambien las deudas o el perfil
  useEffect(() => {
    if (currentProfile && debts.length > 0) {
      try {
        const metrics = debtAwareBudgetCalculator.calculateDebtMetrics(debts, currentProfile.monthlyIncome);
        setDebtMetrics(metrics);
      } catch (error) {
        console.error('Error calculando métricas de deudas:', error);
        setDebtMetrics(null);
      }
    } else {
      setDebtMetrics(null);
    }
  }, [debts, currentProfile]);

  // Generar opciones de distribución cuando cambien las métricas
  useEffect(() => {
    if (!currentProfile) return;

    const options: DistributionOption[] = [];

    // Opción tradicional (50/30/20)
    const traditionalDistribution: BudgetDistribution = {
      necessity: 50,
      want: 30,
      saving: 20,
      debt: 0
    };

    options.push({
      type: 'recommended',
      label: 'Tradicional (50/30/20)',
      description: 'Distribución clásica sin considerar deudas específicamente',
      distribution: traditionalDistribution
    });

    // Opción inteligente con deudas (si hay deudas)
    if (debtMetrics) {
      const intelligentDistribution = debtAwareBudgetCalculator.calculateRecommendedDistribution(debtMetrics);
      
      options.push({
        type: 'debt-aware',
        label: 'Inteligente con Deudas',
        description: `Distribución optimizada basada en tus deudas (${debtMetrics.riskLevel === 'low' ? 'Riesgo Bajo' : debtMetrics.riskLevel === 'medium' ? 'Riesgo Medio' : debtMetrics.riskLevel === 'high' ? 'Riesgo Alto' : 'Riesgo Crítico'})`,
        distribution: intelligentDistribution,
        isRecommended: true
      });
    }

    // Opción personalizada (usar distribución actual o inteligente como base)
    const customBase = debtMetrics 
      ? debtAwareBudgetCalculator.calculateRecommendedDistribution(debtMetrics)
      : traditionalDistribution;

    options.push({
      type: 'custom',
      label: 'Personalizada',
      description: 'Ajusta manualmente los porcentajes según tus necesidades',
      distribution: selectedDistribution || customBase
    });

    setDistributionOptions(options);

    // Seleccionar distribución inicial si no hay una seleccionada
    if (!selectedDistribution) {
      const defaultOption = debtMetrics ? options.find(opt => opt.type === 'debt-aware') : options[0];
      if (defaultOption) {
        setSelectedDistribution(defaultOption.distribution);
        setDistributionType(defaultOption.type);
      }
    }
  }, [debtMetrics, currentProfile, selectedDistribution]);

  // Validar distribución cuando cambie
  useEffect(() => {
    if (selectedDistribution && debtMetrics) {
      const validationResult = debtAwareBudgetCalculator.validateCustomDistribution(
        selectedDistribution,
        debtMetrics
      );
      setValidation(validationResult);
    } else {
      setValidation(null);
    }
  }, [selectedDistribution, debtMetrics]);

  // Manejar cambio de tipo de distribución
  const handleDistributionTypeChange = (newType: 'recommended' | 'custom' | 'debt-aware') => {
    const option = distributionOptions.find(opt => opt.type === newType);
    if (option) {
      setDistributionType(newType);
      setSelectedDistribution(option.distribution);
      onDistributionChange(option.distribution, newType);
    }
  };

  // Manejar cambio en distribución personalizada
  const handleCustomDistributionChange = (distribution: BudgetDistribution) => {
    setSelectedDistribution(distribution);
    onDistributionChange(distribution, 'custom');
  };

  // Obtener la distribución actualmente seleccionada
  const getCurrentDistribution = (): BudgetDistribution => {
    return selectedDistribution || {
      necessity: 50,
      want: 30,
      saving: 20,
      debt: 0
    };
  };

  // Obtener color para el nivel de riesgo
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#FF5722';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Obtener nombre de categoría en español
  const getCategoryName = (type: keyof BudgetDistribution): string => {
    const names = {
      necessity: 'Necesidades',
      want: 'Deseos',
      saving: 'Ahorros',
      debt: 'Deudas'
    };
    return names[type];
  };

  // Obtener color de categoría
  const getCategoryColor = (type: keyof BudgetDistribution): string => {
    const colors = {
      necessity: '#2196F3',
      want: '#9C27B0',
      saving: '#4CAF50',
      debt: '#FF6B6B'
    };
    return colors[type];
  };

  // Obtener descripción de categoría
  const getCategoryDescription = (type: keyof BudgetDistribution): string => {
    const descriptions = {
      necessity: 'Gastos esenciales como vivienda, alimentación, transporte y servicios básicos',
      want: 'Gastos no esenciales como entretenimiento, restaurantes y compras opcionales',
      saving: 'Ahorros para emergencias, inversiones y metas financieras',
      debt: 'Pagos de deudas y obligaciones financieras'
    };
    return descriptions[type];
  };

  if (!currentProfile) {
    return (
      <Alert severity="info">
        <AlertTitle>Perfil Requerido</AlertTitle>
        Necesitas crear un perfil financiero para configurar la distribución de presupuesto.
      </Alert>
    );
  }

  const currentDistribution = getCurrentDistribution();

  return (
    <Box>
      {/* Selector de tipo de distribución */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tipo de Distribución de Presupuesto
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Selecciona el tipo de distribución</InputLabel>
            <Select
              value={distributionType}
              onChange={(e) => handleDistributionTypeChange(e.target.value as any)}
              label="Selecciona el tipo de distribución"
            >
              {distributionOptions.map((option) => (
                <MenuItem key={option.type} value={option.type}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1">
                        {option.label}
                        {option.isRecommended && (
                          <Chip 
                            label="Recomendado" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Métricas de deudas si aplica */}
          {debtMetrics && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Análisis de Deudas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color={getRiskColor(debtMetrics.riskLevel)}>
                      {debtMetrics.minimumPercentageRequired.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption">Mínimo Requerido</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">
                      {formatCurrency(debtMetrics.totalMinimumPayments)}
                    </Typography>
                    <Typography variant="caption">Pagos Mínimos</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">
                      {formatCurrency(debtMetrics.totalDebt)}
                    </Typography>
                    <Typography variant="caption">Total Deudas</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={debtMetrics.riskLevel === 'low' ? 'Bajo' : 
                            debtMetrics.riskLevel === 'medium' ? 'Medio' : 
                            debtMetrics.riskLevel === 'high' ? 'Alto' : 'Crítico'}
                      color={debtMetrics.riskLevel === 'low' ? 'success' : 
                             debtMetrics.riskLevel === 'medium' ? 'warning' : 'error'}
                      size="small"
                    />
                    <Typography variant="caption" display="block">Nivel de Riesgo</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Formulario de distribución personalizada */}
      {distributionType === 'custom' && currentProfile && (
        <CustomDistributionForm
          currentProfile={currentProfile}
          debtMetrics={debtMetrics}
          initialDistribution={selectedDistribution || getCurrentDistribution()}
          onDistributionChange={handleCustomDistributionChange}
        />
      )}

      {/* Preview de distribución (solo para tipos no personalizados) */}
      {distributionType !== 'custom' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vista Previa de Distribución
            </Typography>
          
          {/* Alertas de validación */}
          {validation && !validation.isValid && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Error de Validación</AlertTitle>
              {validation.error}
            </Alert>
          )}
          
          {validation && validation.warnings && validation.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Advertencias</AlertTitle>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}

          {/* Grid de categorías */}
          <Grid container spacing={2}>
            {Object.entries(currentDistribution).map(([categoryType, percentage]) => {
              const categoryKey = categoryType as keyof BudgetDistribution;
              const amount = (currentProfile.monthlyIncome * percentage) / 100;
              
              // No mostrar categoría de deudas si es 0%
              if (categoryKey === 'debt' && percentage === 0) {
                return null;
              }
              
              return (
                <Grid item xs={6} sm={categoryKey === 'debt' ? 6 : 4} key={categoryType}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      height: '100%',
                      borderColor: getCategoryColor(categoryKey),
                      borderWidth: 2
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        <Typography variant="h4" sx={{ color: getCategoryColor(categoryKey) }}>
                          {percentage}%
                        </Typography>
                        <Tooltip title={getCategoryDescription(categoryKey)}>
                          <IconButton size="small" sx={{ ml: 1 }}>
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Typography variant="h6" gutterBottom>
                        {getCategoryName(categoryKey)}
                      </Typography>
                      
                      <Typography variant="h6" color="text.secondary">
                        {formatCurrency(amount)}
                      </Typography>
                      
                      {/* Barra de progreso visual */}
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getCategoryColor(categoryKey)
                            }
                          }}
                        />
                      </Box>
                      
                      {/* Información adicional para deudas */}
                      {categoryKey === 'debt' && debtMetrics && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Capacidad extra: {formatCurrency(amount - debtMetrics.totalMinimumPayments)}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Resumen total */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Total Mensual: {formatCurrency(currentProfile.monthlyIncome)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {validation?.isValid ? (
                <Chip 
                  icon={<CheckCircleIcon />} 
                  label="Distribución Válida" 
                  color="success" 
                  size="small" 
                />
              ) : (
                <Chip 
                  icon={<WarningIcon />} 
                  label="Requiere Ajustes" 
                  color="error" 
                  size="small" 
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
      )}
    </Box>
  );
};