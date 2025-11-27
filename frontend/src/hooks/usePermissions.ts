import { useAuthStore } from '../stores/auth.store';

export type Permission = 
  // Dashboard
  | 'dashboard.view'
  // Usuarios
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.activate'
  // Buses
  | 'buses.view'
  | 'buses.create'
  | 'buses.update'
  | 'buses.delete'
  | 'buses.activate'
  // Rutas
  | 'routes.view'
  | 'routes.create'
  | 'routes.update'
  | 'routes.delete'
  // Gastos
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.update'
  | 'expenses.delete'
  // Categorías de Gastos
  | 'expense-categories.view'
  | 'expense-categories.create'
  | 'expense-categories.update'
  | 'expense-categories.delete'
  | 'expense-categories.activate'
  // Presupuestos
  | 'budgets.view'
  | 'budgets.create'
  | 'budgets.update'
  | 'budgets.delete'
  // Items de Presupuesto
  | 'budget-items.view'
  | 'budget-items.create'
  | 'budget-items.update'
  | 'budget-items.delete'
  // Reparto de Ganancias
  | 'profit-sharing.view'
  | 'profit-sharing.create'
  | 'profit-sharing.update'
  | 'profit-sharing.delete'
  // Facturas
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.update'
  | 'invoices.delete'
  // Auditoría
  | 'audit.view';

/**
 * Mapa de permisos por rol
 */
const rolePermissions: Record<'ADMIN' | 'WORKER', Permission[]> = {
  ADMIN: [
    // ADMIN tiene todos los permisos
    'dashboard.view',
    'users.view', 'users.create', 'users.update', 'users.delete', 'users.activate',
    'buses.view', 'buses.create', 'buses.update', 'buses.delete', 'buses.activate',
    'routes.view', 'routes.create', 'routes.update', 'routes.delete',
    'expenses.view', 'expenses.create', 'expenses.update', 'expenses.delete',
    'expense-categories.view', 'expense-categories.create', 'expense-categories.update', 'expense-categories.delete', 'expense-categories.activate',
    'budgets.view', 'budgets.create', 'budgets.update', 'budgets.delete',
    'budget-items.view', 'budget-items.create', 'budget-items.update', 'budget-items.delete',
    'profit-sharing.view', 'profit-sharing.create', 'profit-sharing.update', 'profit-sharing.delete',
    'invoices.view', 'invoices.create', 'invoices.update', 'invoices.delete',
    'audit.view',
  ],
  WORKER: [
    // WORKER puede trabajar con rutas y gastos
    'dashboard.view',
    'routes.view', 'routes.create',
    'expenses.view', 'expenses.create',
    'expense-categories.view', // Solo para ver las categorías al crear gastos
    'profit-sharing.view', // Puede ver la distribución de ganancias
  ],
};

/**
 * Hook para verificar permisos del usuario actual
 */
export function usePermissions() {
  const { user } = useAuthStore();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const userPermissions = rolePermissions[user.role];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (...permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (...permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canView = (module: string): boolean => {
    return hasPermission(`${module}.view` as Permission);
  };

  const canCreate = (module: string): boolean => {
    return hasPermission(`${module}.create` as Permission);
  };

  const canUpdate = (module: string): boolean => {
    return hasPermission(`${module}.update` as Permission);
  };

  const canDelete = (module: string): boolean => {
    return hasPermission(`${module}.delete` as Permission);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    isAdmin: user?.role === 'ADMIN',
    isWorker: user?.role === 'WORKER',
  };
}
