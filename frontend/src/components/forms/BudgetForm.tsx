import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  budgetsService,
  Budget,
  CreateBudgetData,
  UpdateBudgetData,
} from '../../services/budgets.service';
import { busesService } from '../../services/buses.service';
import { useToast } from '../../contexts/ToastContext';

interface BudgetFormProps {
  budget?: Budget | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<CreateBudgetData>({
    name: '',
    busId: undefined,
    startDate: '',
    endDate: '',
    totalPlannedIncome: 0,
    totalPlannedExpense: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch active buses for dropdown
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['buses-active'],
    queryFn: () => busesService.getBuses({ isActive: true, limit: 100 }),
  });

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name || '',
        busId: budget.busId || undefined,
        startDate: budget.startDate ? budget.startDate.split('T')[0] : '',
        endDate: budget.endDate ? budget.endDate.split('T')[0] : '',
        totalPlannedIncome: Number(budget.totalPlannedIncome) || 0,
        totalPlannedExpense: Number(budget.totalPlannedExpense) || 0,
      });
    } else {
      setFormData({
        name: '',
        busId: undefined,
        startDate: '',
        endDate: '',
        totalPlannedIncome: 0,
        totalPlannedExpense: 0,
      });
    }
  }, [budget]);

  const createMutation = useMutation({
    mutationFn: budgetsService.createBudget,
    onSuccess: () => {
      toast.success('Presupuesto creado', 'El presupuesto se creó exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error al crear presupuesto', error.response?.data?.message || 'Ocurrió un error inesperado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: UpdateBudgetData }) =>
      budgetsService.updateBudget(data.id, data.updates),
    onSuccess: () => {
      toast.success('Presupuesto actualizado', 'El presupuesto se actualizó exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error al actualizar presupuesto', error.response?.data?.message || 'Ocurrió un error inesperado');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
    }

    // Validar endDate solo si se proporcionó
    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (budget) {
      // Update
      const updates: UpdateBudgetData = {
        name: formData.name,
        busId: formData.busId || null,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        totalPlannedIncome: formData.totalPlannedIncome,
        totalPlannedExpense: formData.totalPlannedExpense,
      };
      updateMutation.mutate({ id: budget.id, updates });
    } else {
      // Create
      const createData: CreateBudgetData = {
        name: formData.name,
        busId: formData.busId || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        totalPlannedIncome: formData.totalPlannedIncome,
        totalPlannedExpense: formData.totalPlannedExpense,
      };
      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Ej: Presupuesto Enero 2024"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bus (opcional)
        </label>
        <select
          value={formData.busId || ''}
          onChange={(e) => setFormData({ ...formData, busId: e.target.value ? parseInt(e.target.value) : undefined })}
          disabled={isLoading || busesLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Seleccione un bus (opcional)</option>
          {busesData?.data.map((bus) => (
            <option key={bus.id} value={bus.id}>
              {bus.internalCode} - {bus.plateNumber}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingreso Planeado Total
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.totalPlannedIncome}
            onChange={(e) => setFormData({ ...formData, totalPlannedIncome: parseFloat(e.target.value) || 0 })}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gasto Planeado Total
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.totalPlannedExpense}
            onChange={(e) => setFormData({ ...formData, totalPlannedExpense: parseFloat(e.target.value) || 0 })}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Inicio <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className={`w-full px-3 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Fin (opcional)
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className={`w-full px-3 py-2 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Dejar vacío si no se conoce la fecha de fin
          </p>
        </div>
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
          {isLoading ? 'Guardando...' : budget ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
