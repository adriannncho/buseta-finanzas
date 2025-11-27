import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import auditService, { GetAuditLogsParams } from '../../services/audit.service';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { 
  ShieldCheckIcon, 
  UserIcon, 
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Query para obtener logs
  const params: GetAuditLogsParams = {
    page,
    limit: 20,
    action: actionFilter === 'all' ? undefined : actionFilter,
    entityType: entityFilter === 'all' ? undefined : entityFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditService.getAuditLogs(params),
  });

  // Query para estadísticas
  const { data: stats } = useQuery({
    queryKey: ['audit-stats', { startDate, endDate }],
    queryFn: () => auditService.getAuditStats({ startDate: startDate || undefined, endDate: endDate || undefined }),
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      LOGIN: 'bg-green-100 text-green-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      CREATE: 'bg-blue-100 text-blue-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      CREATE_BUS: 'bg-blue-100 text-blue-800',
      UPDATE_BUS: 'bg-yellow-100 text-yellow-800',
      DELETE_BUS: 'bg-red-100 text-red-800',
      CREATE_USER: 'bg-blue-100 text-blue-800',
      UPDATE_USER: 'bg-yellow-100 text-yellow-800',
      DELETE_USER: 'bg-red-100 text-red-800',
      CREATE_EXPENSE: 'bg-blue-100 text-blue-800',
      UPDATE_EXPENSE: 'bg-yellow-100 text-yellow-800',
      DELETE_EXPENSE: 'bg-red-100 text-red-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: 'Inicio de Sesión',
      LOGOUT: 'Cierre de Sesión',
      CREATE: 'Crear',
      UPDATE: 'Actualizar',
      DELETE: 'Eliminar',
      CREATE_BUS: 'Crear Bus',
      UPDATE_BUS: 'Actualizar Bus',
      DELETE_BUS: 'Eliminar Bus',
      CREATE_USER: 'Crear Usuario',
      UPDATE_USER: 'Actualizar Usuario',
      DELETE_USER: 'Eliminar Usuario',
      CREATE_EXPENSE: 'Crear Gasto',
      UPDATE_EXPENSE: 'Actualizar Gasto',
      DELETE_EXPENSE: 'Eliminar Gasto',
      CREATE_EXPENSE_CATEGORY: 'Crear Categoría',
      UPDATE_EXPENSE_CATEGORY: 'Actualizar Categoría',
      DELETE_EXPENSE_CATEGORY: 'Eliminar Categoría',
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Auditoría del Sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de actividades y accesos al sistema
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total de Logs</p>
                <p className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600 mb-2">Acciones Principales</p>
              <div className="space-y-1">
                {stats.byAction.slice(0, 3).map((item) => (
                  <div key={item.action} className="flex justify-between text-sm">
                    <span className="text-gray-700">{getActionLabel(item.action)}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600 mb-2">Por Entidad</p>
              <div className="space-y-1">
                {stats.byEntity.slice(0, 3).map((item) => (
                  <div key={item.entityType} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.entityType}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600 mb-2">Usuarios Más Activos</p>
              <div className="space-y-1">
                {stats.topUsers.slice(0, 3).map((user) => (
                  <div key={user.userId} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate">{user.userName}</span>
                    <span className="font-semibold">{user.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Acción"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Todas las acciones' },
              { value: 'LOGIN', label: 'Inicio de Sesión' },
              { value: 'LOGOUT', label: 'Cierre de Sesión' },
              { value: 'CREATE_USER', label: 'Crear Usuario' },
              { value: 'UPDATE_USER', label: 'Actualizar Usuario' },
              { value: 'DELETE_USER', label: 'Eliminar Usuario' },
              { value: 'CREATE_BUS', label: 'Crear Bus' },
              { value: 'UPDATE_BUS', label: 'Actualizar Bus' },
              { value: 'DELETE_BUS', label: 'Eliminar Bus' },
              { value: 'CREATE_EXPENSE', label: 'Crear Gasto' },
              { value: 'UPDATE_EXPENSE', label: 'Actualizar Gasto' },
              { value: 'DELETE_EXPENSE', label: 'Eliminar Gasto' },
            ]}
          />
          <Select
            label="Tipo de Entidad"
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Todas las entidades' },
              { value: 'SESSION', label: 'Sesiones' },
              { value: 'USER', label: 'Usuarios' },
              { value: 'Bus', label: 'Buses' },
              { value: 'BusExpense', label: 'Gastos' },
              { value: 'ExpenseCategory', label: 'Categorías' },
              { value: 'Route', label: 'Rutas' },
            ]}
          />
          <Input
            type="date"
            label="Fecha Inicio"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            label="Fecha Fin"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando logs...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">Error al cargar logs</div>
        ) : !data?.data.length ? (
          <div className="text-center py-8 text-muted-foreground">No se encontraron logs</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Fecha y Hora</th>
                    <th className="text-left py-3 px-4 font-semibold">Usuario</th>
                    <th className="text-left py-3 px-4 font-semibold">Acción</th>
                    <th className="text-left py-3 px-4 font-semibold">Entidad</th>
                    <th className="text-left py-3 px-4 font-semibold">Descripción</th>
                    <th className="text-left py-3 px-4 font-semibold">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span>{formatDateTime(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {log.actor ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">{log.actor.fullName}</div>
                              <div className="text-xs text-gray-500">
                                {log.actor.role} - {log.actor.nationalId}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sistema</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-xs text-gray-500 ml-1">#{log.entityId}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-xs text-blue-600 hover:text-blue-700">
                              Ver metadata
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-xs">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {data.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Mostrando {data.data.length} de {data.pagination.total} logs
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Página {page} de {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
