import { useState, useEffect, useCallback } from 'react';
import { 
  DebtAlert, 
  DebtRecommendation, 
  DebtAlertAction, 
  DebtMetrics, 
  BudgetDistribution,
  Debt 
} from '@/types';
import { useFinanceContext } from '@/contexts/FinanceContext';
import { debtRecommendationEngine } from '@/services/debtRecommendationEngine';

interface UseDebtAlertsReturn {
  alerts: DebtAlert[];
  recommendations: DebtRecommendation[];
  dismissedAlerts: string[];
  isLoading: boolean;
  error: string | null;
  dismissAlert: (alertId: string) => void;
  applyRecommendation: (action: DebtAlertAction) => Promise<void>;
  refreshAlerts: () => void;
  clearDismissedAlerts: () => void;
}

/**
 * Hook personalizado para gestionar alertas y recomendaciones de deudas
 * Integra el sistema de alertas con el contexto financiero
 */
export const useDebtAlerts = (): UseDebtAlertsReturn => {
  const {
    debtMetrics,
    budgetDistribution,
    debts,
    profile,
    updateBudgetDistribution,
    recalculateOnDebtChange
  } = useFinanceContext();

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar alertas basadas en métricas actuales
  const generateAlerts = useCallback((): DebtAlert[] => {
    if (!debtMetrics || !budgetDistribution || !profile) return [];

    try {
      return generateDebtAlerts(debtMetrics, budgetDistribution, debts, profile.monthlyIncome);
    } catch (err) {
      console.error('Error generando alertas:', err);
      setError('Error al generar alertas de deudas');
      return [];
    }
  }, [debtMetrics, budgetDistribution, debts, profile]);

  // Generar recomendaciones basadas en métricas actuales
  const generateRecommendations = useCallback((): DebtRecommendation[] => {
    if (!debtMetrics || !budgetDistribution || !profile) return [];

    try {
      return debtRecommendationEngine.generateRecommendations(
        debtMetrics,
        budgetDistribution,
        debts,
        profile.monthlyIncome
      );
    } catch (err) {
      console.error('Error generando recomendaciones:', err);
      setError('Error al generar recomendaciones');
      return [];
    }
  }, [debtMetrics, budgetDistribution, debts, profile]);

  const alerts = generateAlerts().filter(alert => !dismissedAlerts.includes(alert.id));
  const recommendations = generateRecommendations();

  // Descartar alerta
  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    
    // Guardar en localStorage para persistencia
    const stored = localStorage.getItem('dismissedDebtAlerts');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem('dismissedDebtAlerts', JSON.stringify([...existing, alertId]));
  }, []);

  // Aplicar recomendación
  const applyRecommendation = useCallback(async (action: DebtAlertAction) => {
    if (!debtMetrics || !budgetDistribution) {
      setError('No hay datos suficientes para aplicar la recomendación');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = debtRecommendationEngine.applyRecommendation(action, budgetDistribution, debtMetrics);

      switch (action.type) {
        case 'adjust-budget':
          if (result && typeof result === 'object' && 'necessity' in result) {
            await updateBudgetDistribution(result as BudgetDistribution);
          }
          break;

        case 'optimize-savings':
          if (result && result.recommendedSavingsRate) {
            const newDistribution: BudgetDistribution = {
              ...budgetDistribution,
              saving: result.recommendedSavingsRate,
              want: Math.max(5, budgetDistribution.want - (result.recommendedSavingsRate - budgetDistribution.saving))
            };
            await updateBudgetDistribution(newDistribution);
          }
          break;

        case 'restructure-debts':
        case 'increase-income':
        case 'reduce-expenses':
          // Estas acciones requieren intervención manual del usuario
          // Por ahora solo mostramos la información
          console.log('Recomendación aplicada:', action.type, result);
          break;

        default:
          console.warn('Tipo de acción no reconocido:', action.type);
      }

      // Recalcular métricas después de aplicar cambios
      await recalculateOnDebtChange();

    } catch (err) {
      console.error('Error aplicando recomendación:', err);
      setError('Error al aplicar la recomendación');
    } finally {
      setIsLoading(false);
    }
  }, [debtMetrics, budgetDistribution, updateBudgetDistribution, recalculateOnDebtChange]);

  // Refrescar alertas (útil después de cambios)
  const refreshAlerts = useCallback(() => {
    setError(null);
    // Las alertas se regeneran automáticamente por los useMemo
  }, []);

  // Limpiar alertas descartadas
  const clearDismissedAlerts = useCallback(() => {
    setDismissedAlerts([]);
    localStorage.removeItem('dismissedDebtAlerts');
  }, []);

  // Cargar alertas descartadas del localStorage al inicializar
  useEffect(() => {
    const stored = localStorage.getItem('dismissedDebtAlerts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDismissedAlerts(parsed);
        }
      } catch (err) {
        console.error('Error cargando alertas descartadas:', err);
      }
    }
  }, []);

  // Limpiar alertas descartadas automáticamente después de 7 días
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const stored = localStorage.getItem('dismissedDebtAlertsTimestamp');
      if (stored) {
        const timestamp = parseInt(stored);
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        if (timestamp < weekAgo) {
          clearDismissedAlerts();
        }
      } else {
        localStorage.setItem('dismissedDebtAlertsTimestamp', Date.now().toString());
      }
    }, 24 * 60 * 60 * 1000); // Verificar diariamente

    return () => clearInterval(cleanupInterval);
  }, [clearDismissedAlerts]);

  return {
    alerts,
    recommendations,
    dismissedAlerts,
    isLoading,
    error,
    dismissAlert,
    applyRecommendation,
    refreshAlerts,
    clearDismissedAlerts
  };
};

/**
 * Genera alertas de deudas (función auxiliar)
 * Separada para facilitar testing y reutilización
 */
function generateDebtAlerts(
  debtMetrics: DebtMetrics,
  budgetDistribution: BudgetDistribution,
  _debts: Debt[],
  _monthlyIncome: number
): DebtAlert[] {
  const alerts: DebtAlert[] = [];

  // Alerta de alto endeudamiento (>30%)
  if (debtMetrics.minimumPercentageRequired > 30) {
    alerts.push({
      id: 'high-debt-load',
      severity: 'error',
      title: 'Alto Nivel de Endeudamiento',
      message: `Tus deudas requieren ${debtMetrics.minimumPercentageRequired.toFixed(1)}% de tu ingreso. Esto supera el límite recomendado del 30%.`,
      action: { type: 'restructure-debts' },
      actionLabel: 'Ver Opciones',
      dismissible: true
    });
  }

  // Alerta de endeudamiento crítico (>40%)
  if (debtMetrics.minimumPercentageRequired > 40) {
    alerts.push({
      id: 'critical-debt-load',
      severity: 'error',
      title: '⚠️ Situación Crítica',
      message: `Nivel de endeudamiento crítico: ${debtMetrics.minimumPercentageRequired.toFixed(1)}%. Acción urgente requerida.`,
      action: { type: 'restructure-debts' },
      actionLabel: 'Plan de Emergencia',
      dismissible: false
    });
  }

  // Alerta de presupuesto insuficiente
  if (budgetDistribution.debt < debtMetrics.minimumPercentageRequired) {
    alerts.push({
      id: 'insufficient-debt-budget',
      severity: 'warning',
      title: 'Presupuesto Insuficiente',
      message: `Necesitas ${debtMetrics.minimumPercentageRequired.toFixed(1)}% para deudas, pero solo tienes ${budgetDistribution.debt}% asignado.`,
      action: { type: 'adjust-budget' },
      actionLabel: 'Ajustar Automáticamente',
      dismissible: true
    });
  }

  // Alerta de progreso positivo
  if (debtMetrics.riskLevel === 'low' && debtMetrics.minimumPercentageRequired < 15) {
    alerts.push({
      id: 'excellent-debt-management',
      severity: 'success',
      title: '🎉 Excelente Gestión',
      message: 'Tus deudas están muy controladas. Considera optimizar ahorros e inversiones.',
      action: { type: 'optimize-savings' },
      actionLabel: 'Optimizar Ahorros',
      dismissible: true,
      autoHide: true,
      duration: 10000
    });
  }

  return alerts;
}