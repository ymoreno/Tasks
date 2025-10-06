import express from 'express';
import { HistoryService } from '../services/dataService';
import { ApiResponse } from '../types';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const history = await HistoryService.getHistory();
    
    const response: ApiResponse<typeof history> = {
      success: true,
      data: history,
      message: 'Historial obtenido exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Error obteniendo historial',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
