import express from 'express';
import { PaymentService } from '../services/dataService';
import { createError } from '../middleware/errorHandler';
import { ApiResponse, Payment } from '../types';

const router = express.Router();

// Función para validar URL
const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// GET /api/payments - Obtener todos los pagos y compras
router.get('/', async (req, res, next) => {
  try {
    const payments = await PaymentService.getAllPayments();
    
    const response: ApiResponse<Payment[]> = {
      success: true,
      data: payments,
      message: 'Pagos y compras obtenidos exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/:id - Obtener un pago específico
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payments = await PaymentService.getAllPayments();
    const payment = payments.find(p => p.id === id);
    
    if (!payment) {
      throw createError('Pago no encontrado', 404);
    }
    
    const response: ApiResponse<Payment> = {
      success: true,
      data: payment,
      message: 'Pago obtenido exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments - Crear nuevo pago/compra
router.post('/', async (req, res, next) => {
  try {
    const { name, url, description, category } = req.body;
    
    // Validación básica
    if (!name || name.trim() === '') {
      throw createError('El nombre es requerido', 400);
    }
    
    // Validar URL si se proporciona
    if (url && !isValidUrl(url)) {
      throw createError('La URL proporcionada no es válida', 400);
    }
    
    const paymentData = {
      name: name.trim(),
      url: url?.trim() || undefined,
      description: description?.trim() || undefined,
      category: category?.trim() || undefined
    };
    
    const newPayment = await PaymentService.createPayment(paymentData);
    
    const response: ApiResponse<Payment> = {
      success: true,
      data: newPayment,
      message: 'Pago/compra creado exitosamente'
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/payments/:id - Actualizar pago/compra
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, url, description, category } = req.body;
    
    // Validación básica
    if (name && name.trim() === '') {
      throw createError('El nombre no puede estar vacío', 400);
    }
    
    // Validar URL si se proporciona
    if (url && !isValidUrl(url)) {
      throw createError('La URL proporcionada no es válida', 400);
    }
    
    const updates: Partial<Payment> = {};
    
    if (name !== undefined) updates.name = name.trim();
    if (url !== undefined) updates.url = url.trim() || undefined;
    if (description !== undefined) updates.description = description.trim() || undefined;
    if (category !== undefined) updates.category = category.trim() || undefined;
    
    const updatedPayment = await PaymentService.updatePayment(id, updates);
    
    if (!updatedPayment) {
      throw createError('Pago no encontrado', 404);
    }
    
    const response: ApiResponse<Payment> = {
      success: true,
      data: updatedPayment,
      message: 'Pago/compra actualizado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/payments/:id - Eliminar pago/compra
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await PaymentService.deletePayment(id);
    
    if (!deleted) {
      throw createError('Pago no encontrado', 404);
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Pago/compra eliminado exitosamente'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/category/:category - Obtener pagos por categoría
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const payments = await PaymentService.getAllPayments();
    
    const filteredPayments = payments.filter(p => 
      p.category?.toLowerCase() === category.toLowerCase()
    );
    
    const response: ApiResponse<Payment[]> = {
      success: true,
      data: filteredPayments,
      message: `Pagos de la categoría ${category} obtenidos exitosamente`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/search/:query - Buscar pagos por nombre o descripción
router.get('/search/:query', async (req, res, next) => {
  try {
    const { query } = req.params;
    const payments = await PaymentService.getAllPayments();
    
    const searchResults = payments.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase()) ||
      p.category?.toLowerCase().includes(query.toLowerCase())
    );
    
    const response: ApiResponse<Payment[]> = {
      success: true,
      data: searchResults,
      message: `Resultados de búsqueda para "${query}"`
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;