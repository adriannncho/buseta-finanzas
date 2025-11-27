import { Route } from '../../services/routes.service';
import { 
  PencilIcon, 
  TrashIcon, 
  LockClosedIcon, 
  LockOpenIcon, 
  CalendarIcon, 
  TruckIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';

interface RouteCardProps {
  route: Route;
  onEdit?: (route: Route) => void;
  onDelete?: (route: Route) => void;
}

export default function RouteCard({ route, onEdit, onDelete }: RouteCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const profitPercentage = route.totalIncome > 0
    ? ((route.netIncome / route.totalIncome) * 100).toFixed(1)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-900 truncate">
                {route.routeName}
              </h3>
              {route.isLocked ? (
                <LockClosedIcon className="h-4 w-4 text-yellow-600 flex-shrink-0" title="Bloqueada" />
              ) : (
                <LockOpenIcon className="h-4 w-4 text-green-600 flex-shrink-0" title="Desbloqueada" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(route.routeDate)}</span>
            </div>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-1 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(route)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(route)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bus y Conductor */}
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <TruckIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium">{route.bus.internalCode}</span>
            {route.bus.plateNumber && (
              <span className="text-gray-500">• {route.bus.plateNumber}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <UserIcon className="h-5 w-5 text-green-600" />
            <span>{route.worker.fullName}</span>
          </div>
        </div>

        {/* Horario */}
        {(route.startTime || route.endTime) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            {route.startTime && <span>🕐 {formatTime(route.startTime)}</span>}
            {route.startTime && route.endTime && <span>→</span>}
            {route.endTime && <span>{formatTime(route.endTime)}</span>}
          </div>
        )}
      </div>

      {/* Financiero */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-600 font-medium uppercase mb-1">Ingresos</p>
            <p className="text-sm font-bold text-green-700">
              {formatCurrency(route.totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium uppercase mb-1">Gastos</p>
            <p className="text-sm font-bold text-red-700">
              {formatCurrency(route.totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium uppercase mb-1">Neto</p>
            <p className="text-sm font-bold text-blue-700">
              {formatCurrency(route.netIncome)}
            </p>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all ${
              Number(profitPercentage) >= 50
                ? 'bg-green-500'
                : Number(profitPercentage) >= 25
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(Number(profitPercentage), 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 text-right mt-1">
          Margen: {profitPercentage}%
        </p>
      </div>

      {/* Gastos Detallados */}
      {route.routeExpenses.length > 0 && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 uppercase mb-2">
            Gastos ({route.routeExpenses.length})
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {route.routeExpenses.map((expense, index) => (
              <div
                key={expense.id || index}
                className="flex items-center justify-between text-sm py-1"
              >
                <span className="text-gray-700 text-xs uppercase font-medium">
                  {expense.expenseName}
                </span>
                <span className="text-gray-900 font-semibold">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {route.notes && (
        <div className="p-4 border-t border-gray-100 bg-yellow-50">
          <p className="text-xs font-semibold text-gray-700 uppercase mb-1">Notas</p>
          <p className="text-sm text-gray-700 line-clamp-2">{route.notes}</p>
        </div>
      )}
    </div>
  );
}
