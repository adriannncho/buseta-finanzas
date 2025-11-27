import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  profitSharingService,
  ProfitSharingGroup,
  CreateProfitSharingGroupData,
  UpdateProfitSharingGroupData,
} from '../../services/profit-sharing.service';
import { busesService } from '../../services/buses.service';
import { useToast } from '../../contexts/ToastContext';

interface ProfitSharingGroupFormProps {
  group?: ProfitSharingGroup | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProfitSharingGroupForm({
  group,
  onSuccess,
  onCancel,
}: ProfitSharingGroupFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<
    CreateProfitSharingGroupData & { isActive?: boolean }
  >({
    busId: '',
    name: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch buses
  const { data: busesData } = useQuery({
    queryKey: ['buses-all'],
    queryFn: () => busesService.getBuses({ limit: 100 }),
  });

  useEffect(() => {
    if (group) {
      setFormData({
        busId: group.busId.toString(),
        name: group.name || '',
        startDate: group.startDate.split('T')[0],
        endDate: group.endDate ? group.endDate.split('T')[0] : '',
        isActive: group.isActive,
      });
    }
  }, [group]);

  const createMutation = useMutation({
    mutationFn: profitSharingService.createProfitSharingGroup,
    onSuccess: () => {
      toast.success('Grupo creado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear grupo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: UpdateProfitSharingGroupData }) =>
      profitSharingService.updateProfitSharingGroup(data.id, data.updates),
    onSuccess: () => {
      toast.success('Grupo actualizado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar grupo');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!formData.busId) {
      newErrors.busId = 'Debe seleccionar un bus';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
    }

    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (group) {
      // Update
      const updates: UpdateProfitSharingGroupData = {
        name: formData.name || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        isActive: formData.isActive,
      };
      updateMutation.mutate({ id: group.id, updates });
    } else {
      // Create
      const createData: CreateProfitSharingGroupData = {
        busId: parseInt(formData.busId),
        name: formData.name || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      };
      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Filter active buses
  const activeBuses = busesData?.data?.filter((bus) => bus.isActive) || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bus <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.busId}
          onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
          className={`w-full px-3 py-2 border ${errors.busId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          disabled={!!group} // Can't change bus when editing
        >
          <option value="">Seleccione un bus</option>
          {activeBuses.map((bus) => (
            <option key={bus.id} value={bus.id.toString()}>
              {bus.internalCode} {bus.plateNumber && `(${bus.plateNumber})`}
            </option>
          ))}
        </select>
        {errors.busId && (
          <p className="mt-1 text-sm text-red-600">{errors.busId}</p>
        )}
        {group && !errors.busId && (
          <p className="mt-1 text-xs text-gray-500">
            No se puede cambiar el bus al editar
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Grupo
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: Grupo 2024"
        />
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
            Fecha Fin
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
          {!errors.endDate && (
            <p className="mt-1 text-xs text-gray-500">
              Dejar vacío para grupo sin fecha de fin
            </p>
          )}
        </div>
      </div>

      {group && (
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Activo</span>
          </label>
        </div>
      )}

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
          {isLoading ? 'Guardando...' : group ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
