import api from './api';
import { CompletedItem } from '../types';

export const getHistory = async (): Promise<CompletedItem[]> => {
  const response = await api.get('/history');
  return response.data;
};
