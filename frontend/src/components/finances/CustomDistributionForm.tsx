import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Alert,
  AlertTitle,
  Tooltip,
  IconButton,
  InputAdornment,
  Slider,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { 
  BudgetDistribution, 
  DebtMetrics,
  ValidationResult,
  FinancialProfile
} from '@/types';
import { debtAwareBudgetCalculator } from '@/services/debtAwareBudgetCalculator';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface CustomDistributionFormProps {
  currentProfile: FinancialProfile;
  debtMetrics: DebtMetrics | null;
  initialDistribution: BudgetDistribution;
  onDistributionChange: (distribution: BudgetDistribution, isValid: boolean) => void;
  disabled?: boolean;
}

interface CategoryConfig {
  key: keyof BudgetDistribution;
  name: string;
  description: string;
  color: string;
  minValue: number;
  maxValue: number;
  tooltip: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: 'necessity',
    name: 'Necesidades',
    description: 'Gastos esenciales como vivienda, alimentación, transporte',
    color: '#2196F3',
    minValue: 30,
    maxValue: 70,
    tooltip: 'Incluye renta/hipoteca, servicios públicos, alimentación básica, transporte necesario, seguros obligatorios'
  },
  {
    key: 'want',
    name: 'Deseos',
    description: 'Gastos no esenciales como entretenimiento y compras opcionales',
    color: '#9C27B0',
    minValue: 0,
    maxValue: 50,
    tooltip: 'Entretenimiento, restaurantes, compras no esenciales, suscripciones opcionales, hobbies'
  },
  {
    key: 'saving',
    name: 'Ahorros',
    description: 'Ahorros para emergencias, inversiones y metas financieras',
    color: '#4CAF50',
    minValue: 0,
    maxValue: 40,
    tooltip: 'Fondo de emergencia, inversiones, ahorros para metas específicas, jubilación'
  },
  {
    key: 'debt',
    name: 'Deudas',
    description: 'Pagos de deudas y obligaciones financieras',
    color: '#FF6B6B',
    minValue: 0,
    maxValue: 50,
    tooltip: 'Pagos mínimos de tarjetas de crédito, préstamos, hipotecas, pagos extra para reducir deudas'
  }
];

export const CustomDistributionForm: React.FC<CustomDistributionFormProps> = ({
  currentProfile,
  debtMetrics,
  initialDistribution,
  onDistributionChange,
  disabled = false
}) => {
  const [distribution, setDistribution] = useState<BudgetDistribution>(initialDistribution);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [focusedCategory, setFocusedCategory] = useState<keyof BudgetDistribution | null>(null);
  const [inputErrors, setInputErrors] = useState<Partial<Record<keyof BudgetDistribution, string>>>({});

  // Validar distribución cuando cambie
  useEffect(() => {
    if (debtMetrics) {
      const validationResult = debtAwareBudgetCalculator.validateCustomDistribution(
        distribution,
        debtMetrics
      );
      setValidation(validationResult);
      onDistributionChange(distribution, validationResult.isValid);
    } else {
      // Validación básica sin métricas de deudas
      const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
      const isValid = Math.abs(total - 100) <= 0.01;
      const validationResult: ValidationResult = {
        isValid,
        error: isValid ? undefined : `La suma debe ser 100%. Actual: ${total.toFixed(1)}%`
      };
      setValidation(validationResult);
      onDistributionChange(distribution, validationResult.isValid);
    }
  }, [distribution, debtMetrics, onDistributionChange]);

  // Manejar cambio en input de texto
  const handleInputChange = (category: keyof BudgetDistribution, value: string) => {
    const numValue = parseFloat(value);
    
    // Validar entrada
    const errors = { ...inputErrors };
    if (isNaN(numValue) || numValue < 0) {
      errors[category] = 'Debe ser un número positivo';
    } else if (numValue > 100) {
      errors[category] = 'No puede ser mayor a 100%';
    } else {
      delete errors[category];
    }
    setInputErrors(errors);

    // Actualizar distribución si es válido
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setDistribution(prev => ({
        ...prev,
        [category]: numValue
      }));
    }
  };

  // Manejar cambio en slider
  const handleSliderChange = (category: keyof BudgetDistribution, value: number) => {
    setDistribution(prev => ({
      ...prev,
      [category]: value
    }));
  };



  // Calcular total actual
  const currentTotal = Object.values(distribution).reduce((sum, val) => sum + val, 0);

  // Obtener estado de validación para una categoría específica
  const getCategoryValidationState = (category: keyof BudgetDistribution) => {
    if (inputErrors[category]) {
      return { severity: 'error' as const, message: inputErrors[category] };
    }
    
    if (category === 'debt' && debtMetrics && distribution[category] < debtMetrics.minimumPercentageRequired) {
      return { 
        severity: 'warning' as const, 
        message: `Menor al mínimo requerido (${debtMetrics.minimumPercentageRequired.toFixed(1)}%)` 
      };
    }
    
    if (category === 'necessity' && distribution[category] < 40) {
      return { 
        severity: 'warning' as const, 
        message: 'Se recomienda al menos 40% para necesidades' 
      };
    }
    
    return null;
  };

  // Filtrar categorías a mostrar (no mostrar deudas si no hay deudas)
  const categoriesToShow = CATEGORY_CONFIGS.filter(config => 
    config.key !== 'debt' || (debtMetrics && debtMetrics.totalDebt > 0)
  );

  return (
    <Box>
      {/* Alertas de validación general */}
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

      {/* Resumen de total */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Total: {formatPercentage(currentTotal)}
            </Typography>
            <Chip 
              icon={Math.abs(currentTotal - 100) <= 0.01 ? <CheckCircleIcon /> : <WarningIcon />}
              label={Math.abs(currentTotal - 100) <= 0.01 ? 'Válido' : 'Requiere Ajuste'}
              color={Math.abs(currentTotal - 100) <= 0.01 ? 'success' : 'warning'}
              size="small"
            />
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={Math.min(currentTotal, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                backgroundColor: Math.abs(currentTotal - 100) <= 0.01 ? '#4CAF50' : '#FF9800'
              }
            }}
          />
          
          {Math.abs(currentTotal - 100) > 0.01 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {currentTotal > 100 
                ? `Exceso: ${formatPercentage(currentTotal - 100)}` 
                : `Faltante: ${formatPercentage(100 - currentTotal)}`
              }
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Formulario de categorías */}
      <Grid container spacing={2}>
        {categoriesToShow.map((config) => {
          const validationState = getCategoryValidationState(config.key);
          const amount = (currentProfile.monthlyIncome * distribution[config.key]) / 100;
          
          return (
            <Grid item xs={12} sm={6} key={config.key}>
              <Card 
                variant="outlined"
                sx={{ 
                  borderColor: focusedCategory === config.key ? config.color : 'divider',
                  borderWidth: focusedCategory === config.key ? 2 : 1,
                  transition: 'border-color 0.2s'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1, color: config.color }}>
                      {config.name}
                    </Typography>
                    <Tooltip title={config.tooltip}>
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {config.description}
                  </Typography>
                  
                  {/* Input de porcentaje */}
                  <TextField
                    fullWidth
                    label="Porcentaje"
                    type="number"
                    value={distribution[config.key]}
                    onChange={(e) => handleInputChange(config.key, e.target.value)}
                    onFocus={() => setFocusedCategory(config.key)}
                    onBlur={() => setFocusedCategory(null)}
                    disabled={disabled}
                    error={!!inputErrors[config.key] || validationState?.severity === 'error'}
                    helperText={inputErrors[config.key] || validationState?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, max: 100, step: 0.1 }
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  {/* Slider */}
                  <Box sx={{ px: 1, mb: 2 }}>
                    <Slider
                      value={distribution[config.key]}
                      onChange={(_, value) => handleSliderChange(config.key, value as number)}
                      min={0}
                      max={100}
                      step={1}
                      disabled={disabled}
                      sx={{
                        color: config.color,
                        '& .MuiSlider-thumb': {
                          backgroundColor: config.color
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: config.color
                        }
                      }}
                      marks={[
                        { value: config.minValue, label: `${config.minValue}%` },
                        { value: config.maxValue, label: `${config.maxValue}%` }
                      ]}
                    />
                  </Box>
                  
                  {/* Monto calculado */}
                  <Box sx={{ textAlign: 'center', p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: config.color }}>
                      {formatCurrency(amount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Monto mensual
                    </Typography>
                  </Box>
                  
                  {/* Información adicional para deudas */}
                  {config.key === 'debt' && debtMetrics && (
                    <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Mínimo requerido: {formatCurrency(debtMetrics.totalMinimumPayments)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Capacidad extra: {formatCurrency(Math.max(0, amount - debtMetrics.totalMinimumPayments))}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Indicador de validación */}
                  {validationState && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {validationState.severity === 'error' ? (
                        <ErrorIcon color="error" fontSize="small" />
                      ) : (
                        <WarningIcon color="warning" fontSize="small" />
                      )}
                      <Typography 
                        variant="caption" 
                        color={validationState.severity === 'error' ? 'error' : 'warning.main'}
                        sx={{ ml: 0.5 }}
                      >
                        {validationState.message}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Información adicional */}
      {debtMetrics && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Información de Deudas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Deudas
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(debtMetrics.totalDebt)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Pagos Mínimos
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(debtMetrics.totalMinimumPayments)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  % Mínimo Requerido
                </Typography>
                <Typography variant="h6">
                  {formatPercentage(debtMetrics.minimumPercentageRequired)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Nivel de Riesgo
                </Typography>
                <Chip 
                  label={debtMetrics.riskLevel === 'low' ? 'Bajo' : 
                        debtMetrics.riskLevel === 'medium' ? 'Medio' : 
                        debtMetrics.riskLevel === 'high' ? 'Alto' : 'Crítico'}
                  color={debtMetrics.riskLevel === 'low' ? 'success' : 
                         debtMetrics.riskLevel === 'medium' ? 'warning' : 'error'}
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};