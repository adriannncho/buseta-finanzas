import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  profitSharingService,
  ProfitSharingGroup,
  GetProfitSharingGroupsParams,
} from '../../services/profit-sharing.service';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuthStore } from '../../stores/auth.store';
import ProfitSharingGroupForm from '../../components/forms/ProfitSharingGroupForm';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function ProfitSharingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const isWorker = user?.role === 'WORKER';
  const [currentPage, setCurrentPage] = useState(1);
  const [busFilter, setBusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [editingGroup, setEditingGroup] = useState<ProfitSharingGroup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    groupId: number | null;
  }>({ isOpen: false, groupId: null });
  const [actionsMenuGroup, setActionsMenuGroup] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Query params
  const queryParams: GetProfitSharingGroupsParams = {
    page: currentPage,
    limit: 10,
    ...(busFilter && { busId: parseInt(busFilter, 10) }),
    ...(statusFilter !== 'ALL' && { isActive: statusFilter === 'true' }),
  };

  // Fetch groups
  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['profit-sharing-groups', queryParams],
    queryFn: () => profitSharingService.getProfitSharingGroups(queryParams),
  });

  // Fetch distribution for selected group
  const { data: distributionData, isLoading: distributionLoading } = useQuery({
    queryKey: ['profit-distribution', selectedGroupId],
    queryFn: () => {
      // Obtener el primer y último día del mes actual
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      return profitSharingService.getProfitDistribution(
        selectedGroupId!.toString(),
        startDate.toISOString(),
        endDate.toISOString()
      );
    },
    enabled: !!selectedGroupId,
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: profitSharingService.deleteProfitSharingGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-groups'] });
      toast.success('Grupo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar grupo');
    },
  });

  const handleDelete = (id: number) => {
    setConfirmModal({ isOpen: true, groupId: id });
  };

  const confirmDelete = () => {
    if (!confirmModal.groupId) return;
    deleteMutation.mutate(confirmModal.groupId!);
  };

  const handleEdit = (group: ProfitSharingGroup) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGroup(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    queryClient.invalidateQueries({ queryKey: ['profit-sharing-groups'] });
  };

  const handleViewMembers = (groupId: number) => {
    navigate(`/dashboard/profit-sharing/${groupId}/members`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      OWNER: 'Propietario',
      DRIVER: 'Conductor',
      PARTNER: 'Socio',
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reparto de Utilidades</h1>
        {!isWorker && (
          <Button onClick={() => setShowForm(true)}>
            Nuevo Grupo de Reparto
          </Button>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, groupId: null })}
        onConfirm={confirmDelete}
        title="Eliminar grupo de reparto"
        message="¿Está seguro de que desea eliminar este grupo de reparto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger" />

      {/* Filters */}
      {!isWorker && (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ALL' | 'true' | 'false');
                  setCurrentPage(1);
                } }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                onClick={() => {
                  setBusFilter('');
                  setStatusFilter('ALL');
                  setCurrentPage(1);
                } }
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando grupos...</p>
        </div>
      ) : groupsData?.data && groupsData.data.length > 0 ? (
        <div className="space-y-4">
          {groupsData.data.map((group) => {
            const totalPercentage = group.members?.reduce(
              (sum, m) => sum + parseFloat(m.percentage.toString()),
              0
            ) || 0;

            return (
              <React.Fragment key={group.id}>
                <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {group.name || 'Grupo sin nombre'}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${group.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'}`}
                          >
                            {group.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Bus: {group.bus?.internalCode}{' '}
                          {group.bus?.plateNumber && `(${group.bus.plateNumber})`}
                        </p>
                      </div>
                      {/* Botones de acciones - Desktop */}
                      <div className="hidden md:flex gap-2">
                        {!isWorker && (
                            <button
                              onClick={() => handleViewMembers(group.id)}
                              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                            >
                              Ver Miembros
                            </button>
                          )}
                        <button
                          onClick={() => setSelectedGroupId(
                            selectedGroupId === group.id ? null : group.id
                          )}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          {selectedGroupId === group.id ? 'Ocultar' : 'Distribución'}
                        </button>
                        {!isWorker && (
                          <>
                            <button
                              onClick={() => handleEdit(group)}
                              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(group.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>

                      {/* Botón hamburguesa - Mobile */}
                      <div className="md:hidden relative">
                        <button
                          onClick={() => setActionsMenuGroup(actionsMenuGroup === group.id ? null : group.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Período</p>
                        <p className="text-sm font-medium truncate">
                          {formatDate(group.startDate)}
                          {group.endDate && ` - ${formatDate(group.endDate)}`}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Miembros</p>
                        <p className="text-sm font-medium truncate">
                          {group._count?.members || 0}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-1">% Asignado</p>
                        <p
                          className={`text-sm font-bold truncate ${totalPercentage === 100
                              ? 'text-green-600'
                              : totalPercentage > 100
                                ? 'text-red-600'
                                : 'text-yellow-600'}`}
                        >
                          {totalPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Sin Asignar</p>
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {(100 - totalPercentage).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Members preview */}
                    {group.members && group.members.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Miembros:</p>
                        <div className="flex flex-wrap gap-2">
                          {group.members.slice(0, 5).map((member) => (
                            <span
                              key={member.id}
                              className="px-2 py-1 bg-gray-100 rounded text-xs"
                            >
                              {member.user?.fullName} - {getRoleLabel(member.roleInShare)} (
                              {parseFloat(member.percentage.toString())}%)
                            </span>
                          ))}
                          {group.members.length > 5 && (
                            <span className="px-2 py-1 text-xs text-gray-500">
                              +{group.members.length - 5} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Distribution Panel */}
                  {selectedGroupId === group.id && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      {distributionLoading ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-blue-600"></div>
                        </div>
                      ) : distributionData ? (
                        <div className="space-y-4">
                          {/* Objetivo Mensual */}
                          {group.bus && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">
                                  Objetivo Mensual - {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                                </h4>
                                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                                  Actualización en tiempo real
                                </span>
                              </div>
                              
                              {(() => {
                                const monthlyTarget = Number(group.bus.monthlyTarget || 0);
                                const currentNet = distributionData.totals.netProfit;
                                const targetProgress = monthlyTarget > 0 ? (currentNet / monthlyTarget) * 100 : 0;
                                const remaining = monthlyTarget - currentNet;
                                
                                return (
                                  <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                      <div className="bg-white p-3 rounded shadow-sm min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">Objetivo Mínimo</p>
                                        <p className="text-lg font-bold text-blue-600 truncate">
                                          {formatCurrency(monthlyTarget)}
                                        </p>
                                      </div>
                                      <div className="bg-white p-3 rounded shadow-sm min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">Utilidad Actual</p>
                                        <p className="text-lg font-bold text-green-600 truncate">
                                          {formatCurrency(currentNet)}
                                        </p>
                                      </div>
                                      <div className="bg-white p-3 rounded shadow-sm min-w-0">
                                        <p className="text-xs text-gray-500 mb-1 truncate">
                                          {remaining > 0 ? 'Por Alcanzar' : 'Superado por'}
                                        </p>
                                        <p className={`text-lg font-bold truncate ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                          {formatCurrency(Math.abs(remaining))}
                                        </p>
                                      </div>
                                      <div className="bg-white p-3 rounded shadow-sm min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">Progreso</p>
                                        <p className={`text-lg font-bold truncate ${
                                          targetProgress >= 100 ? 'text-green-600' :
                                          targetProgress >= 75 ? 'text-blue-600' :
                                          targetProgress >= 50 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                          {targetProgress.toFixed(1)}%
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Barra de progreso */}
                                    <div>
                                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Progreso del Objetivo</span>
                                        <span>{targetProgress.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                          className={`h-3 rounded-full transition-all duration-500 ${
                                            targetProgress >= 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                            targetProgress >= 75 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                            targetProgress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                            'bg-gradient-to-r from-red-500 to-red-600'
                                          }`}
                                          style={{ width: `${Math.min(targetProgress, 100)}%` }}
                                        />
                                      </div>
                                      {targetProgress > 100 && (
                                        <p className="text-xs text-green-600 mt-1 font-medium">
                                          ¡Objetivo superado! Has excedido el mínimo en {(targetProgress - 100).toFixed(1)}%
                                        </p>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Resumen del Mes Actual
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div className="bg-white p-3 rounded min-w-0">
                                <p className="text-xs text-gray-500">Ingresos</p>
                                <p className="text-lg font-bold text-green-600 truncate">
                                  {formatCurrency(distributionData.totals.totalIncome)}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded min-w-0">
                                <p className="text-xs text-gray-500">Gastos de Rutas</p>
                                <p className="text-lg font-bold text-orange-600 truncate">
                                  {formatCurrency(distributionData.totals.routeExpenses)}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded min-w-0">
                                <p className="text-xs text-gray-500">Gastos Admin</p>
                                <p className="text-lg font-bold text-red-600 truncate">
                                  {formatCurrency(distributionData.totals.administrativeExpenses)}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded border-2 border-blue-200 min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Utilidad Neta</p>
                                <p className="text-lg font-bold text-blue-600 truncate">
                                  {formatCurrency(distributionData.totals.netProfit)}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded min-w-0">
                                <p className="text-xs text-gray-500">Rutas</p>
                                <p className="text-lg font-bold text-gray-700">
                                  {distributionData.totals.routesCount}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Distribución por Miembro
                            </h4>
                            <div className="bg-white rounded overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                                      Miembro
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                                      Rol
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                                      %
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                                      Monto
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {distributionData.distribution.map((dist) => (
                                    <tr key={dist.memberId}>
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        {dist.userName}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-600">
                                        {getRoleLabel(dist.roleInShare)}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-right font-medium">
                                        {dist.percentage}%
                                      </td>
                                      <td className="px-4 py-2 text-sm text-right font-bold text-green-600">
                                        {formatCurrency(dist.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                  {distributionData.summary.unassignedPercentage > 0 && (
                                    <tr className="bg-gray-50">
                                      <td className="px-4 py-2 text-sm text-gray-600">
                                        No asignado
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-600">-</td>
                                      <td className="px-4 py-2 text-sm text-right font-medium text-gray-600">
                                        {distributionData.summary.unassignedPercentage}%
                                      </td>
                                      <td className="px-4 py-2 text-sm text-right font-medium text-gray-600">
                                        {formatCurrency(
                                          distributionData.summary.unassignedAmount
                                        )}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>)}
                </div>

                {actionsMenuGroup === group.id && (
                  <>
                    <div
                      className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
                      onClick={() => setActionsMenuGroup(null)} />
                    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 md:hidden animate-slide-up">
                      <div className="p-4">
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Acciones
                        </h3>
                        <div className="space-y-2">
                          {!isWorker && (
                            <button
                              onClick={() => {
                                handleViewMembers(group.id);
                                setActionsMenuGroup(null);
                              } }
                              className="w-full flex items-center gap-3 px-4 py-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span className="font-medium text-purple-700">Ver Miembros</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedGroupId(selectedGroupId === group.id ? null : group.id);
                              setActionsMenuGroup(null);
                            } }
                            className="w-full flex items-center gap-3 px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="font-medium text-blue-700">
                              {selectedGroupId === group.id ? 'Ocultar' : 'Ver'} Distribución
                            </span>
                          </button>
                          {!isWorker && (
                            <>
                              <button
                                onClick={() => {
                                  handleEdit(group);
                                  setActionsMenuGroup(null);
                                } }
                                className="w-full flex items-center gap-3 px-4 py-3 text-left bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                              >
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="font-medium text-yellow-700">Editar</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(group.id);
                                  setActionsMenuGroup(null);
                                } }
                                className="w-full flex items-center gap-3 px-4 py-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="font-medium text-red-700">Eliminar</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setActionsMenuGroup(null)}
                            className="w-full px-4 py-3 text-center bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No se encontraron grupos de reparto</p>
        </div>
      )}

      {/* Pagination */}
      {groupsData && groupsData.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2">
            Página {currentPage} de {groupsData.pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, groupsData.pagination.totalPages)
              )
            }
            disabled={currentPage === groupsData.pagination.totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo de Reparto'}
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
              <ProfitSharingGroupForm
                group={editingGroup}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseForm}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, groupId: null })}
        onConfirm={confirmDelete}
        title="Eliminar grupo de reparto"
        message="¿Está seguro de que desea eliminar este grupo de reparto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
