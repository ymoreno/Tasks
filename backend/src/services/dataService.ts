import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Task, WeeklyTask, Payment, DayState, CompletedItem } from '../types';

// --- Funciones de ayuda para el sistema de archivos ---

const DATA_DIR = path.join(__dirname, '../../data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const WEEKLY_FILE = path.join(DATA_DIR, 'weekly-tasks.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
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

// --- Servicio para Historial ---
export class HistoryService {
    static async getHistory(): Promise<CompletedItem[]> {
        return await readJsonFile(HISTORY_FILE, []);
    }

    static async addToHistory(item: CompletedItem): Promise<void> {
        const history = await this.getHistory();
        history.push(item);
        await createBackup(HISTORY_FILE);
        await writeJsonFile(HISTORY_FILE, history);
    }
}

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
      subtaskQueues: {},
      history: []
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
        await HistoryService.addToHistory({
            id: completedSubtask.id,
            type: 'Book',
            name: newTitle,
            completedDate: new Date().toISOString(),
            timeSpent: 0 // Opcional: calcular si es necesario
        });
    }
    parentTask.subtasks[subtaskIndex].title = newTitle;
    await this.saveWeeklyData(data);
  }

  static async finishGameTask(subtaskId: string, newTitle: string): Promise<void> {
    const data = await this.getWeeklyData();
    let parentTask: WeeklyTask | undefined;

    for (const task of data.sequence) {
        if (task.subtasks?.some(st => st.id === subtaskId)) {
            parentTask = task;
            break;
        }
    }

    if (!parentTask || !parentTask.subtasks) {
        throw new Error('Tarea de juego no encontrada o no tiene subtareas.');
    }

    const currentSubtaskIndex = parentTask.subtasks.findIndex(st => st.id === subtaskId);
    if (currentSubtaskIndex === -1) {
        throw new Error('Subtarea de juego actual no encontrada.');
    }
    
    const completedSubtask = parentTask.subtasks[currentSubtaskIndex];
    await HistoryService.addToHistory({
        id: completedSubtask.id,
        type: 'Game',
        name: completedSubtask.name,
        completedDate: new Date().toISOString(),
        timeSpent: 0 // Opcional: calcular si es necesario
    });

    parentTask.subtasks[currentSubtaskIndex].title = newTitle;

    const nextSubtaskIndex = (currentSubtaskIndex + 1) % parentTask.subtasks.length;
    const nextSubtaskId = parentTask.subtasks[nextSubtaskIndex].id;
    parentTask.currentSubtaskId = nextSubtaskId;

    await this.saveWeeklyData(data);
  }

  static async completeCourse(parentSubtaskId: string, courseSubtaskId: string): Promise<void> {
    const data = await this.getWeeklyData();
    const macTask = data.sequence.find(t => t.id === 'weekly_13');

    if (!macTask || !macTask.subtasks) {
        throw new Error('Tarea Mac no encontrada');
    }

    const parentSubtask = macTask.subtasks.find(st => st.id === parentSubtaskId);

    if (!parentSubtask || !parentSubtask.subtasks) {
        throw new Error('Subtarea padre no encontrada o no tiene subtareas');
    }

    const courseIndex = parentSubtask.subtasks.findIndex(st => st.id === courseSubtaskId);

    if (courseIndex === -1) {
        throw new Error('Curso no encontrado');
    }

    const course = parentSubtask.subtasks[courseIndex];

    await HistoryService.addToHistory({
        id: course.id,
        type: 'Course',
        name: course.name,
        completedDate: new Date().toISOString(),
        timeSpent: course.timeTracking?.totalTime || 0
    });

    parentSubtask.subtasks.splice(courseIndex, 1);
    await this.saveWeeklyData(data);
  }

  static async getUnfinishedCourses(): Promise<any[]> {
    const data = await this.getWeeklyData();
    const macTask = data.sequence.find(t => t.id === 'weekly_13');
    if (!macTask || !macTask.subtasks) {
      return [];
    }

    const practicas = macTask.subtasks.find(st => st.id === 'sub_mac_practicas');
    const related = macTask.subtasks.find(st => st.id === 'sub_mac_related');

    const unfinishedCourses = [];
    if (practicas && practicas.subtasks) {
      unfinishedCourses.push(...practicas.subtasks.map(c => ({ ...c, parentName: practicas.name })));
    }
    if (related && related.subtasks) {
      unfinishedCourses.push(...related.subtasks.map(c => ({ ...c, parentName: related.name })));
    }

    return unfinishedCourses;
  }

  static async rotateMacSubtask(taskId: string): Promise<boolean> {
    const data = await this.getWeeklyData();
    const task = data.sequence.find(t => t.id === taskId);

    if (!task || !task.subtasks || task.subtasks.length === 0) {
      return false;
    }

    const currentIndex = task.subtasks.findIndex(st => st.id === task.currentSubtaskId);
    if (currentIndex === -1) {
      return false;
    }

    const currentSubtask = task.subtasks[currentIndex];

    if (currentSubtask.id === 'sub_mac_practicas' || currentSubtask.id === 'sub_mac_related') {
      console.log(`Procesando subtarea especial: ${currentSubtask.name}`);
    }

    if (currentIndex === task.subtasks.length - 1) {
      task.currentSubtaskId = task.subtasks[0].id;
      await this.saveWeeklyData(data);
      return true; 
    } else {
      const nextIndex = currentIndex + 1;
      const nextSubtaskId = task.subtasks[nextIndex].id;
      task.currentSubtaskId = nextSubtaskId;
      await this.saveWeeklyData(data);
      return false;
    }
  }
  
  static async addCourseToSubtask(parentSubtaskId: string, courseName: string): Promise<void> {
    const data = await this.getWeeklyData();
    const macTask = data.sequence.find(t => t.id === 'weekly_13');

    if (!macTask || !macTask.subtasks) {
      throw new Error('Tarea Mac no encontrada');
    }

    const parentSubtask = macTask.subtasks.find(st => st.id === parentSubtaskId);

    if (!parentSubtask) {
      throw new Error('Subtarea padre no encontrada');
    }

    if (!parentSubtask.subtasks) {
      parentSubtask.subtasks = [];
    }

    const newCourse = {
      id: `sub_${parentSubtaskId}_${courseName.toLowerCase().replace(/\s/g, '_')}`,
      name: courseName,
      completed: false,
      order: parentSubtask.subtasks.length + 1,
      movedToEnd: false,
      timeTracking: {
        isActive: false,
        totalTime: 0,
        sessions: []
      }
    };

    parentSubtask.subtasks.push(newCourse);
    await this.saveWeeklyData(data);
  }

  static async deleteCourseFromSubtask(parentSubtaskId: string, courseSubtaskId: string): Promise<boolean> {
    const data = await this.getWeeklyData();
    const macTask = data.sequence.find(t => t.id === 'weekly_13');

    if (!macTask || !macTask.subtasks) {
      throw new Error('Tarea Mac no encontrada');
    }

    const parentSubtask = macTask.subtasks.find(st => st.id === parentSubtaskId);

    if (!parentSubtask || !parentSubtask.subtasks) {
      throw new Error('Subtarea padre no encontrada o no tiene subtareas');
    }

    const initialLength = parentSubtask.subtasks.length;
    parentSubtask.subtasks = parentSubtask.subtasks.filter(st => st.id !== courseSubtaskId);

    if (parentSubtask.subtasks.length < initialLength) {
      await this.saveWeeklyData(data);
      return true;
    }
    return false;
  }

  static async rotateCompletionBasedSubtask(taskId: string): Promise<void> {
    const data = await this.getWeeklyData();
    const task = data.sequence.find(t => t.id === taskId);
    if (!task || task.subtaskRotation !== 'completion' || !task.subtasks || !task.subtasks.length) {
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
    
    const createdAt = new Date();
    let dueDate = paymentData.dueDate;
    if (!dueDate) {
      const twoWeeksLater = new Date(createdAt);
      twoWeeksLater.setDate(createdAt.getDate() + 14);
      dueDate = twoWeeksLater.toISOString().split('T')[0];
    }

    const newPayment: Payment = {
      ...paymentData,
      id: uuidv4(),
      createdAt,
      priority: paymentData.priority || 5,
      dueDate,
      isRecurring: paymentData.isRecurring || false,
    };
    
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

  static async executePayment(paymentId: string): Promise<{ executedPayment: Payment | null, updatedPayment?: Payment }> {
    const payments = await this.getAllPayments();
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) {
      return { executedPayment: null };
    }

    const payment = payments[paymentIndex];

    if (!payment.isRecurring) {
      // 1. Add to history
      await HistoryService.addToHistory({
        id: payment.id,
        type: 'Payment',
        name: payment.name,
        completedDate: new Date().toISOString(),
      });

      // 2. Remove from payments
      payments.splice(paymentIndex, 1);
      await this.saveAllPayments(payments);

      return { executedPayment: { ...payment, status: 'pagado' } };
    } else {
      // 3. Update dueDate for recurring payments
      const newDueDate = new Date(payment.dueDate || Date.now());
      if (payment.recurrence === 'mensual') {
        newDueDate.setMonth(newDueDate.getMonth() + 1);
      } else if (payment.recurrence === 'trimestral') {
        newDueDate.setMonth(newDueDate.getMonth() + 3);
      } else if (payment.recurrence === 'anual') {
        newDueDate.setFullYear(newDueDate.getFullYear() + 1);
      }

      const updatedPayment = {
        ...payment,
        dueDate: newDueDate.toISOString().split('T')[0],
        priority: 2,
      };

      payments[paymentIndex] = updatedPayment;
      await this.saveAllPayments(payments);

      return { executedPayment: payment, updatedPayment };
    }
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    const payments = await this.getAllPayments();
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) return false;
    payments.splice(paymentIndex, 1);
    await this.saveAllPayments(payments);
    return true;
  }

  static async increasePriorities(): Promise<Payment[]> {
    const payments = await this.getAllPayments();
    const updatedPayments = payments.map(payment => {
      if (payment.priority > 1) {
        return { ...payment, priority: payment.priority - 1 };
      }
      return payment;
    });
    await this.saveAllPayments(updatedPayments);
    return updatedPayments;
  }
}

// --- Inicialización ---

ensureDirectories();

// Exportar una instancia de los servicios
export const weeklyTaskService = new WeeklyTaskService();
export const taskService = new TaskService();
export const paymentService = new PaymentService();
export const historyService = new HistoryService();