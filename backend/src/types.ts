// Tipos compartidos entre frontend y backend

export interface TimeSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // en milisegundos
}

export interface TimeTracking {
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  totalTime: number; // en milisegundos
  sessions: TimeSession[];
}

export interface Task {
  id: string;
  category: string;
  name: string;
  scores: number[];
  currentScore?: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  timeTracking: TimeTracking;
}

export interface Subtask {
  id: string;
  name: string; // Formato de lectura, ej: "Kindle"
  title?: string; // Título del libro
  completed: boolean;
  order: number;
  movedToEnd: boolean;
  timeTracking: TimeTracking;
  subtasks?: Subtask[];
  currentSubtaskId?: string;
  parentName?: string;
  subtaskRotation?: 'weekly' | 'completion' | 'onStartOrCompletion' | 'dailyOrCompletion'; // Define cómo rotan las subtareas
}

export interface WeeklyTask {
  id: string;
  name: string;
  plannedDays: number;
  completedDays: number;
  weeklySchedule: boolean[]; // [L,M,X,J,V,S,D]
  subtasks?: Subtask[];
  order: number;
  timeTracking: TimeTracking;
  isStarted?: boolean; // Nueva propiedad para controlar si la tarea ha sido iniciada
  subtaskRotation?: 'weekly' | 'completion' | 'onStartOrCompletion' | 'dailyOrCompletion'; // Define cómo rotan las subtareas
  currentSubtaskId?: string; // ID de la subtarea activa
  notes?: string; // Notas de la tarea
}

export type TimerState = 'running' | 'paused' | 'stopped';

export interface DayState {
  date: string;
  currentTaskIndex: number;
  completedTasks: string[];
  dayCompleted: boolean;
  subtaskQueues: { [taskId: string]: Subtask[] };
  timerElapsedSeconds?: number;
  timerState?: TimerState;
  lastDailyRotation?: string; // Fecha de la última rotación diaria
}

// Espacios disponibles para tareas y compras
export type SpaceType = 
  | 'baño_principal'
  | 'vestier'
  | 'cuarto_principal'
  | 'balcon'
  | 'oficina'
  | 'sala_tv'
  | 'sala_juegos'
  | 'biblioteca'
  | 'escaleras_anden'
  | 'frente_porton_arco'
  | 'patio_delantero'
  | 'patio_trasero'
  | 'vermi'
  | 'compost'
  | 'rancho'
  | 'invernadero'
  | 'bbq'
  | 'baño_externo'
  | 'bodega_bajo_escaleras'
  | 'sala_control'
  | 'terraza'
  | 'camioneta'
  | 'sala'
  | 'cocina'
  | 'cuarto_invitados'
  | 'baño_invitados'
  | 'gimnasio'
  | 'alacena_alterna'
  | 'cuarto_limpios'
  | 'frutero'

export interface Space {
  id: SpaceType;
  name: string;
  description?: string;
  category: 'interior' | 'exterior' | 'especial';
}

export interface Payment {
  id: string;
  name: string;
  amount: number;
  category: string;
  url?: string;
  description?: string;
  status: 'pendiente' | 'pagado' | 'en proceso';
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  isRecurring: boolean;
  recurrence?: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  priority: number; // 1: Máxima (crítica), 10: Mínima (default)
  createdAt: string; // Cambiado a string para facilitar la serialización
  updatedAt?: string;
  space?: SpaceType; // Espacio asociado a la compra
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos para finanzas personales
export interface FinancialProfile {
  id: string;
  monthlyIncome: number;
  distributionType: 'recommended' | 'custom' | 'debt-aware';
  categories: BudgetCategory[];
  debtSettings?: DebtBudgetSettings;
  createdAt: string;
  updatedAt?: string;
}

export interface DebtBudgetSettings {
  includeDebtCategory: boolean;
  minimumDebtPercentage: number;
  currentDebtPercentage: number;
  autoCalculateFromDebts: boolean;
  alertThresholds: {
    highDebt: number; // Default: 30%
    criticalDebt: number; // Default: 40%
  };
}

export interface BudgetCategory {
  id: string;
  name: string;
  type: 'necessity' | 'want' | 'saving' | 'debt';
  percentage: number;
  budgetAmount: number;
  spentAmount: number;
  color: string;
  description?: string;
  isDebtCategory?: boolean;
  linkedDebts?: string[]; // IDs de deudas asociadas
}

export interface DebtMetrics {
  totalDebt: number;
  totalMinimumPayments: number;
  minimumPercentageRequired: number;
  recommendedPercentage: number;
  debtToIncomeRatio: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface BudgetDistribution {
  necessity: number;
  want: number;
  saving: number;
  debt: number;
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentage: number;
  }[];
}

export interface CompletedItem {
  id: string;
  type: 'Game' | 'Book' | 'Course';
  name: string;
  completedDate: string; // ISO string
  timeSpent?: number; // in milliseconds
  parentId?: string; // Optional: ID of the parent task/subtask
}

export interface Debt {
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
  updatedAt?: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  paymentType: 'minimum' | 'extra' | 'full';
  description?: string;
  createdAt: string;
}

export interface DebtSummary {
  totalDebt: number;
  totalMinimumPayments: number;
  totalInterestRate: number;
  monthlyDebtLoad: number;
  debtToIncomeRatio: number;
  payoffProjections: {
    debtId: string;
    debtName: string;
    monthsToPayoff: number;
    totalInterestToPay: number;
  }[];
}

export interface TimeStats {
  taskId: string;
  taskName: string;
  totalTime: number;
  averageSessionTime: number;
  sessionCount: number;
  minTime: number;
  maxTime: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export class DebtBudgetError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DebtBudgetError';
  }
}

export const ERROR_CODES = {
  INVALID_DISTRIBUTION: 'INVALID_DISTRIBUTION',
  INSUFFICIENT_DEBT_BUDGET: 'INSUFFICIENT_DEBT_BUDGET',
  DEBT_CALCULATION_FAILED: 'DEBT_CALCULATION_FAILED',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR'
} as const;

export const DEFAULT_DEBT_SETTINGS: DebtBudgetSettings = {
  includeDebtCategory: true,
  minimumDebtPercentage: 0,
  currentDebtPercentage: 10,
  autoCalculateFromDebts: true,
  alertThresholds: {
    highDebt: 30,
    criticalDebt: 40
  }
};