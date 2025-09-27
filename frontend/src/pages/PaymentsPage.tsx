import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  TextField, 
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Add, Search, Edit, Delete, Launch, Home, Star, PlayArrow } from '@mui/icons-material';
import { usePaymentContext } from '@/contexts/PaymentContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SpaceSelector from '@/components/payments/SpaceSelector';
import { Payment, SpaceType } from '@/types';
import { spaceService } from '@/services/spaceService';

const PaymentsPage: React.FC = () => {
  const { payments, loading, error, fetchPayments, createPayment, updatePayment, deletePayment } = usePaymentContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: '',
    space: undefined as SpaceType | undefined,
    priority: 5,
    isRecurring: false,
    recurrence: 'mensual' as 'mensual' | 'trimestral' | 'anual',
    dueDate: '',
  });

  // Cargar pagos al montar el componente
  useEffect(() => {
    fetchPayments();
  }, []);

  // Filtrar pagos por búsqueda
  const filteredPayments = payments.filter(payment =>
    payment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular estadísticas y item de mayor prioridad
  const { highestPriorityPayment, ...stats } = useMemo(() => {
    if (payments.length === 0) {
      return {
        highestPriorityPayment: null,
        totalPayments: 0,
        paymentsWithUrl: 0,
        paymentsWithoutUrl: 0,
        categories: [],
      };
    }

    const totalPayments = payments.length;
    const paymentsWithUrl = payments.filter(p => p.url).length;
    const paymentsWithoutUrl = totalPayments - paymentsWithUrl;
    const categories = [...new Set(payments.map(p => p.category).filter(Boolean))];
    
    const sortedPayments = [...payments].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) {
        return -1;
      }
      if (b.dueDate) {
        return 1;
      }
      return 0;
    });

    return { highestPriorityPayment: sortedPayments[0], totalPayments, paymentsWithUrl, paymentsWithoutUrl, categories };
  }, [payments]);


  // Funciones del diálogo
  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        name: payment.name,
        url: payment.url || '',
        description: payment.description || '',
        category: payment.category || '',
        space: payment.space,
        priority: payment.priority || 5,
        isRecurring: payment.isRecurring || false,
        recurrence: payment.recurrence || 'mensual',
        dueDate: payment.dueDate || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        name: '',
        url: '',
        description: '',
        category: '',
        space: undefined,
        priority: 5,
        isRecurring: false,
        recurrence: 'mensual',
        dueDate: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPayment(null);
    setFormData({
      name: '',
      url: '',
      description: '',
      category: '',
      space: undefined,
      priority: 5,
      isRecurring: false,
      recurrence: 'mensual',
      dueDate: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      const paymentData: Partial<Payment> = {
        name: formData.name.trim(),
        url: formData.url.trim() || undefined,
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        space: formData.space,
        priority: formData.priority,
        isRecurring: formData.isRecurring,
        recurrence: formData.isRecurring ? formData.recurrence : undefined,
        dueDate: formData.dueDate || undefined,
      };

      if (editingPayment) {
        await updatePayment(editingPayment.id, paymentData);
      } else {
        await createPayment(paymentData as Omit<Payment, 'id' | 'createdAt'>);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error guardando pago:', error);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este item?')) {
      try {
        await deletePayment(paymentId);
      } catch (error) {
        console.error('Error eliminando pago:', error);
      }
    }
  };

  const handleExecute = async (payment: Payment) => {
    if (!payment.isRecurring) {
      await updatePayment(payment.id, { status: 'pagado' });
      return;
    }

    const newDueDate = new Date(payment.dueDate || Date.now());
    if (payment.recurrence === 'mensual') {
      newDueDate.setMonth(newDueDate.getMonth() + 1);
    } else if (payment.recurrence === 'trimestral') {
      newDueDate.setMonth(newDueDate.getMonth() + 3);
    } else if (payment.recurrence === 'anual') {
      newDueDate.setFullYear(newDueDate.getFullYear() + 1);
    }

    await updatePayment(payment.id, { dueDate: newDueDate.toISOString().split('T')[0] });
  };

  if (loading) {
    return <LoadingSpinner message="Cargando pagos y compras..." />;
  }

  return (
    <Box>
      {/* Header de la página */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
          Pagos y Compras
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Agregar Item
        </Button>
      </Box>

      {/* Mostrar errores */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Barra de búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre, descripción o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Contenido principal */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Lista de Pagos y Compras ({filteredPayments.length} items)
            </Typography>
            
            {/* Lista de pagos */}
            <Grid container spacing={2}>
              {filteredPayments.map((payment) => (
                <Grid item xs={12} sm={6} key={payment.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {payment.name}
                      </Typography>
                      {payment.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {payment.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {payment.category && (
                          <Chip label={payment.category} size="small" />
                        )}
                        {payment.space && (
                          <Chip 
                            icon={<Home />}
                            label={spaceService.getSpaceName(payment.space)} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        )}
                         <Chip label={`Prioridad: ${payment.priority}`} size="small" />
                         {payment.isRecurring && <Chip label={payment.recurrence} size="small" />}
                      </Box>
                      {payment.url && (
                        <Box sx={{ mt: 1 }}>
                          <Link 
                            href={payment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <Launch fontSize="small" />
                            Ver producto
                          </Link>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<Edit />}
                        onClick={() => handleOpenDialog(payment)}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<Delete />}
                        color="error"
                        onClick={() => handleDelete(payment.id)}
                      >
                        Eliminar
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredPayments.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {searchTerm ? 'No se encontraron items que coincidan con la búsqueda.' : 'No hay items de pagos y compras. Haz clic en "Agregar Item" para crear uno.'}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {highestPriorityPayment && (
            <Paper sx={{ p: 3, mb: 2, border: '2px solid', borderColor: 'primary.main' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
                <Star sx={{ color: 'warning.main' }} />
                Mayor Prioridad
              </Typography>
              <Typography variant="h5" component="div" gutterBottom>
                {highestPriorityPayment.name}
              </Typography>
              <Chip label={`Prioridad: ${highestPriorityPayment.priority}`} color="primary" sx={{ mb: 1 }} />
              {highestPriorityPayment.description && (
                <Typography variant="body2" color="text.secondary">
                  {highestPriorityPayment.description}
                </Typography>
              )}
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<PlayArrow />}
                  onClick={() => handleExecute(highestPriorityPayment)}
                  variant="contained"
                >
                  Ejecutar
                </Button>
              </CardActions>
            </Paper>
          )}

          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estadísticas
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              📊 Total de items: <strong>{stats.totalPayments}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              🔗 Con URL: <strong>{stats.paymentsWithUrl}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              📝 Sin URL: <strong>{stats.paymentsWithoutUrl}</strong>
            </Typography>
            <Typography variant="body2">
              📁 Categorías: <strong>{stats.categories.length}</strong>
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Categorías
            </Typography>
            {stats.categories.length > 0 ? (
              stats.categories.map((category) => (
                <Typography key={category} variant="body2" sx={{ mb: 0.5 }}>
                  • {category} ({payments.filter(p => p.category === category).length} items)
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay categorías definidas aún.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para crear/editar */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPayment ? 'Editar Item' : 'Agregar Nuevo Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre *"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="URL del producto"
            fullWidth
            variant="outlined"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Categoría"
            fullWidth
            variant="outlined"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Prioridad</InputLabel>
            <Select
              value={formData.priority}
              label="Prioridad"
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as number })}
            >
              <MenuItem value={1}>1 (Alta)</MenuItem>
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={3}>3</MenuItem>
              <MenuItem value={4}>4</MenuItem>
              <MenuItem value={5}>5 (Baja)</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox checked={formData.isRecurring} onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })} />}
            label="Es recurrente"
            sx={{ mb: 2 }}
          />
          {formData.isRecurring && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Recurrencia</InputLabel>
                <Select
                  value={formData.recurrence}
                  label="Recurrencia"
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as any })}
                >
                  <MenuItem value="mensual">Mensual</MenuItem>
                  <MenuItem value="trimestral">Trimestral</MenuItem>
                  <MenuItem value="anual">Anual</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Fecha de vencimiento"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                sx={{ mb: 2 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </>
          )}
          <SpaceSelector
            value={formData.space}
            onChange={(space) => setFormData({ ...formData, space })}
            label="Espacio asociado"
            showGrouped={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingPayment ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PaymentsPage;