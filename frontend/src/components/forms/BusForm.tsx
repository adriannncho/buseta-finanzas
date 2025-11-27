import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { busesService, Bus, CreateBusData, UpdateBusData } from '../../services/buses.service';
import { useToast } from '../../contexts/ToastContext';
import { useAuthStore } from '../../stores/auth.store';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface BusFormProps {
  bus?: Bus | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BusForm({ bus, onSuccess, onCancel }: BusFormProps) {
  const toast = useToast();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  
  const [formData, setFormData] = useState({
    internalCode: '',
    plateNumber: '',
    description: '',
    monthlyTarget: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bus) {
      setFormData({
        internalCode: bus.internalCode,
        plateNumber: bus.plateNumber,
        description: bus.description || '',
        monthlyTarget: bus.monthlyTarget || 0,
        isActive: bus.isActive,
      });
    }
  }, [bus]);

  // Mutation para crear
  const createMutation = useMutation({
    mutationFn: (data: CreateBusData) => busesService.createBus(data),
    onSuccess: () => {
      toast.success('Bus creado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al crear bus';
      toast.error(message);
      setErrors({ general: message });
    },
  });

  // Mutation para actualizar
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: UpdateBusData }) =>
      busesService.updateBus(data.id, data.updates),
    onSuccess: () => {
      toast.success('Bus actualizado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al actualizar bus';
      toast.error(message);
      setErrors({ general: message });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.internalCode.trim()) {
      newErrors.internalCode = 'El código interno es requerido';
    }

    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = 'La placa es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (bus) {
      // Actualizar
      const updates: UpdateBusData = {
        internalCode: formData.internalCode,
        plateNumber: formData.plateNumber,
        description: formData.description || null,
        monthlyTarget: formData.monthlyTarget,
        isActive: formData.isActive,
      };

      await updateMutation.mutateAsync({ id: bus.id, updates });
    } else {
      // Crear
      const data: CreateBusData = {
        internalCode: formData.internalCode,
        plateNumber: formData.plateNumber,
        description: formData.description || undefined,
        monthlyTarget: formData.monthlyTarget,
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
        label="Código Interno"
        value={formData.internalCode}
        onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
        error={errors.internalCode}
        disabled={isLoading}
        placeholder="Ej: BUS-001"
      />

      <Input
        label="Placa"
        value={formData.plateNumber}
        onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
        error={errors.plateNumber}
        disabled={isLoading}
        placeholder="Ej: ABC-123"
      />

      <Input
        label="Descripción"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        disabled={isLoading}
        placeholder="Opcional"
      />

      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Mensual (COP)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.monthlyTarget}
            onChange={(e) => setFormData({ ...formData, monthlyTarget: parseFloat(e.target.value) || 0 })}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="0.00"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tope de ganancias netas mensuales esperadas para este bus
          </p>
        </div>
      )}

      {bus && (
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
            Bus activo
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {bus ? 'Actualizar' : 'Crear'} Bus
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
