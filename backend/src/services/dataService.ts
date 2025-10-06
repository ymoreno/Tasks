import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Task, WeeklyTask, Payment, DayState, FinancialProfile, BudgetCategory, Expense, FinancialSummary } from '../types';

// --- Configuración de archivos ---
const DATA_DIR = path.join(__dirname, '../../data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const WEEKLY_FILE = path.join(DATA_DIR, 'weekly-tasks.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

// --- Funciones de ayuda ---
const ensureDirectories = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
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

// --- Servicio de Tareas ---
export class TaskService {
  static async getAllTasks(): Promise<{ [category: string]: { tasks: Task[] } }> {
    const data = await readJsonFile(TASKS_FILE, {}) as any;
    return data.categories || {};
  }

  static async getTaskById(taskId: string): Promise<Task | null> {
    const allTasks = await this.getAllTasks();
    for (const category of Object.values(allTasks)) {
      const task = category.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  }

  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { category: string }): Promise<Task> {
    const allTasks = await this.getAllTasks();
    const { category, ...taskInfo } = taskData;
    
    const newTask: Task = {
      ...taskInfo,
      category,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!allTasks[category]) {
      allTasks[category] = { tasks: [] };
    }
    
    allTasks[category].tasks.push(newTask);
    await writeJsonFile(TASKS_FILE, { categories: allTasks });
    return newTask;
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const allTasks = await this.getAllTasks();
    
    for (const category of Object.values(allTasks)) {
      const taskIndex = category.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        category.tasks[taskIndex] = {
          ...category.tasks[taskIndex],
          ...updates,
          updatedAt: new Date()
        };
        await writeJsonFile(TASKS_FILE, { categories: allTasks });
        return category.tasks[taskIndex];
      }
    }
    
    throw new Error('Tarea no encontrada');
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    const allTasks = await this.getAllTasks();
    
    for (const category of Object.values(allTasks)) {
      const taskIndex = category.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        category.tasks.splice(taskIndex, 1);
        await writeJsonFile(TASKS_FILE, { categories: allTasks });
        return true;
      }
    }
    
    return false;
  }

  static async generateRandomScores(): Promise<{ [category: string]: { tasks: Task[] } }> {
    const allTasks = await this.getAllTasks();
    
    for (const category of Object.values(allTasks)) {
      for (const task of category.tasks) {
        task.currentScore = Math.floor(Math.random() * 14) + 1;
      }
    }
    
    await writeJsonFile(TASKS_FILE, { categories: allTasks });
    return allTasks;
  }
}

// --- Servicio de Tareas Semanales ---
export class WeeklyTaskService {
  static async getWeeklyData(): Promise<{ sequence: WeeklyTask[]; dailyState: DayState }> {
    return await readJsonFile(WEEKLY_FILE, {
      sequence: [],
      dailyState: {
        date: new Date().toISOString().split('T')[0],
        currentTaskIndex: 0,
        completedTasks: [],
        dayCompleted: false,
        subtaskQueues: {}
      }
    });
  }

  static async getCurrentDayState(): Promise<DayState> {
    const data = await this.getWeeklyData();
    return data.dailyState;
  }

  static async updateDayState(dayState: DayState): Promise<void> {
    const data = await this.getWeeklyData();
    data.dailyState = dayState;
    await writeJsonFile(WEEKLY_FILE, data);
  }

  static async updateWeeklyData(weeklyData: { sequence: WeeklyTask[]; dailyState: DayState }): Promise<void> {
    await writeJsonFile(WEEKLY_FILE, weeklyData);
  }

  static async rotateListaSubtask(taskId: string): Promise<void> {
    try {
      const data = await this.getWeeklyData();
      
      // Buscar la tarea Lista
      const listaTask = data.sequence.find(task => task.id === taskId && task.name === 'Lista');
      if (!listaTask || !listaTask.subtasks) {
        console.error(`Lista task not found. TaskId: ${taskId}`);
        return; // No lanzar error, solo retornar
      }

      // Verificar que tiene subtareas
      if (!listaTask.subtasks || listaTask.subtasks.length === 0) {
        console.error('Lista task has no subtasks');
        return;
      }

      // Obtener la subtarea actual
      const currentSubtaskIndex = listaTask.subtasks.findIndex(sub => sub.id === listaTask.currentSubtaskId);
      if (currentSubtaskIndex === -1) {
        console.error(`Current subtask not found. CurrentSubtaskId: ${listaTask.currentSubtaskId}`);
        // Si no encuentra la subtarea actual, usar la primera
        listaTask.currentSubtaskId = listaTask.subtasks[0].id;
        await writeJsonFile(WEEKLY_FILE, data);
        return;
      }

      // Determinar la siguiente subtarea (rotación circular)
      let nextSubtaskIndex: number;
      if (currentSubtaskIndex === listaTask.subtasks.length - 1) {
        // Si estamos en la última subtarea, volver a la primera
        nextSubtaskIndex = 0;
      } else {
        // Ir a la siguiente subtarea
        nextSubtaskIndex = currentSubtaskIndex + 1;
      }

      // Actualizar la subtarea actual
      const oldSubtask = listaTask.subtasks[currentSubtaskIndex].name;
      const newSubtask = listaTask.subtasks[nextSubtaskIndex].name;
      listaTask.currentSubtaskId = listaTask.subtasks[nextSubtaskIndex].id;

      console.log(`🔄 LISTA ROTATION: ${oldSubtask} → ${newSubtask}`);

      // Guardar los cambios
      await writeJsonFile(WEEKLY_FILE, data);
    } catch (error) {
      console.error('Error in rotateListaSubtask:', error);
      // No relanzar el error para evitar que rompa otros endpoints
    }
  }

  static async getUnfinishedCourses(): Promise<any[]> {
    const data = await this.getWeeklyData();
    const unfinishedCourses: any[] = [];

    // Buscar en todas las tareas semanales
    for (const task of data.sequence) {
      if (task.subtasks) {
        // Buscar en subtareas principales
        for (const subtask of task.subtasks) {
          // Solo buscar cursos en las subtareas "Practicas" y "Related" de Mac
          if (subtask.subtasks && task.name === 'Mac' && 
              ['Practicas', 'Related'].includes(subtask.name)) {
            for (const nestedSubtask of subtask.subtasks) {
              // Solo incluir si no está completada
              if (!nestedSubtask.completed) {
                unfinishedCourses.push({
                  id: nestedSubtask.id,
                  name: nestedSubtask.name,
                  parentTask: task.name,
                  parentSubtask: subtask.name,
                  type: 'Course',
                  order: nestedSubtask.order || 0,
                  timeTracking: nestedSubtask.timeTracking || {
                    isActive: false,
                    totalTime: 0,
                    sessions: []
                  }
                });
              }
            }
          }
        }
      }
    }

    // Ordenar por orden si está disponible
    return unfinishedCourses.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  static async addCourseToSubtask(parentSubtaskId: string, courseName: string): Promise<void> {
    const data = await this.getWeeklyData();
    
    // Buscar la subtarea padre (Practicas o Related)
    for (const task of data.sequence) {
      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          if (subtask.id === parentSubtaskId && subtask.subtasks) {
            // Generar ID único para el nuevo curso
            const newCourseId = `${parentSubtaskId}_${courseName.toLowerCase().replace(/\s+/g, '_')}`;
            
            // Crear el nuevo curso
            const newCourse = {
              id: newCourseId,
              name: courseName,
              completed: false,
              order: subtask.subtasks.length + 1,
              movedToEnd: false,
              timeTracking: {
                isActive: false,
                totalTime: 0,
                sessions: []
              }
            };
            
            // Agregar el curso a la subtarea
            subtask.subtasks.push(newCourse);
            
            // Guardar los cambios
            await writeJsonFile(WEEKLY_FILE, data);
            return;
          }
        }
      }
    }
    
    throw new Error(`Subtarea padre ${parentSubtaskId} no encontrada`);
  }

  static async rotateMacSubtask(taskId: string, preserveStartedState: boolean = true): Promise<{ shouldCompleteTask: boolean }> {
    const data = await this.getWeeklyData();
    
    // Buscar la tarea Mac
    const macTask = data.sequence.find(task => task.id === taskId && task.name === 'Mac');
    if (!macTask || !macTask.subtasks) {
      throw new Error('Tarea Mac no encontrada');
    }

    // Preservar TODOS los estados importantes
    const wasStarted = macTask.isStarted || false;

    // Obtener la subtarea actual
    const currentSubtaskIndex = macTask.subtasks.findIndex(sub => sub.id === macTask.currentSubtaskId);
    if (currentSubtaskIndex === -1) {
      throw new Error('Subtarea actual no encontrada');
    }

    // Determinar la siguiente subtarea o si debe completarse la tarea
    if (currentSubtaskIndex === macTask.subtasks.length - 1) {
      // Si estamos en la última subtarea (Software-Echoes), completar la tarea Mac
      await writeJsonFile(WEEKLY_FILE, data);
      return { shouldCompleteTask: true };
    } else {
      // Ir a la siguiente subtarea
      const nextSubtaskIndex = currentSubtaskIndex + 1;
      macTask.currentSubtaskId = macTask.subtasks[nextSubtaskIndex].id;
    }

    // Preservar COMPLETAMENTE el estado de la tarea
    if (preserveStartedState && wasStarted) {
      macTask.isStarted = true;
    }

    // Preservar COMPLETAMENTE el estado de la tarea
    if (preserveStartedState && wasStarted) {
      macTask.isStarted = true;
    }

    // Guardar los cambios
    await writeJsonFile(WEEKLY_FILE, data);

    return { shouldCompleteTask: false };
  }

  static async getRotationSummary(): Promise<Array<{
    taskName: string;
    currentSubtask: string;
    currentTitle?: string;
    nestedSubtask?: string;
    nestedTitle?: string;
  }>> {
    const data = await this.getWeeklyData();
    const rotationSummary: Array<{
      taskName: string;
      currentSubtask: string;
      currentTitle?: string;
      nestedSubtask?: string;
      nestedTitle?: string;
    }> = [];

    // Tareas a excluir del informe
    const excludedTasks = ['Mac', 'Lista'];

    // Buscar tareas que tienen subtareas y rotación
    for (const task of data.sequence) {
      // Excluir tareas específicas
      if (excludedTasks.includes(task.name)) {
        continue;
      }

      if (task.subtasks && task.subtasks.length > 0 && task.currentSubtaskId) {
        const currentSubtask = task.subtasks.find(sub => sub.id === task.currentSubtaskId);
        
        if (currentSubtask) {
          const summaryItem: {
            taskName: string;
            currentSubtask: string;
            currentTitle?: string;
            nestedSubtask?: string;
            nestedTitle?: string;
          } = {
            taskName: task.name,
            currentSubtask: currentSubtask.name,
            currentTitle: currentSubtask.title
          };

          // Verificar si la subtarea actual tiene sus propias subtareas (como Películas dentro de Lista)
          if (currentSubtask.subtasks && currentSubtask.subtasks.length > 0 && currentSubtask.currentSubtaskId) {
            const nestedSubtask = currentSubtask.subtasks.find(nested => nested.id === currentSubtask.currentSubtaskId);
            if (nestedSubtask) {
              summaryItem.nestedSubtask = nestedSubtask.name;
              summaryItem.nestedTitle = nestedSubtask.title;
            }
          }

          rotationSummary.push(summaryItem);
        }
      }
    }

    // Agregar específicamente Películas de la tarea Lista
    const listaTask = data.sequence.find(task => task.name === 'Lista');
    if (listaTask && listaTask.subtasks) {
      const peliculasSubtask = listaTask.subtasks.find(sub => sub.name === 'Peliculas');
      if (peliculasSubtask && peliculasSubtask.subtasks && peliculasSubtask.currentSubtaskId) {
        const currentPeliculaSubtask = peliculasSubtask.subtasks.find(nested => nested.id === peliculasSubtask.currentSubtaskId);
        if (currentPeliculaSubtask) {
          rotationSummary.push({
            taskName: 'Peliculas',
            currentSubtask: currentPeliculaSubtask.name,
            currentTitle: currentPeliculaSubtask.title
          });
        }
      }
    }

    return rotationSummary;
  }

  static async getTaskStatistics(period?: 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'total'): Promise<any> {
    try {
      const data = await WeeklyTaskService.getWeeklyData();
      const historyPath = path.join(DATA_DIR, 'history.json');
      let history: any[] = [];
      
      if (fsSync.existsSync(historyPath)) {
        const historyData = await fs.readFile(historyPath, 'utf8');
        history = JSON.parse(historyData);
      }

      // Calcular estadísticas por tarea
      const taskStats: { [taskName: string]: any } = {};
      
      // Inicializar estadísticas para todas las tareas semanales
      for (const task of data.sequence) {
        taskStats[task.name] = {
          taskName: task.name,
          totalTime: 0,
          totalSessions: 0,
          averageTime: 0,
          completedDays: 0,
          timeByPeriod: {
            week: 0,
            month: 0,
            quarter: 0,
            semester: 0,
            year: 0,
            total: 0
          }
        };
      }

      // Procesar historial
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      for (const item of history) {
        const taskName = item.name || item.type;
        const completedDate = new Date(item.completedDate);
        const timeSpent = item.timeSpent || 0;

        if (!taskStats[taskName]) {
          taskStats[taskName] = {
            taskName,
            totalTime: 0,
            totalSessions: 0,
            averageTime: 0,
            completedDays: 0,
            timeByPeriod: {
              week: 0,
              month: 0,
              quarter: 0,
              semester: 0,
              year: 0,
              total: 0
            }
          };
        }

        const stats = taskStats[taskName];
        stats.totalTime += timeSpent;
        stats.totalSessions += 1;
        stats.completedDays += 1;
        stats.timeByPeriod.total += timeSpent;

        // Clasificar por período
        if (completedDate >= oneWeekAgo) {
          stats.timeByPeriod.week += timeSpent;
        }
        if (completedDate >= oneMonthAgo) {
          stats.timeByPeriod.month += timeSpent;
        }
        if (completedDate >= threeMonthsAgo) {
          stats.timeByPeriod.quarter += timeSpent;
        }
        if (completedDate >= sixMonthsAgo) {
          stats.timeByPeriod.semester += timeSpent;
        }
        if (completedDate >= oneYearAgo) {
          stats.timeByPeriod.year += timeSpent;
        }
      }

      // Calcular promedios
      for (const taskName in taskStats) {
        const stats = taskStats[taskName];
        stats.averageTime = stats.totalSessions > 0 ? stats.totalTime / stats.totalSessions : 0;
      }

      // Filtrar por período si se especifica
      if (period && period !== 'total') {
        const filteredStats: { [taskName: string]: any } = {};
        for (const taskName in taskStats) {
          const stats = taskStats[taskName];
          if (stats.timeByPeriod[period] > 0) {
            filteredStats[taskName] = {
              ...stats,
              totalTime: stats.timeByPeriod[period],
              periodTime: stats.timeByPeriod[period]
            };
          }
        }
        return Object.values(filteredStats);
      }

      return Object.values(taskStats);
    } catch (error) {
      console.error('Error getting task statistics:', error);
      return [];
    }
  }
}

// --- Servicio de Pagos ---
export class PaymentService {
  static async getAllPayments(): Promise<Payment[]> {
    const data = await readJsonFile(PAYMENTS_FILE, {}) as any;
    return data.items || [];
  }

  static async getPaymentById(paymentId: string): Promise<Payment | null> {
    const payments = await this.getAllPayments();
    return payments.find(p => p.id === paymentId) || null;
  }

  static async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const payments = await this.getAllPayments();
    
    const newPayment: Payment = {
      ...paymentData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    payments.push(newPayment);
    await writeJsonFile(PAYMENTS_FILE, { items: payments });
    return newPayment;
  }

  static async updatePayment(paymentId: string, updates: Partial<Payment>): Promise<Payment> {
    const payments = await this.getAllPayments();
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    
    if (paymentIndex === -1) {
      throw new Error('Pago no encontrado');
    }

    payments[paymentIndex] = { ...payments[paymentIndex], ...updates };
    await writeJsonFile(PAYMENTS_FILE, { items: payments });
    return payments[paymentIndex];
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    const payments = await this.getAllPayments();
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    
    if (paymentIndex === -1) return false;
    
    payments.splice(paymentIndex, 1);
    await writeJsonFile(PAYMENTS_FILE, { items: payments });
    return true;
  }

  static async executePayment(paymentId: string): Promise<{ moved: boolean; newPayment?: Payment }> {
    const payments = await this.getAllPayments();
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    
    if (paymentIndex === -1) {
      throw new Error('Pago no encontrado');
    }

    const payment = payments[paymentIndex];
    
    // Marcar como pagado
    payment.status = 'pagado';
    payment.paidDate = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();

    if (!payment.isRecurring) {
      // Si no es recurrente, mover a histórico
      await this.moveToHistory(payment);
      payments.splice(paymentIndex, 1);
      await writeJsonFile(PAYMENTS_FILE, { items: payments });
      return { moved: true };
    } else {
      // Si es recurrente, crear nuevo pago con fecha actualizada
      const newDueDate = this.calculateNextDueDate(payment.dueDate || new Date().toISOString(), payment.recurrence!);
      const newPriority = this.getRecurrencePriority(payment.recurrence!);
      
      const newPayment: Payment = {
        ...payment,
        id: uuidv4(),
        status: 'pendiente',
        dueDate: newDueDate,
        paidDate: undefined,
        priority: newPriority,
        createdAt: new Date().toISOString(),
        updatedAt: undefined
      };

      // Mover el pago actual a histórico
      await this.moveToHistory(payment);
      
      // Reemplazar con el nuevo pago
      payments[paymentIndex] = newPayment;
      await writeJsonFile(PAYMENTS_FILE, { items: payments });
      
      return { moved: false, newPayment };
    }
  }

  static async decreasePriorities(): Promise<number> {
    const payments = await this.getAllPayments();
    let updatedCount = 0;

    for (const payment of payments) {
      if (payment.priority < 10) {
        payment.priority = Math.min(10, payment.priority + 1);
        payment.updatedAt = new Date().toISOString();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await writeJsonFile(PAYMENTS_FILE, { items: payments });
    }

    return updatedCount;
  }

  private static async moveToHistory(payment: Payment): Promise<void> {
    try {
      const historyPath = path.join(DATA_DIR, 'payments-history.json');
      let history: Payment[] = [];
      
      if (fsSync.existsSync(historyPath)) {
        const data = await fs.readFile(historyPath, 'utf8');
        history = JSON.parse(data);
      }
      
      history.push({
        ...payment,
        updatedAt: new Date().toISOString()
      });
      
      await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Error moving payment to history:', error);
      throw error;
    }
  }

  private static calculateNextDueDate(currentDueDate: string, recurrence: 'mensual' | 'trimestral' | 'semestral' | 'anual'): string {
    const date = new Date(currentDueDate);
    
    switch (recurrence) {
      case 'mensual':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'trimestral':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'semestral':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'anual':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date.toISOString();
  }

  private static getRecurrencePriority(recurrence: 'mensual' | 'trimestral' | 'semestral' | 'anual'): number {
    switch (recurrence) {
      case 'mensual': return 2;    // Más frecuente = alta prioridad
      case 'trimestral': return 4;
      case 'semestral': return 6;
      case 'anual': return 10;     // Menos frecuente = baja prioridad
      default: return 5;
    }
  }

  static async getPaymentHistory(): Promise<Payment[]> {
    try {
      const historyPath = path.join(DATA_DIR, 'payments-history.json');
      if (!fsSync.existsSync(historyPath)) {
        return [];
      }
      
      const data = await fs.readFile(historyPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading payment history:', error);
      return [];
    }
  }
}

// --- Servicio de Finanzas ---
export class FinanceService {
  private static readonly PROFILE_FILE = path.join(DATA_DIR, 'financial-profile.json');
  private static readonly EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');

  static async getProfile(): Promise<FinancialProfile | null> {
    try {
      if (!fsSync.existsSync(this.PROFILE_FILE)) {
        return null;
      }
      const data = await fs.readFile(this.PROFILE_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading financial profile:', error);
      return null;
    }
  }

  static async createProfile(income: number, distributionType: 'recommended' | 'custom'): Promise<FinancialProfile> {
    const profile: FinancialProfile = {
      id: uuidv4(),
      monthlyIncome: income,
      distributionType,
      categories: this.getDefaultCategories(income, distributionType),
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(this.PROFILE_FILE, JSON.stringify(profile, null, 2));
    return profile;
  }

  static async updateProfile(updates: Partial<FinancialProfile>): Promise<FinancialProfile> {
    const currentProfile = await this.getProfile();
    if (!currentProfile) {
      throw new Error('No financial profile found');
    }

    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(this.PROFILE_FILE, JSON.stringify(updatedProfile, null, 2));
    return updatedProfile;
  }

  static async getExpenses(): Promise<Expense[]> {
    try {
      if (!fsSync.existsSync(this.EXPENSES_FILE)) {
        await fs.writeFile(this.EXPENSES_FILE, JSON.stringify([], null, 2));
        return [];
      }
      const data = await fs.readFile(this.EXPENSES_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading expenses:', error);
      return [];
    }
  }

  static async addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const expenses = await this.getExpenses();
    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    await fs.writeFile(this.EXPENSES_FILE, JSON.stringify(expenses, null, 2));
    
    // Actualizar amounts gastados en el perfil
    await this.updateSpentAmounts();
    
    return newExpense;
  }

  static async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    const expenses = await this.getExpenses();
    const expenseIndex = expenses.findIndex(e => e.id === expenseId);
    
    if (expenseIndex === -1) {
      throw new Error('Expense not found');
    }

    expenses[expenseIndex] = { ...expenses[expenseIndex], ...updates };
    await fs.writeFile(this.EXPENSES_FILE, JSON.stringify(expenses, null, 2));
    
    // Actualizar amounts gastados en el perfil
    await this.updateSpentAmounts();
    
    return expenses[expenseIndex];
  }

  static async deleteExpense(expenseId: string): Promise<boolean> {
    const expenses = await this.getExpenses();
    const expenseIndex = expenses.findIndex(e => e.id === expenseId);
    
    if (expenseIndex === -1) {
      return false;
    }

    expenses.splice(expenseIndex, 1);
    await fs.writeFile(this.EXPENSES_FILE, JSON.stringify(expenses, null, 2));
    
    // Actualizar amounts gastados en el perfil
    await this.updateSpentAmounts();
    
    return true;
  }

  static async calculateSummary(): Promise<FinancialSummary> {
    const profile = await this.getProfile();
    const expenses = await this.getExpenses();

    if (!profile) {
      throw new Error('No financial profile found');
    }

    // Calcular gastos por categoría
    const categorySpending: { [categoryId: string]: number } = {};
    expenses.forEach(expense => {
      categorySpending[expense.categoryId] = (categorySpending[expense.categoryId] || 0) + expense.amount;
    });

    const totalBudget = profile.categories.reduce((sum, cat) => sum + cat.budgetAmount, 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const categoryBreakdown = profile.categories.map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      budgeted: category.budgetAmount,
      spent: categorySpending[category.id] || 0,
      remaining: category.budgetAmount - (categorySpending[category.id] || 0),
      percentage: category.percentage
    }));

    return {
      totalIncome: profile.monthlyIncome,
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      categoryBreakdown
    };
  }

  private static async updateSpentAmounts(): Promise<void> {
    const profile = await this.getProfile();
    const expenses = await this.getExpenses();

    if (!profile) return;

    // Calcular gastos por categoría
    const categorySpending: { [categoryId: string]: number } = {};
    expenses.forEach(expense => {
      categorySpending[expense.categoryId] = (categorySpending[expense.categoryId] || 0) + expense.amount;
    });

    // Actualizar amounts gastados en las categorías
    profile.categories.forEach(category => {
      category.spentAmount = categorySpending[category.id] || 0;
    });

    profile.updatedAt = new Date().toISOString();
    await fs.writeFile(this.PROFILE_FILE, JSON.stringify(profile, null, 2));
  }

  private static getDefaultCategories(income: number, distributionType: 'recommended' | 'custom'): BudgetCategory[] {
    if (distributionType === 'recommended') {
      // Regla 50/30/20
      return [
        {
          id: uuidv4(),
          name: 'Vivienda',
          type: 'necessity',
          percentage: 25,
          budgetAmount: income * 0.25,
          spentAmount: 0,
          color: '#FF6B6B',
          description: 'Alquiler, servicios, mantenimiento'
        },
        {
          id: uuidv4(),
          name: 'Alimentación',
          type: 'necessity',
          percentage: 15,
          budgetAmount: income * 0.15,
          spentAmount: 0,
          color: '#4ECDC4',
          description: 'Mercado, restaurantes esenciales'
        },
        {
          id: uuidv4(),
          name: 'Transporte',
          type: 'necessity',
          percentage: 10,
          budgetAmount: income * 0.10,
          spentAmount: 0,
          color: '#45B7D1',
          description: 'Combustible, transporte público, mantenimiento'
        },
        {
          id: uuidv4(),
          name: 'Entretenimiento',
          type: 'want',
          percentage: 20,
          budgetAmount: income * 0.20,
          spentAmount: 0,
          color: '#F7DC6F',
          description: 'Cine, hobbies, salidas'
        },
        {
          id: uuidv4(),
          name: 'Compras Personales',
          type: 'want',
          percentage: 10,
          budgetAmount: income * 0.10,
          spentAmount: 0,
          color: '#BB8FCE',
          description: 'Ropa, tecnología, caprichos'
        },
        {
          id: uuidv4(),
          name: 'Ahorros',
          type: 'saving',
          percentage: 20,
          budgetAmount: income * 0.20,
          spentAmount: 0,
          color: '#58D68D',
          description: 'Emergencias, inversiones, metas futuras'
        }
      ];
    }
    
    // Para custom, empezar con categorías básicas
    return [
      {
        id: uuidv4(),
        name: 'Gastos Básicos',
        type: 'necessity',
        percentage: 50,
        budgetAmount: income * 0.50,
        spentAmount: 0,
        color: '#FF6B6B',
        description: 'Necesidades básicas'
      },
      {
        id: uuidv4(),
        name: 'Gastos Variables',
        type: 'want',
        percentage: 30,
        budgetAmount: income * 0.30,
        spentAmount: 0,
        color: '#F7DC6F',
        description: 'Gastos opcionales'
      },
      {
        id: uuidv4(),
        name: 'Ahorros',
        type: 'saving',
        percentage: 20,
        budgetAmount: income * 0.20,
        spentAmount: 0,
        color: '#58D68D',
        description: 'Ahorros e inversiones'
      }
    ];
  }
}

// --- Inicialización ---
ensureDirectories();

// --- Servicio de Historial ---
export class HistoryService {
  static async getHistory(): Promise<any[]> {
    try {
      const historyPath = path.join(DATA_DIR, 'history.json');
      if (!fsSync.existsSync(historyPath)) {
        await fs.writeFile(historyPath, JSON.stringify([], null, 2));
        return [];
      }
      
      const data = await fs.readFile(historyPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  }

  static async addToHistory(item: any): Promise<void> {
    try {
      const history = await this.getHistory();
      history.push({
        ...item,
        completedDate: new Date().toISOString()
      });
      
      const historyPath = path.join(DATA_DIR, 'history.json');
      await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }
}

// Exportar instancias
export const taskService = new TaskService();
export const weeklyTaskService = new WeeklyTaskService();
export const paymentService = new PaymentService();
export const historyService = new HistoryService();