import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  profitSharingService,
  ProfitSharingMember,
} from '../../services/profit-sharing.service';
import { usersService } from '../../services/users.service';
import { useToast } from '../../contexts/ToastContext';
import ProfitSharingMemberForm from '../../components/forms/ProfitSharingMemberForm';
import Button from '../../components/ui/Button';

export default function ProfitSharingMembersPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<ProfitSharingMember | null>(
    null
  );

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['profit-sharing-group', groupId],
    queryFn: () => profitSharingService.getProfitSharingGroupById(groupId!),
    enabled: !!groupId,
  });

  // Fetch members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['profit-sharing-members', groupId],
    queryFn: () => profitSharingService.getProfitSharingMembers({ groupId }),
    enabled: !!groupId,
  });

  // Fetch users for form
  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => usersService.getUsers({ limit: 100 }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: profitSharingService.deleteProfitSharingMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-members'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-group', groupId] });
      toast.success('Miembro eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar miembro');
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (member: ProfitSharingMember) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    queryClient.invalidateQueries({ queryKey: ['profit-sharing-members'] });
    queryClient.invalidateQueries({ queryKey: ['profit-sharing-group', groupId] });
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      OWNER: 'Propietario',
      DRIVER: 'Conductor',
      PARTNER: 'Socio',
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      OWNER: 'bg-purple-100 text-purple-800',
      DRIVER: 'bg-blue-100 text-blue-800',
      PARTNER: 'bg-green-100 text-green-800',
    };
    return badges[role as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  if (groupLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-gray-600">Cargando grupo...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Grupo no encontrado</p>
        <Button
          onClick={() => navigate('/dashboard/profit-sharing')}
          className="mt-4"
        >
          Volver a Grupos
        </Button>
      </div>
    );
  }

  const totalPercentage =
    members?.reduce((sum, m) => sum + parseFloat(m.percentage.toString()), 0) || 0;
  const remaining = 100 - totalPercentage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate('/dashboard/profit-sharing')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a Grupos
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Miembros - {group.name || 'Grupo sin nombre'}
          </h1>
          <p className="text-gray-600 mt-1">
            Bus: {group.bus?.internalCode}{' '}
            {group.bus?.plateNumber && `(${group.bus.plateNumber})`}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={totalPercentage >= 100}
        >
          Agregar Miembro
        </Button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen de Distribución
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Asignado</p>
            <p
              className={`text-2xl font-bold ${
                totalPercentage === 100
                  ? 'text-green-600'
                  : totalPercentage > 100
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}
            >
              {totalPercentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Disponible</p>
            <p
              className={`text-2xl font-bold ${
                remaining < 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {remaining.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Miembros</p>
            <p className="text-2xl font-bold text-gray-900">
              {members?.length || 0}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Distribución</span>
            <span>{totalPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                totalPercentage > 100
                  ? 'bg-red-600'
                  : totalPercentage === 100
                  ? 'bg-green-600'
                  : 'bg-yellow-600'
              }`}
              style={{
                width: `${Math.min(totalPercentage, 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {totalPercentage > 100 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>¡Advertencia!</strong> La suma de porcentajes excede el 100%.
              Ajuste los valores.
            </p>
          </div>
        )}
      </div>

      {/* Members List */}
      {membersLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando miembros...</p>
        </div>
      ) : members && members.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Miembro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Identificación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Porcentaje
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.user?.fullName}
                    </div>
                    {member.user?.email && (
                      <div className="text-sm text-gray-500">{member.user.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.user?.nationalId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                        member.roleInShare
                      )}`}
                    >
                      {getRoleLabel(member.roleInShare)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {parseFloat(member.percentage.toString())}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(member)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">
            No hay miembros en este grupo de reparto
          </p>
          <Button onClick={() => setShowForm(true)}>
            Agregar Primer Miembro
          </Button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingMember ? 'Editar Miembro' : 'Nuevo Miembro'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <ProfitSharingMemberForm
                groupId={groupId!}
                member={editingMember}
                users={usersData?.data || []}
                currentTotalPercentage={totalPercentage}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseForm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
