import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Task, WeeklyTask, Payment, DayState } from '../types';

// --- Funciones de ayuda para el sistema de archivos ---

const DATA_DIR = path.join(__dirname, '../../data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const WEEKLY_FILE = path.join(DATA_DIR, 'weekly-tasks.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const ensureDirectories = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creando directorios:', error);
  }
};

const readJsonFile = async <T>(filePath: string, defaultValue: T): Promise<T> => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeJsonFile(filePath, defaultValue);
      return defaultValue;
    }
    throw error;
  }
};

const writeJsonFile = async <T>(filePath: string, data: T): Promise<void> => {
  await ensureDirectories();
  const jsonData = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonData, 'utf-8');
};

const createBackup = async (filePath: string): Promise<void> => {
  try {
    const fileName = path.basename(filePath, '.json');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `${fileName}-${timestamp}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, data, 'utf-8');
    console.log(`✅ Respaldo creado: ${backupPath}`);
  } catch (error) {
    console.error('Error creando respaldo:', error);
  }
};

// --- Servicio para Tareas Generales ---

export class TaskService {
  private static defaultData = {
    categories: {} as { [category: string]: { tasks: Task[] } }
  };

  static async getAllTasks(): Promise<{ [category: string]: { tasks: Task[] } }> {
    const data = await readJsonFile(TASKS_FILE, this.defaultData);
    return data.categories;
  }

  static async saveAllTasks(categories: { [category: string]: { tasks: Task[] } }): Promise<void> {
    await createBackup(TASKS_FILE);
    await writeJsonFile(TASKS_FILE, { categories });
  }

  static async getTaskById(taskId: string): Promise<Task | null> {
    const categories = await this.getAllTasks();
    for (const category of Object.values(categories)) {
      const task = category.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const categories = await this.getAllTasks();
    for (const category of Object.values(categories)) {
      const taskIndex = category.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        category.tasks[taskIndex] = { ...category.tasks[taskIndex], ...updates, updatedAt: new Date() };
        await this.saveAllTasks(categories);
        return category.tasks[taskIndex];
      }
    }
    return null;
  }

  static async createTask(categoryName: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const categories = await this.getAllTasks();
    if (!categories[categoryName]) {
      categories[categoryName] = { tasks: [] };
    }
    const newTask: Task = { ...taskData, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
    categories[categoryName].tasks.push(newTask);
    await this.saveAllTasks(categories);
    return newTask;
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    const categories = await this.getAllTasks();
    for (const category of Object.values(categories)) {
      const taskIndex = category.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        category.tasks.splice(taskIndex, 1);
        await this.saveAllTasks(categories);
        return true;
      }
    }
    return false;
  }
}

// --- Servicio para Tareas Semanales ---

export class WeeklyTaskService {
  private static defaultData = {
    sequence: [] as WeeklyTask[],
    dailyState: {
      date: new Date().toISOString().split('T')[0],
      currentTaskIndex: 0,
      completedTasks: [],
      dayCompleted: false,
      subtaskQueues: {}
    } as DayState
  };

  static async getWeeklyData() {
    return await readJsonFile(WEEKLY_FILE, this.defaultData);
  }

  static async saveWeeklyData(data: typeof this.defaultData): Promise<void> {
    await createBackup(WEEKLY_FILE);
    await writeJsonFile(WEEKLY_FILE, data);
  }

  static async getCurrentDayState(): Promise<DayState> {
    const data = await this.getWeeklyData();
    return data.dailyState;
  }

  static async updateDayState(updates: Partial<DayState>): Promise<DayState> {
    const data = await this.getWeeklyData();
    data.dailyState = { ...data.dailyState, ...updates };
    await this.saveWeeklyData(data);
    return data.dailyState;
  }

  static async updateWeeklyRotations(): Promise<void> {
    const data = await this.getWeeklyData();
    const getWeekNumber = (d: Date) => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return weekNo;
    };
    const currentWeek = getWeekNumber(new Date());
    let changesMade = false;
    for (const task of data.sequence) {
      if (task.subtaskRotation === 'weekly' && task.subtasks && task.subtasks.length > 0) {
        const newIndex = (currentWeek - 1) % task.subtasks.length;
        const newSubtask = task.subtasks[newIndex];
        if (task.currentSubtaskId !== newSubtask.id) {
          task.currentSubtaskId = newSubtask.id;
          changesMade = true;
        }
      }
    }
    if (changesMade) {
      await this.saveWeeklyData(data);
    }
  }

  static async updateSubtaskTitle(subtaskId: string, newTitle: string): Promise<void> {
    const data = await this.getWeeklyData();
    let parentTask: WeeklyTask | undefined;
    for (const task of data.sequence) {
      if (task.subtasks?.some(st => st.id === subtaskId)) {
        parentTask = task;
        break;
      }
    }
    if (!parentTask || !parentTask.subtasks) {
      throw new Error('Tarea padre o subtareas no encontradas');
    }
    const subtaskIndex = parentTask.subtasks.findIndex(st => st.id === subtaskId);
    if (subtaskIndex === -1) {
      throw new Error('Subtarea no encontrada');
    }
    const completedSubtask = parentTask.subtasks[subtaskIndex];
    if (parentTask.id === 'weekly_3') { // Asumimos que "Leer" es weekly_3
      if (!data.dailyState.readingHistory) {
        data.dailyState.readingHistory = [];
      }
      data.dailyState.readingHistory.push({
        title: completedSubtask.title || 'Sin título',
        format: completedSubtask.name,
        completedDate: new Date().toISOString(),
      });
    }
    parentTask.subtasks[subtaskIndex].title = newTitle;
    await this.saveWeeklyData(data);
  }

  static async rotateCompletionBasedSubtask(taskId: string): Promise<void> {
    const data = await this.getWeeklyData();
    const task = data.sequence.find(t => t.id === taskId);
    if (!task || task.subtaskRotation !== 'completion' || !task.subtasks || task.subtasks.length === 0) {
      return;
    }
    const currentIndex = task.subtasks.findIndex(st => st.id === task.currentSubtaskId);
    if (currentIndex === -1) {
      return;
    }
    const nextIndex = (currentIndex + 1) % task.subtasks.length;
    const nextSubtaskId = task.subtasks[nextIndex].id;
    task.currentSubtaskId = nextSubtaskId;
    await this.saveWeeklyData(data);
  }
}

// --- Servicio para Pagos y Compras ---

export class PaymentService {
  private static defaultData = {
    items: [] as Payment[]
  };

  static async getAllPayments(): Promise<Payment[]> {
    const data = await readJsonFile(PAYMENTS_FILE, this.defaultData);
    return data.items;
  }

  static async saveAllPayments(payments: Payment[]): Promise<void> {
    await createBackup(PAYMENTS_FILE);
    await writeJsonFile(PAYMENTS_FILE, { items: payments });
  }

  static async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const payments = await this.getAllPayments();
    const newPayment: Payment = { ...paymentData, id: uuidv4(), createdAt: new Date() };
    payments.push(newPayment);
    await this.saveAllPayments(payments);
    return newPayment;
  }

  static async updatePayment(paymentId: string, updates: Partial<Payment>): Promise<Payment | null> {
    const payments = await this.getAllPayments();
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) return null;
    payments[paymentIndex] = { ...payments[paymentIndex], ...updates };
    await this.saveAllPayments(payments);
    return payments[paymentIndex];
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    const payments = await this.getAllPayments();
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) return false;
    payments.splice(paymentIndex, 1);
    await this.saveAllPayments(payments);
    return true;
  }
}

// --- Inicialización ---

ensureDirectories();

// Exportar una instancia de los servicios
export const weeklyTaskService = new WeeklyTaskService();
export const taskService = new TaskService();
export const paymentService = new PaymentService();
