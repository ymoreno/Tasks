import express from 'express';
import { HistoryService } from '../services/dataService';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const history = await HistoryService.getHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error });
  }
});

export default router;
