import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  profitSharingService,
  ProfitSharingMember,
  CreateProfitSharingMemberData,
  UpdateProfitSharingMemberData,
  ShareRole,
} from '../../services/profit-sharing.service';
import { User } from '../../types/common';
import { useToast } from '../../contexts/ToastContext';

interface ProfitSharingMemberFormProps {
  groupId: number;
  member?: ProfitSharingMember | null;
  users: User[];
  currentTotalPercentage: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProfitSharingMemberForm({
  groupId,
  member,
  users,
  currentTotalPercentage,
  onSuccess,
  onCancel,
}: ProfitSharingMemberFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<{
    userId: number;
    roleInShare: ShareRole;
    percentage: number;
  }>({
    userId: 0,
    roleInShare: 'DRIVER',
    percentage: 0,
  });

  useEffect(() => {
    if (member) {
      setFormData({
        userId: member.userId,
        roleInShare: member.roleInShare,
        percentage: parseFloat(member.percentage.toString()),
      });
    }
  }, [member]);

  const createMutation = useMutation({
    mutationFn: profitSharingService.createProfitSharingMember,
    onSuccess: () => {
      toast.success('Miembro agregado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al agregar miembro');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: UpdateProfitSharingMemberData }) =>
      profitSharingService.updateProfitSharingMember(data.id, data.updates),
    onSuccess: () => {
      toast.success('Miembro actualizado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar miembro');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId) {
      toast.warning('Debe seleccionar un usuario');
      return;
    }

    if (formData.percentage <= 0 || formData.percentage > 100) {
      toast.warning('El porcentaje debe estar entre 0 y 100');
      return;
    }

    // Calculate if adding/updating this member would exceed 100%
    const memberCurrentPercentage = member
      ? parseFloat(member.percentage.toString())
      : 0;
    const otherMembersTotal = currentTotalPercentage - memberCurrentPercentage;
    const newTotal = otherMembersTotal + formData.percentage;

    if (newTotal > 100) {
      toast.warning(
        `La suma de porcentajes será ${newTotal.toFixed(
          1
        )}% (excede el 100%). Verifique los valores antes de continuar.`
      );
    }

    if (member) {
      // Update
      const updates: UpdateProfitSharingMemberData = {
        roleInShare: formData.roleInShare,
        percentage: formData.percentage,
      };
      updateMutation.mutate({ id: member.id, updates });
    } else {
      // Create
      const createData: CreateProfitSharingMemberData = {
        groupId,
        userId: formData.userId,
        roleInShare: formData.roleInShare,
        percentage: formData.percentage,
      };
      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Filter active users
  const activeUsers = users.filter((user) => user.isActive);

  // Calculate available percentage
  const memberCurrentPercentage = member
    ? parseFloat(member.percentage.toString())
    : 0;
  const availablePercentage = 100 - (currentTotalPercentage - memberCurrentPercentage);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Porcentaje disponible:</strong> {availablePercentage.toFixed(1)}%
        </p>
        {availablePercentage <= 0 && (
          <p className="text-sm text-red-600 mt-1">
            ¡Advertencia! El 100% ya está asignado. Ajuste otros miembros primero.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Usuario <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.userId || ''}
          onChange={(e) => setFormData({ ...formData, userId: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!!member} // Can't change user when editing
        >
          <option value="">Seleccione un usuario</option>
          {activeUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName} - {user.nationalId}
            </option>
          ))}
        </select>
        {member && (
          <p className="mt-1 text-xs text-gray-500">
            No se puede cambiar el usuario al editar
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rol en Reparto <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.roleInShare}
          onChange={(e) =>
            setFormData({ ...formData, roleInShare: e.target.value as ShareRole })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="OWNER">Propietario</option>
          <option value="DRIVER">Conductor</option>
          <option value="PARTNER">Socio</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Porcentaje <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.percentage}
          onChange={(e) =>
            setFormData({
              ...formData,
              percentage: parseFloat(e.target.value) || 0,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
          min="0"
          max="100"
          step="0.01"
        />
        {formData.percentage > availablePercentage && (
          <p className="mt-1 text-xs text-red-600">
            El porcentaje excede el disponible ({availablePercentage.toFixed(1)}%)
          </p>
        )}
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
          {isLoading ? 'Guardando...' : member ? 'Actualizar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}
