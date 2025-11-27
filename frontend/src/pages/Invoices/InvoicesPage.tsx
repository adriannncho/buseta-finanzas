import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invoicesService,
  Invoice,
  GetInvoicesParams,
} from '../../services/invoices.service';
import { useToast } from '../../contexts/ToastContext';
import InvoiceForm from '../../components/forms/InvoiceForm';
import Button from '../../components/ui/Button';

export default function InvoicesPage() {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const queryClient = useQueryClient();

  // Query params
  const queryParams: GetInvoicesParams = {
    page: currentPage,
    limit: 10,
    ...(searchTerm && { search: searchTerm }),
    ...(providerFilter && { providerName: providerFilter }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  // Fetch invoices
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', queryParams],
    queryFn: () => invoicesService.getInvoices(queryParams),
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => invoicesService.getInvoiceStats(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: invoicesService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Factura eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar factura');
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInvoice(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return '📄';
    if (mimeType.includes('pdf')) return '📑';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📄';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Facturas de Gastos</h1>
        <Button onClick={() => setShowForm(true)}>
          Nueva Factura
        </Button>
      </div>

      {/* Stats Cards */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Total Facturas</p>
            <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Este Mes</p>
            <p className="text-2xl font-bold text-blue-600">{statsData.thisMonth}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Monto Total</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(parseFloat(statsData.totalAmount.toString()))}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="# Factura o Proveedor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setProviderFilter('');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando facturas...</p>
        </div>
      ) : invoicesData?.data && invoicesData.data.length > 0 ? (
        <div className="space-y-4">
          {invoicesData.data.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getFileIcon(invoice.mimeType)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoiceNumber || 'Sin número'}
                        </h3>
                        {invoice.providerName && (
                          <p className="text-sm text-gray-600">{invoice.providerName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={invoicesService.getFileUrl(invoice.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Ver Archivo
                    </a>
                    <button
                      onClick={() => handleViewDetails(invoice)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      {selectedInvoice?.id === invoice.id ? 'Ocultar' : 'Detalles'}
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Fecha Emisión</p>
                    <p className="text-sm font-medium truncate">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Monto</p>
                    <p className="text-sm font-medium truncate">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Subido por</p>
                    <p className="text-sm font-medium truncate">
                      {invoice.uploader?.fullName || 'N/A'}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Gastos Asociados</p>
                    <p className="text-sm font-medium truncate">{invoice._count?.expenses || 0}</p>
                  </div>
                </div>
              </div>

              {/* Details Panel */}
              {selectedInvoice?.id === invoice.id && invoice.expenses && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Gastos Asociados ({invoice.expenses.length})
                  </h4>
                  {invoice.expenses.length > 0 ? (
                    <div className="bg-white rounded overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                              Categoría
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                              Descripción
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                              Reporte
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                              Monto
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {invoice.expenses.map((expense) => (
                            <tr key={expense.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {expense.category?.name || 'N/A'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {expense.description || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {expense.dailyReport?.bus?.internalCode} -{' '}
                                {formatDate(expense.dailyReport?.reportDate)}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium">
                                {formatCurrency(parseFloat(expense.amount.toString()))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No hay gastos asociados a esta factura
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No se encontraron facturas</p>
        </div>
      )}

      {/* Pagination */}
      {invoicesData && invoicesData.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2">
            Página {currentPage} de {invoicesData.pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, invoicesData.pagination.totalPages)
              )
            }
            disabled={currentPage === invoicesData.pagination.totalPages}
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
                  {editingInvoice ? 'Editar Factura' : 'Subir Factura'}
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
              <InvoiceForm
                invoice={editingInvoice}
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
