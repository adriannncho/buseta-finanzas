import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import routesService, { Route, RouteFilters } from '../../services/routes.service';
import { busesService } from '../../services/buses.service';
import { usersService } from '../../services/users.service';
import { useAuthStore } from '../../stores/auth.store';
import { EyeIcon, FunnelIcon, XMarkIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import RouteCard from '../../components/cards/RouteCard';
import RouteForm from '../../components/forms/RouteForm';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function RoutesHistoryPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isWorker = user?.role === 'WORKER';
  const isAdmin = user?.role === 'ADMIN';

  const [page, setPage] = useState(1);
  const limit = 20;
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  const [filters, setFilters] = useState<RouteFilters>({
    busId: isWorker && user?.assignedBusId ? user.assignedBusId : undefined,
    workerId: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  // Query para buses
  const { data: busesData } = useQuery({
    queryKey: ['buses', { isActive: true }],
    queryFn: () => busesService.getBuses({ isActive: true, limit: 100 }),
  });

  // Query para trabajadores
  const { data: workersData } = useQuery({
    queryKey: ['workers'],
    queryFn: () => usersService.getUsers({ limit: 100 }),
  });

  const workers = workersData?.data.filter((u: any) => u.role === 'WORKER') || [];

  const { data, isLoading } = useQuery({
    queryKey: ['routes-history', filters],
    queryFn: () => routesService.getRoutes(filters),
  });

  const routes = data || [];
  
  // Paginación manual
  const totalPages = Math.ceil(routes.length / limit);
  const paginatedRoutes = routes.slice((page - 1) * limit, page * limit);

  // Mutation para eliminar ruta (solo ADMIN)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => routesService.deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes-history'] });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleFilterChange = (key: keyof RouteFilters, value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    setFilters({ ...filters, [key]: key === 'startDate' || key === 'endDate' ? value || undefined : numValue });
    setPage(1); // Reset a primera página
  };

  const clearFilters = () => {
    setFilters({
      busId: isWorker && user?.assignedBusId ? user.assignedBusId : undefined,
      workerId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setPage(1);
  };

  const hasActiveFilters = !!(
    (filters.busId && !(isWorker && user?.assignedBusId)) ||
    filters.workerId ||
    filters.startDate ||
    filters.endDate
  );

  const handleViewDetails = (route: Route) => {
    setSelectedRoute(route);
    setShowDetailsModal(true);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setShowEditModal(true);
  };

  const handleDelete = async (route: Route) => {
    setRouteToDelete(route);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!routeToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(routeToDelete.id);
      setShowDeleteModal(false);
      setRouteToDelete(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar la ruta');
    }
  };

  const handleFormSuccess = () => {
    setShowEditModal(false);
    setSelectedRoute(null);
    queryClient.invalidateQueries({ queryKey: ['routes-history'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/routes">
              <Button variant="secondary" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Historial de Rutas</h1>
          </div>
          <p className="text-gray-600 ml-28">Consulta y analiza todas las rutas registradas</p>
        </div>
        <Button
          variant={showFilters ? 'secondary' : 'primary'}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Panel de Filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Filtros de búsqueda</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {!isWorker && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus
                </label>
                <select
                  value={filters.busId}
                  onChange={(e) => handleFilterChange('busId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los buses</option>
                  {busesData?.data.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.internalCode}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isWorker && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conductor
                </label>
                <select
                  value={filters.workerId}
                  onChange={(e) => handleFilterChange('workerId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los conductores</option>
                  {workers.map((worker: any) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Rutas */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Cargando historial...</p>
        </div>
      ) : routes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No se encontraron rutas
          </h3>
          <p className="text-gray-600">
            {hasActiveFilters
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay rutas registradas en el sistema'}
          </p>
        </div>
      ) : (
        <>
          {/* Tabla */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Ruta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Bus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Conductor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Gastos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Neto
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRoutes.map((route: Route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(route.routeDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {route.routeName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.bus.internalCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.worker.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                        {formatCurrency(route.totalIncome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                        {formatCurrency(route.totalExpenses)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                        {formatCurrency(route.netIncome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(route)}
                            className="inline-flex items-center px-2 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            title="Ver detalles"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEdit(route)}
                                className="inline-flex items-center px-2 py-1 border border-yellow-300 rounded-md text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                                title="Editar"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(route)}
                                className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                title="Eliminar"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white px-6 py-4 rounded-lg shadow">
              <div className="text-sm text-gray-700">
                Mostrando página {page} de {totalPages}
                {' · '}
                {routes.length} rutas en total
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Detalles */}
      {showDetailsModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalles de la Ruta</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRoute(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <RouteCard route={selectedRoute} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <RouteForm
              route={selectedRoute}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedRoute(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRouteToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar ruta"
        message={routeToDelete ? `¿Estás seguro de eliminar la ruta "${routeToDelete.routeName}" del ${formatDate(routeToDelete.routeDate)}? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
