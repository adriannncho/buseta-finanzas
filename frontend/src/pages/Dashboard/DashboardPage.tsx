import { useQuery } from '@tanstack/react-query';
import { busesService } from '../../services/buses.service';
import { useAuthStore } from '../../stores/auth.store';
import apiClient from '../../services/api.client';

interface MonthlyStats {
  busId: number;
  busCode: string;
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  operationalProfit: number;
  administrativeExpenses: number;
  netProfit: number;
  monthlyTarget: number;
  targetProgress: number;
  routesCount: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isWorker = user?.role === 'WORKER';
  const assignedBusId = user?.assignedBusId;

  // Obtener todos los buses activos (filtrado por assignedBusId si es worker)
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['buses-active', isWorker, assignedBusId],
    queryFn: async () => {
      if (isWorker && assignedBusId) {
        // Worker: solo obtener su bus asignado
        const bus = await busesService.getBusById(assignedBusId);
        return { data: [bus], pagination: { page: 1, limit: 1, total: 1, totalPages: 1 } };
      } else {
        // Admin: obtener todos los buses activos
        return busesService.getBuses({ isActive: true, limit: 100 });
      }
    },
  });

  // Obtener estadísticas mensuales para cada bus
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['monthly-stats', busesData?.data],
    queryFn: async () => {
      if (!busesData?.data || busesData.data.length === 0) return [];
      
      const statsPromises = busesData.data.map(async (bus) => {
        const response = await apiClient.get(`/buses/${bus.id}/monthly-stats`);
        return response.data.data as MonthlyStats;
      });
      
      return Promise.all(statsPromises);
    },
    enabled: !!busesData?.data && busesData.data.length > 0,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600 bg-green-100';
    if (progress >= 75) return 'text-blue-600 bg-blue-100';
    if (progress >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (busesLoading || statsLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
      </div>
    );
  }

  const currentDate = new Date();
  const currentMonth = getMonthName(currentDate.getMonth() + 1);
  const currentYear = currentDate.getFullYear();

  // Calcular totales globales
  const globalStats = statsData?.reduce(
    (acc, stat) => ({
      totalIncome: acc.totalIncome + stat.totalIncome,
      totalExpenses: acc.totalExpenses + stat.totalExpenses,
      operationalProfit: acc.operationalProfit + stat.operationalProfit,
      administrativeExpenses: acc.administrativeExpenses + stat.administrativeExpenses,
      netProfit: acc.netProfit + stat.netProfit,
      monthlyTarget: acc.monthlyTarget + stat.monthlyTarget,
    }),
    { totalIncome: 0, totalExpenses: 0, operationalProfit: 0, administrativeExpenses: 0, netProfit: 0, monthlyTarget: 0 }
  );

  const globalProgress = globalStats && globalStats.monthlyTarget > 0
    ? (globalStats.netProfit / globalStats.monthlyTarget) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          {isWorker ? `Mi Bus - ${currentMonth} ${currentYear}` : `Resumen de ${currentMonth} ${currentYear}`}
        </p>
      </div>

      {/* Resumen Global - Solo para Admin */}
      {!isWorker && globalStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen Global</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 min-w-0">
              <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600 truncate">
                {formatCurrency(globalStats.totalIncome)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 min-w-0">
              <p className="text-sm text-gray-600 mb-1">Gastos Totales</p>
              <p className="text-2xl font-bold text-red-600 truncate">
                {formatCurrency(globalStats.totalExpenses)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 min-w-0">
              <p className="text-sm text-gray-600 mb-1">Ganancia Neta</p>
              <p className="text-2xl font-bold text-blue-600 truncate">
                {formatCurrency(globalStats.netProfit)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 min-w-0">
              <p className="text-sm text-gray-600 mb-1">Meta Total</p>
              <p className="text-2xl font-bold text-purple-600 truncate">
                {formatCurrency(globalStats.monthlyTarget)}
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progreso</span>
                  <span>{globalProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressBarColor(globalProgress)}`}
                    style={{ width: `${Math.min(globalProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas por Bus */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isWorker ? 'Mi Bus' : 'Por Bus'}
        </h2>
        {statsData && statsData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {statsData.map((stat) => (
              <div
                key={stat.busId}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header del bus */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {stat.busCode}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {stat.routesCount} rutas este mes
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getProgressColor(stat.targetProgress)}`}>
                      {stat.targetProgress.toFixed(0)}%
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-gray-600 flex-shrink-0">Ingresos:</span>
                      <span className="font-semibold text-green-600 truncate">
                        {formatCurrency(stat.totalIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-gray-600 flex-shrink-0">Gastos:</span>
                      <span className="font-semibold text-red-600 truncate">
                        {formatCurrency(stat.totalExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 pt-3 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-900 flex-shrink-0">Ganancia Neta:</span>
                      <span className="text-lg font-bold text-blue-600 truncate">
                        {formatCurrency(stat.netProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-gray-600 flex-shrink-0">Meta Mensual:</span>
                      <span className="font-semibold text-gray-900 truncate">
                        {formatCurrency(stat.monthlyTarget)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progreso de la meta</span>
                      <span>
                        {stat.netProfit >= stat.monthlyTarget
                          ? '¡Meta alcanzada!'
                          : `Faltan ${formatCurrency(stat.monthlyTarget - stat.netProfit)}`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${getProgressBarColor(stat.targetProgress)}`}
                        style={{ width: `${Math.min(stat.targetProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No hay datos disponibles para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
}
