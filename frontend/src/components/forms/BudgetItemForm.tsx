import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  budgetsService,
  BudgetItem,
  CreateBudgetItemData,
  UpdateBudgetItemData,
} from '../../services/budgets.service';
import { ExpenseCategory } from '../../services/expenses.service';
import { useToast } from '../../contexts/ToastContext';

interface BudgetItemFormProps {
  budgetId: number;
  item?: BudgetItem | null;
  categories: ExpenseCategory[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BudgetItemForm({
  budgetId,
  item,
  categories,
  onSuccess,
  onCancel,
}: BudgetItemFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    categoryId: 0,
    plannedAmount: 0,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        categoryId: item.categoryId,
        plannedAmount: item.plannedAmount,
      });
    }
  }, [item]);

  const createMutation = useMutation({
    mutationFn: budgetsService.createBudgetItem,
    onSuccess: () => {
      toast.success('Item creado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: UpdateBudgetItemData }) =>
      budgetsService.updateBudgetItem(data.id, data.updates),
    onSuccess: () => {
      toast.success('Item actualizado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar item');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      toast.warning('Debe seleccionar una categoría');
      return;
    }

    if (formData.plannedAmount <= 0) {
      toast.warning('El monto planeado debe ser mayor a 0');
      return;
    }

    if (item) {
      // Update
      const updates: UpdateBudgetItemData = {
        plannedAmount: formData.plannedAmount,
      };
      updateMutation.mutate({ id: item.id, updates });
    } else {
      // Create
      const createData: CreateBudgetItemData = {
        budgetId,
        categoryId: formData.categoryId,
        plannedAmount: formData.plannedAmount,
      };
      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Filter active categories
  const activeCategories = categories.filter((cat) => cat.isActive);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Información del presupuesto */}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categoría <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.categoryId || ''}
          onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!!item} // Can't change category when editing
        >
          <option value="">Seleccione una categoría</option>
          {activeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {item && (
          <p className="mt-1 text-xs text-gray-500">
            No se puede cambiar la categoría al editar
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto Planeado <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.plannedAmount}
          onChange={(e) =>
            setFormData({
              ...formData,
              plannedAmount: parseFloat(e.target.value) || 0,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
          min="0"
          step="1000"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : item ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
