import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  expensesService,
  ExpenseCategory,
  CreateExpenseCategoryData,
  UpdateExpenseCategoryData,
} from '../../services/expenses.service';
import { useToast } from '../../contexts/ToastContext';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ExpenseCategoryFormProps {
  category?: ExpenseCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ExpenseCategoryForm({
  category,
  onSuccess,
  onCancel,
}: ExpenseCategoryFormProps) {
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive,
      });
    }
  }, [category]);

  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseCategoryData) => expensesService.createExpenseCategory(data),
    onSuccess: () => {
      toast.success('Categoría creada exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al crear categoría';
      toast.error(message);
      setErrors({ general: message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: UpdateExpenseCategoryData }) =>
      expensesService.updateExpenseCategory(data.id, data.updates),
    onSuccess: () => {
      toast.success('Categoría actualizada exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al actualizar categoría';
      toast.error(message);
      setErrors({ general: message });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (category) {
      const updates: UpdateExpenseCategoryData = {
        name: formData.name,
        description: formData.description || null,
        isActive: formData.isActive,
      };

      await updateMutation.mutateAsync({ id: category.id, updates });
    } else {
      const data: CreateExpenseCategoryData = {
        name: formData.name,
        description: formData.description || undefined,
      };

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

      <Input
        label="Nombre de la Categoría"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        disabled={isLoading}
        placeholder="Ej: Combustible, Mantenimiento, etc."
      />

      <Input
        label="Descripción"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        disabled={isLoading}
        placeholder="Opcional"
      />

      {category && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            disabled={isLoading}
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Categoría activa
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {category ? 'Actualizar' : 'Crear'} Categoría
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
