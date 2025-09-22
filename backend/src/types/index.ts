// Tipos principales del sistema

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
  name: string;
  title?: string; // Título del libro para subtareas de lectura
  completed: boolean;
  order: number;
  movedToEnd: boolean;
  timeTracking: TimeTracking;
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
  isStarted?: boolean;
  subtaskRotation?: 'weekly' | 'completion';
  currentSubtaskId?: string;
}

export interface ReadingHistoryEntry {
  title: string;
  format: string;
  completedDate: string;
}

export interface DayState {
  date: string;
  currentTaskIndex: number;
  completedTasks: string[];
  dayCompleted: boolean;
  subtaskQueues: { [taskId: string]: Subtask[] };
  readingHistory?: ReadingHistoryEntry[];
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
  | 'frutero';

export interface Space {
  id: SpaceType;
  name: string;
  description?: string;
  category: 'interior' | 'exterior' | 'especial';
}

export interface Payment {
  id: string;
  name: string;
  url?: string;
  description?: string;
  createdAt: Date;
  category?: string;
  space?: SpaceType; // Espacio asociado a la compra
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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
