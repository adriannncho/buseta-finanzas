import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesService, ExpenseCategory } from '../../services/expenses.service';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ExpenseCategoryForm from '../../components/forms/ExpenseCategoryForm';

export default function ExpenseCategoriesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  const params = {
    page,
    limit: 20,
    search: search || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['expense-categories', params],
    queryFn: () => expensesService.getExpenseCategories(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesService.deleteExpenseCategory(id),
    onSuccess: () => {
      toast.success('Categoría eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar categoría');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => expensesService.activateExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });

  const handleEdit = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleActivate = async (id: number) => {
    await activateMutation.mutateAsync(id);
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedCategory(null);
    queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categorías de Gastos</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Nueva Categoría</Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
      </Card>

      {/* Grilla de categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Cargando categorías...
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-8 text-red-600">
            Error al cargar categorías
          </div>
        ) : !data?.data.length ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No se encontraron categorías
          </div>
        ) : (
          data.data.map((category) => (
            <Card key={category.id} className="relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    category.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {category.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
              )}
              {category._count && (
                <p className="text-xs text-muted-foreground mb-4">
                  {category._count.busExpenses} gastos registrados
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  className="flex-1"
                >
                  Editar
                </Button>
                {category.isActive ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    isLoading={deleteMutation.isPending}
                    className="flex-1"
                  >
                    Eliminar
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleActivate(category.id)}
                    isLoading={activateMutation.isPending}
                    className="flex-1"
                  >
                    Activar
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Paginación */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
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
      )}

      {/* Modales */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Categoría"
      >
        <ExpenseCategoryForm
          onSuccess={handleFormSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        title="Editar Categoría"
      >
        <ExpenseCategoryForm
          category={selectedCategory}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedCategory(null);
          }}
        />
      </Modal>
    </div>
  );
}
