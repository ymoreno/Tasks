import React, { useState } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Collapse,
  IconButton,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Lightbulb as LightbulbIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useDebtAlerts } from '@/hooks/useDebtAlerts';
import { DebtAlert, DebtRecommendation } from '@/types';


interface DebtAlertSystemProps {
  className?: string;
}

/**
 * Sistema de alertas y recomendaciones para gestión de deudas
 * Genera alertas inteligentes basadas en métricas de deudas y distribución de presupuesto
 */
export const DebtAlertSystem: React.FC<DebtAlertSystemProps> = ({
  className
}) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  const {
    alerts,
    recommendations,
    isLoading,
    error,
    dismissAlert,
    applyRecommendation,
    refreshAlerts
  } = useDebtAlerts();

  const handleRecommendationAccept = async (action: any) => {
    try {
      await applyRecommendation(action);
    } catch (err) {
      console.error('Error aplicando recomendación:', err);
    }
  };

  const getAlertIcon = (severity: DebtAlert['severity']) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      case 'success':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getRecommendationIcon = (type: DebtRecommendation['type']) => {
    switch (type) {
      case 'budget-adjustment':
        return <TimelineIcon />;
      case 'debt-restructure':
        return <TrendingUpIcon />;
      case 'savings-optimization':
        return <CheckCircleIcon />;
      case 'income-increase':
        return <LightbulbIcon />;
      default:
        return <LightbulbIcon />;
    }
  };

  const getImpactColor = (impact: DebtRecommendation['impact']) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  // Mostrar loading si está cargando
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          Procesando recomendación...
        </Typography>
      </Box>
    );
  }

  // Mostrar error si hay alguno
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error en Sistema de Alertas</AlertTitle>
        {error}
        <Button size="small" onClick={refreshAlerts} startIcon={<RefreshIcon />}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  // No mostrar nada si no hay alertas ni recomendaciones
  if (alerts.length === 0 && recommendations.length === 0) {
    return null;
  }

  return (
    <Box className={className} sx={{ mb: 3 }}>
      {/* Alertas */}
      {alerts.length > 0 && (
        <Stack spacing={2} sx={{ mb: recommendations.length > 0 ? 3 : 0 }}>
          {alerts.map((alert) => (
            <Alert
            key={alert.id}
            severity={alert.severity}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {alert.action && alert.actionLabel && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => handleRecommendationAccept(alert.action!)}
                    startIcon={getAlertIcon(alert.severity)}
                  >
                    {alert.actionLabel}
                  </Button>
                )}
                {alert.dismissible !== false && (
                  <IconButton
                    aria-label="cerrar"
                    color="inherit"
                    size="small"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                )}
              </Box>
            }
          >
            <AlertTitle>{alert.title}</AlertTitle>
            {alert.message}
          </Alert>
          ))}
        </Stack>
      )}

      {/* Recomendaciones */}
      {recommendations.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<LightbulbIcon />}
            onClick={() => setShowRecommendations(!showRecommendations)}
            sx={{ mb: 2 }}
          >
            {showRecommendations ? 'Ocultar' : 'Ver'} Recomendaciones ({recommendations.length})
          </Button>

          <Collapse in={showRecommendations}>
            <Stack spacing={2}>
              {recommendations.map((recommendation) => (
                <Card key={recommendation.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      {getRecommendationIcon(recommendation.type)}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {recommendation.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {recommendation.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip
                            label={`Impacto: ${recommendation.impact}`}
                            color={getImpactColor(recommendation.impact)}
                            size="small"
                          />
                          <Chip
                            label={`Dificultad: ${recommendation.difficulty}`}
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            label={recommendation.estimatedTimeframe}
                            variant="outlined"
                            size="small"
                          />
                        </Box>

                        {recommendation.projectedImprovement && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Mejoras Proyectadas:
                            </Typography>
                            <List dense>
                              {recommendation.projectedImprovement.debtReduction && (
                                <ListItem>
                                  <ListItemText
                                    primary={`Reducción de deuda: $${recommendation.projectedImprovement.debtReduction.toLocaleString()}`}
                                  />
                                </ListItem>
                              )}
                              {recommendation.projectedImprovement.monthlyPaymentReduction && (
                                <ListItem>
                                  <ListItemText
                                    primary={`Reducción pago mensual: $${recommendation.projectedImprovement.monthlyPaymentReduction.toLocaleString()}`}
                                  />
                                </ListItem>
                              )}
                              {recommendation.projectedImprovement.timeToDebtFree && (
                                <ListItem>
                                  <ListItemText
                                    primary={`Tiempo libre de deudas: ${recommendation.projectedImprovement.timeToDebtFree} meses`}
                                  />
                                </ListItem>
                              )}
                              {recommendation.projectedImprovement.additionalSavings && (
                                <ListItem>
                                  <ListItemText
                                    primary={`Ahorros adicionales: $${recommendation.projectedImprovement.additionalSavings.toLocaleString()}/mes`}
                                  />
                                </ListItem>
                              )}
                            </List>
                          </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                          Pasos a seguir:
                        </Typography>
                        <List dense>
                          {recommendation.steps.map((step, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Typography variant="body2" color="primary">
                                  {index + 1}.
                                </Typography>
                              </ListItemIcon>
                              <ListItemText primary={step} />
                            </ListItem>
                          ))}
                        </List>

                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleRecommendationAccept({
                              type: recommendation.type,
                              data: recommendation
                            })}
                          >
                            Aplicar Recomendación
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {/* Implementar más tarde */}}
                          >
                            Más Información
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};





export default DebtAlertSystem;