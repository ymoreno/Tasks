import api from './api';
import { CompletedItem, ApiResponse } from '@/types';

export const getHistory = async (): Promise<CompletedItem[]> => {
  try {
    const response = await api.get<ApiResponse<CompletedItem[]>>('/history');
    return response.data.data || [];
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
};

export default {
  getHistory
};