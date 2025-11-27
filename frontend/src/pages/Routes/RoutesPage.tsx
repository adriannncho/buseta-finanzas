import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import routesService, { Route, RouteFilters } from '../../services/routes.service';
import { useAuthStore } from '../../stores/auth.store';
import RouteCard from '../../components/cards/RouteCard';
import RouteForm from '../../components/forms/RouteForm';
import Button from '../../components/ui/Button';
import { PlusIcon, FunnelIcon, TruckIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function RoutesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros con fecha de hoy por defecto
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState<RouteFilters>({
    routeDate: today,
  });

  // Query para obtener rutas
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['routes', filters],
    queryFn: () => routesService.getRoutes(filters),
  });

  // Query para estadísticas
  const { data: stats } = useQuery({
    queryKey: ['route-stats', filters.busId, filters.startDate, filters.endDate],
    queryFn: () =>
      routesService.getRouteStats({
        busId: filters.busId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
  });

  // Mutation para eliminar ruta (solo ADMIN)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => routesService.deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-stats'] });
    },
  });

  const handleCreate = () => {
    setSelectedRoute(null);
    setShowForm(true);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setShowForm(true);
  };

  const handleDelete = async (route: Route) => {
    if (
      window.confirm(
        `¿Estás seguro de eliminar la ruta "${route.routeName}" del ${new Date(
          route.routeDate
        ).toLocaleDateString()}?`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(route.id);
      } catch (error: any) {
        alert(error.response?.data?.error || 'Error al eliminar la ruta');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedRoute(null);
    queryClient.invalidateQueries({ queryKey: ['routes'] });
    queryClient.invalidateQueries({ queryKey: ['route-stats'] });
  };

  const handleFilterChange = (key: keyof RouteFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({ routeDate: today });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Rutas del Día
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestión de rutas de hoy ({new Date().toLocaleDateString()})
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/dashboard/routes/history">
                <Button variant="secondary">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span className="hidden md:inline">Historial</span>
                </Button>
              </Link>
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                <span className="hidden md:inline">Filtros</span>
                {hasActiveFilters && (
                  <span className="ml-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                    {Object.values(filters).filter(v => v).length}
                  </span>
                )}
              </Button>
              <Button onClick={handleCreate}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Ruta
              </Button>
            </div>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4 min-w-0">
                <p className="text-xs text-blue-600 font-medium uppercase">
                  Total Rutas
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1 truncate">
                  {stats.totalRoutes}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 min-w-0">
                <p className="text-xs text-green-600 font-medium uppercase">
                  Ingresos
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1 truncate">
                  ${stats.totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 min-w-0">
                <p className="text-xs text-red-600 font-medium uppercase">
                  Gastos
                </p>
                <p className="text-2xl font-bold text-red-900 mt-1 truncate">
                  ${stats.totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 min-w-0">
                <p className="text-xs text-purple-600 font-medium uppercase">
                  Neto
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-1 truncate">
                  ${stats.netIncome.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Panel de Filtros */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filtros</h3>
                {hasActiveFilters && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Específica
                  </label>
                  <input
                    type="date"
                    value={filters.routeDate || ''}
                    onChange={e => handleFilterChange('routeDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={e => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={e => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Rutas */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Cargando rutas...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="flex justify-center mb-4">
              <TruckIcon className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay rutas registradas
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? 'No se encontraron rutas con los filtros aplicados'
                : 'Comienza creando tu primera ruta del día'}
            </p>
            {!hasActiveFilters && (
              <div className="flex justify-center">
                <Button onClick={handleCreate}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Crear Primera Ruta
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                onEdit={user?.role === 'ADMIN' ? handleEdit : undefined}
                onDelete={user?.role === 'ADMIN' ? handleDelete : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <RouteForm
              route={selectedRoute}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setSelectedRoute(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
