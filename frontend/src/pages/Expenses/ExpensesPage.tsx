import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { expensesService, Expense, GetExpensesParams } from '../../services/expenses.service';
import { busesService } from '../../services/buses.service';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ExpenseForm from '../../components/forms/ExpenseForm';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [busFilter, setBusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    expenseId: string | null;
  }>({ isOpen: false, expenseId: null });

  // Query para categorías activas
  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories', { isActive: true }],
    queryFn: () => expensesService.getExpenseCategories({ isActive: true, limit: 100 }),
  });

  // Query para buses activos
  const { data: busesData } = useQuery({
    queryKey: ['buses', { isActive: true }],
    queryFn: () => expensesService.getBuses({ isActive: true, limit: 100 }),
  });

  // Query para obtener gastos
  const params: GetExpensesParams = {
    page,
    limit: 10,
    categoryId: categoryFilter === 'all' ? undefined : parseInt(categoryFilter),
    busId: busFilter ? parseInt(busFilter) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expensesService.getExpenses(params),
  });

  // Query para estadísticas
  const { data: stats } = useQuery({
    queryKey: [
      'expense-statistics',
      {
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
    ],
    queryFn: () =>
      expensesService.getExpenseStatistics({
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesService.deleteExpense(id),
    onSuccess: () => {
      toast.success('Gasto eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-statistics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar gasto');
    },
  });

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, expenseId: id });
  };

  const confirmDelete = async () => {
    if (!confirmModal.expenseId) return;
    await deleteMutation.mutateAsync(confirmModal.expenseId);
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedExpense(null);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['expense-statistics'] });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Gastos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <Link to="/dashboard/expenses/categories" className="text-primary hover:underline">
              Gestionar categorías
            </Link>
          </p>
        </div>
        {canCreate('expenses') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>Nuevo Gasto</Button>
        )}
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-sm text-muted-foreground mb-1">Total Gastos</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-muted-foreground mb-1">Promedio por Gasto</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgExpense)}</div>
          </Card>
          <Card>
            <div className="text-sm text-muted-foreground mb-1">Cantidad de Gastos</div>
            <div className="text-2xl font-bold">{stats.totalCount}</div>
          </Card>
        </div>
      )}

      {/* Gastos por categoría */}
      {stats && stats.byCategory.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-semibold mb-4">Gastos por Categoría</h3>
          <div className="space-y-2">
            {stats.byCategory.map((cat) => (
              <div key={cat.categoryId} className="flex justify-between items-center">
                <span className="text-sm">{cat.categoryName}</span>
                <div className="text-right">
                  <span className="font-semibold">{formatCurrency(cat.total)}</span>
                  <span className="text-xs text-muted-foreground ml-2">({cat.count})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Categoría"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Todas las categorías' },
              ...(categoriesData?.data.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })) || []),
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
          <Select
            label="Bus"
            value={busFilter}
            onChange={(e) => {
              setBusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todos los buses' },
              ...(busesData?.data.map((bus) => ({
                value: bus.id.toString(),
                label: `${bus.internalCode}${bus.plateNumber ? ` - ${bus.plateNumber}` : ''}`,
              })) || []),
            ]}
          />
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando gastos...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">Error al cargar gastos</div>
        ) : !data?.data.length ? (
          <div className="text-center py-8 text-muted-foreground">No se encontraron gastos</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold">Bus</th>
                    <th className="text-left py-3 px-4 font-semibold">Categoría</th>
                    <th className="text-left py-3 px-4 font-semibold">Descripción</th>
                    <th className="text-right py-3 px-4 font-semibold">Monto</th>
                    <th className="text-right py-3 px-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((expense) => (
                    <tr key={expense.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {expense.expenseDate && formatDate(expense.expenseDate)}
                      </td>
                      <td className="py-3 px-4">
                        {expense.bus && (
                          <div>
                            <div className="font-medium">
                              {expense.bus.internalCode}
                            </div>
                            {expense.bus.plateNumber && (
                              <div className="text-sm text-muted-foreground">
                                {expense.bus.plateNumber}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {expense.category?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {expense.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600 font-bold">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          {canUpdate('expenses') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(expense)}
                            >
                              Editar
                            </Button>
                          )}
                          {canDelete('expenses') && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                              isLoading={deleteMutation.isPending}
                            >
                              Eliminar
                            </Button>
                          )}
                        </div>
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
                  Mostrando {data.data.length} de {data.pagination.total} gastos
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

      {/* Modales */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Gasto"
      >
        <ExpenseForm onSuccess={handleFormSuccess} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedExpense(null);
        }}
        title="Editar Gasto"
      >
        <ExpenseForm
          expense={selectedExpense}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedExpense(null);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, expenseId: null })}
        onConfirm={confirmDelete}
        title="Eliminar gasto"
        message="¿Está seguro de que desea eliminar este gasto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
