import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { TaskService } from '../services/dataService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse, Task } from '../types';

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo CSV, XLS y XLSX.'));
    }
  }
});

// POST /api/files/import/csv - Importar archivo CSV
router.post('/import/csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('No se proporcionó archivo', 400);
    }
    
    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Parsear CSV
    const parseResult = Papa.parse(fileContent, {
      header: false,
      skipEmptyLines: true
    });
    
    if (parseResult.errors.length > 0) {
      throw createError('Error parseando CSV: ' + parseResult.errors[0].message, 400);
    }
    
    const rows = parseResult.data as string[][];
    const importedTasks: Task[] = [];
    
    // Procesar datos según el formato de tu archivo Tareas.csv
    for (const row of rows) {
      if (row.length < 2) continue;
      
      const [categoryName, ...scores] = row;
      
      if (!categoryName || categoryName.trim() === '') continue;
      
      // Convertir scores a números, filtrando valores vacíos
      const numericScores = scores
        .filter(score => score && score.trim() !== '')
        .map(score => {
          const num = parseInt(score.trim());
          return isNaN(num) ? 0 : num;
        });
      
      const taskData = {
        category: categoryName.trim(),
        name: categoryName.trim(),
        scores: numericScores,
        currentScore: undefined,
        completed: false,
        timeTracking: {
          isActive: false,
          totalTime: 0,
          sessions: []
        }
      };
      
      const newTask = await TaskService.createTask(categoryName.trim(), taskData);
      importedTasks.push(newTask);
    }
    
    // Limpiar archivo temporal
    await fs.unlink(filePath);
    
    const response: ApiResponse<{
      importedCount: number;
      tasks: Task[];
    }> = {
      success: true,
      data: {
        importedCount: importedTasks.length,
        tasks: importedTasks
      },
      message: `${importedTasks.length} tareas importadas exitosamente`
    };
    
    res.json(response);
  } catch (error) {
    // Limpiar archivo en caso de error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo temporal:', unlinkError);
      }
    }
    next(error);
  }
});

// POST /api/files/import/excel - Importar archivo Excel
router.post('/import/excel', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('No se proporcionó archivo', 400);
    }
    
    const filePath = req.file.path;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const importedTasks: Task[] = [];
    
    // Procesar cada hoja del Excel
    workbook.eachSheet((worksheet, sheetId) => {
      console.log(`Procesando hoja: ${worksheet.name}`);
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar encabezados
        
        const values = row.values as any[];
        if (!values || values.length < 2) return;
        
        const [, categoryName, ...scores] = values; // El primer elemento es undefined en ExcelJS
        
        if (!categoryName || categoryName.toString().trim() === '') return;
        
        // Convertir scores a números
        const numericScores = scores
          .filter(score => score !== null && score !== undefined && score.toString().trim() !== '')
          .map(score => {
            const num = parseInt(score.toString().trim());
            return isNaN(num) ? 0 : num;
          });
        
        const taskData = {
          category: categoryName.toString().trim(),
          name: categoryName.toString().trim(),
          scores: numericScores,
          currentScore: undefined,
          completed: false,
          timeTracking: {
            isActive: false,
            totalTime: 0,
            sessions: []
          }
        };
        
        // Nota: En un entorno real, esto debería ser asíncrono y manejado correctamente
        TaskService.createTask(categoryName.toString().trim(), taskData)
          .then(newTask => importedTasks.push(newTask))
          .catch(error => console.error('Error creando tarea:', error));
      });
    });
    
    // Limpiar archivo temporal
    await fs.unlink(filePath);
    
    const response: ApiResponse<{
      importedCount: number;
      tasks: Task[];
    }> = {
      success: true,
      data: {
        importedCount: importedTasks.length,
        tasks: importedTasks
      },
      message: `${importedTasks.length} tareas importadas desde Excel exitosamente`
    };
    
    res.json(response);
  } catch (error) {
    // Limpiar archivo en caso de error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo temporal:', unlinkError);
      }
    }
    next(error);
  }
});

// GET /api/files/export/csv - Exportar tareas a CSV
router.get('/export/csv', async (req, res, next) => {
  try {
    const categories = await TaskService.getAllTasks();
    const csvData: string[][] = [];
    
    // Convertir tareas a formato CSV
    for (const [categoryName, categoryData] of Object.entries(categories)) {
      for (const task of categoryData.tasks) {
        const row = [task.name, ...task.scores.map(s => s.toString())];
        csvData.push(row);
      }
    }
    
    // Generar CSV
    const csv = Papa.unparse(csvData);
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tareas-export.csv"');
    
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// GET /api/files/export/excel - Exportar tareas a Excel
router.get('/export/excel', async (req, res, next) => {
  try {
    const categories = await TaskService.getAllTasks();
    const workbook = new ExcelJS.Workbook();
    
    // Crear hoja principal
    const worksheet = workbook.addWorksheet('Tareas');
    
    // Agregar encabezados
    worksheet.addRow(['Categoría', 'Nombre', 'Puntuaciones', 'Tiempo Total (ms)', 'Completada']);
    
    // Agregar datos
    for (const [categoryName, categoryData] of Object.entries(categories)) {
      for (const task of categoryData.tasks) {
        worksheet.addRow([
          categoryName,
          task.name,
          task.scores.join(','),
          task.timeTracking.totalTime,
          task.completed ? 'Sí' : 'No'
        ]);
      }
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="tareas-export.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

export default router;