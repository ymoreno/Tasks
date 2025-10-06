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
  subtaskRotation?: 'weekly' | 'completion'; // Define cómo rotan las subtareas
  currentSubtaskId?: string; // ID de la subtarea activa
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
  distributionType: 'recommended' | 'custom';
  categories: BudgetCategory[];
  createdAt: string;
  updatedAt?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  type: 'necessity' | 'want' | 'saving';
  percentage: number;
  budgetAmount: number;
  spentAmount: number;
  color: string;
  description?: string;
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

export interface FinanceContextType {
  profile: FinancialProfile | null;
  expenses: Expense[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  summary: FinancialSummary | null;
  debtSummary: DebtSummary | null;
  loading: boolean;
  error: string | null;
  createProfile: (income: number, distributionType: 'recommended' | 'custom') => Promise<void>;
  updateProfile: (updates: Partial<FinancialProfile>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<void>;
  updateDebt: (debtId: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (debtId: string) => Promise<void>;
  addDebtPayment: (payment: Omit<DebtPayment, 'id' | 'createdAt'>) => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  fetchDebts: () => Promise<void>;
  fetchDebtPayments: () => Promise<void>;
  calculateSummary: () => Promise<void>;
  calculateDebtSummary: () => Promise<void>;
}

// Tipos para estadísticas
export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  averageTime: number;
  totalTime: number;
  categoryBreakdown: { [category: string]: number };
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

// Tipos para el contexto de React
export interface TaskContextType {
  tasks: { [category: string]: { tasks: Task[] } };
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (category: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (category: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (category: string, taskId: string) => Promise<void>;
}

export interface WeeklyContextType {
  weeklyTasks: WeeklyTask[];
  dayState: DayState | null;
  currentTask: WeeklyTask | null;
  loading: boolean;
  error: string | null;
  fetchWeeklyTasks: () => Promise<void>;
  fetchCurrentDay: () => Promise<void>;
  startTask: () => Promise<void>;
  completeTask: () => Promise<void>;
  completeSubtask: () => Promise<void>;
  updateSubtaskTitle: (subtaskId: string, newTitle: string) => Promise<void>;
  finishGameTask: (subtaskId: string, newTitle: string) => Promise<void>;
  updateTimer: (elapsedSeconds: number, state: TimerState) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  tickTimer: (newSeconds: number) => void;
  addCourse: (parentSubtaskId: string, courseName: string) => Promise<void>;
  completeCourse: (parentSubtaskId: string, courseSubtaskId: string) => Promise<void>;
}

export interface PaymentContextType {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  fetchPayments: () => Promise<void>;
  createPayment: (paymentData: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  executePayment: (paymentId: string) => Promise<void>;
  decreasePriorities: () => Promise<number>;
  getPaymentHistory: () => Promise<Payment[]>;
}

// Tipos para componentes
export interface TimeTrackerProps {
  taskId: string;
  timeTracking: TimeTracking;
  onTimeUpdate?: (taskId: string, timeTracking: TimeTracking) => void;
}

export interface TaskCardProps {
  task: Task;
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export interface WeeklyTaskCardProps {
  task: WeeklyTask;
  isActive: boolean;
  onComplete?: () => void;
}

export interface CompletedItem {
  id: string;
  type: 'Game' | 'Book' | 'Course';
  name: string;
  completedDate: string; // ISO string
  timeSpent?: number; // in milliseconds
  parentId?: string; // Optional: ID of the parent task/subtask
}