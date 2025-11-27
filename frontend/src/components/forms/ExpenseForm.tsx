import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  expensesService,
  Expense,
  CreateExpenseData,
  UpdateExpenseData,
} from '../../services/expenses.service';
import { busesService } from '../../services/buses.service';
import { useToast } from '../../contexts/ToastContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    busId: '',
    categoryId: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0], // Fecha por defecto: hoy
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query para categorías activas
  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories', { isActive: true }],
    queryFn: () => expensesService.getExpenseCategories({ isActive: true, limit: 100 }),
  });

  // Query para buses activos
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['buses', { isActive: true }],
    queryFn: () => busesService.getBuses({ isActive: true, limit: 100 }),
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        busId: expense.busId.toString(),
        categoryId: expense.categoryId.toString(),
        amount: expense.amount.toString(),
        description: expense.description || '',
        expenseDate: expense.expenseDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    }
  }, [expense]);

  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseData) => expensesService.createExpense(data),
    onSuccess: () => {
      toast.success('Gasto creado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al crear gasto';
      toast.error(message);
      setErrors({ general: message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: UpdateExpenseData }) =>
      expensesService.updateExpense(data.id, data.updates),
    onSuccess: () => {
      toast.success('Gasto actualizado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al actualizar gasto';
      toast.error(message);
      setErrors({ general: message });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.busId) {
      newErrors.busId = 'Debes seleccionar un bus';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Debes seleccionar una categoría';
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Ingresa un monto válido mayor a 0';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Debes seleccionar una fecha';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const amount = parseFloat(formData.amount);

    if (expense) {
      const updates: UpdateExpenseData = {
        busId: parseInt(formData.busId),
        categoryId: parseInt(formData.categoryId),
        amount,
        expenseDate: formData.expenseDate,
        description: formData.description || null,
      };

      console.log('Updating expense with:', updates);
      await updateMutation.mutateAsync({ id: expense.id.toString(), updates });
    } else {
      const data: CreateExpenseData = {
        busId: parseInt(formData.busId),
        categoryId: parseInt(formData.categoryId),
        amount,
        expenseDate: formData.expenseDate,
        description: formData.description || undefined,
      };

      console.log('Creating expense with:', data);
      await createMutation.mutateAsync(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errors.general}
        </div>
      )}

      <div>
        <Select
          label="Bus"
          value={formData.busId}
          onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
          error={errors.busId}
          disabled={isLoading || busesLoading}
          options={[
            { value: '', label: busesLoading ? 'Cargando buses...' : 'Selecciona un bus' },
            ...(busesData?.data.map((bus) => ({
              value: bus.id.toString(),
              label: `${bus.internalCode} ${bus.plateNumber ? `(${bus.plateNumber})` : ''}`,
            })) || []),
          ]}
        />
        {busesData && busesData.data.length === 0 && (
          <p className="mt-1 text-sm text-yellow-600">
            No hay buses disponibles.
          </p>
        )}
      </div>

      <Select
        label="Categoría"
        value={formData.categoryId}
        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
        error={errors.categoryId}
        disabled={isLoading}
        options={[
          { value: '', label: 'Selecciona una categoría' },
          ...(categoriesData?.data.map((cat) => ({
            value: cat.id.toString(),
            label: cat.name,
          })) || []),
        ]}
      />

      <Input
        type="date"
        label="Fecha del Gasto"
        value={formData.expenseDate}
        onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
        error={errors.expenseDate}
        disabled={isLoading}
      />

      <Input
        type="number"
        label="Monto"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        error={errors.amount}
        disabled={isLoading}
        placeholder="0"
        step="0.01"
        min="0.01"
      />

      <Input
        label="Descripción"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        disabled={isLoading}
        placeholder="Opcional"
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {expense ? 'Actualizar' : 'Crear'} Gasto
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
