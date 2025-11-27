import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  budgetsService,
  BudgetItem,
  CreateBudgetItemData,
} from '../../services/budgets.service';
import { expensesService } from '../../services/expenses.service';
import { useToast } from '../../contexts/ToastContext';
import BudgetItemForm from '../../components/forms/BudgetItemForm';
import Button from '../../components/ui/Button';

export default function BudgetItemsPage() {
  const { budgetId } = useParams<{ budgetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Fetch budget details
  const { data: budget, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => budgetsService.getBudgetById(budgetId!),
    enabled: !!budgetId,
  });

  // Fetch budget items
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['budget-items', budgetId],
    queryFn: () => budgetsService.getBudgetItems({ budgetId }),
    enabled: !!budgetId,
  });

  // Fetch expense categories
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesService.getExpenseCategories(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: budgetsService.deleteBudgetItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      toast.success('Item eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar item');
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    queryClient.invalidateQueries({ queryKey: ['budget-items'] });
    queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
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

  if (budgetLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-gray-600">Cargando presupuesto...</p>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Presupuesto no encontrado</p>
        <Button
          onClick={() => navigate('/dashboard/budgets')}
          className="mt-4"
        >
          Volver a Presupuestos
        </Button>
      </div>
    );
  }

  const totalAllocated = items?.reduce((sum, item) => sum + item.allocatedAmount, 0) || 0;
  const remaining = budget.totalBudget - totalAllocated;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate('/dashboard/budgets')}
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
            Volver a Presupuestos
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{budget.name}</h1>
          {budget.description && (
            <p className="text-gray-600 mt-1">{budget.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Período: {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          Agregar Categoría
        </Button>
      </div>

      {/* Budget Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen del Presupuesto
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Presupuesto Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(budget.totalBudget)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Asignado</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalAllocated)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Disponible</p>
            <p
              className={`text-2xl font-bold ${
                remaining < 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {formatCurrency(remaining)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Gastado Real</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(budget.totalSpent || 0)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Asignación</span>
            <span>
              {totalAllocated > 0
                ? ((totalAllocated / budget.totalBudget) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                totalAllocated > budget.totalBudget
                  ? 'bg-red-600'
                  : totalAllocated > budget.totalBudget * 0.9
                  ? 'bg-yellow-600'
                  : 'bg-blue-600'
              }`}
              style={{
                width: `${Math.min((totalAllocated / budget.totalBudget) * 100, 100)}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Items List */}
      {itemsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando items...</p>
        </div>
      ) : items && items.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Monto Asignado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  % del Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => {
                const percentage =
                  budget.totalBudget > 0
                    ? (item.allocatedAmount / budget.totalBudget) * 100
                    : 0;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.category?.name || 'Sin categoría'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {item.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.allocatedAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-600">
                        {percentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">
            No hay categorías asignadas a este presupuesto
          </p>
          <Button onClick={() => setShowForm(true)}>
            Agregar Primera Categoría
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
                  {editingItem ? 'Editar Item' : 'Nuevo Item'}
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
              <BudgetItemForm
                budgetId={budgetId!}
                item={editingItem}
                categories={categories || []}
                budget={budget}
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
