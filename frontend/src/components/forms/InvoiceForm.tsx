import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  invoicesService,
  Invoice,
  CreateInvoiceData,
  UpdateInvoiceData,
} from '../../services/invoices.service';
import { useToast } from '../../contexts/ToastContext';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<{
    invoiceNumber: string;
    providerName: string;
    issueDate: string;
    totalAmount: string;
  }>({
    invoiceNumber: '',
    providerName: '',
    issueDate: '',
    totalAmount: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber || '',
        providerName: invoice.providerName || '',
        issueDate: invoice.issueDate ? invoice.issueDate.split('T')[0] : '',
        totalAmount: invoice.totalAmount ? invoice.totalAmount.toString() : '',
      });
    }
  }, [invoice]);

  const createMutation = useMutation({
    mutationFn: invoicesService.createInvoice,
    onSuccess: () => {
      toast.success('Factura subida exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al subir factura');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: UpdateInvoiceData }) =>
      invoicesService.updateInvoice(data.id, data.updates),
    onSuccess: () => {
      toast.success('Factura actualizada exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar factura');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (invoice) {
      // Update (solo metadatos)
      const updates: UpdateInvoiceData = {
        invoiceNumber: formData.invoiceNumber || null,
        providerName: formData.providerName || null,
        issueDate: formData.issueDate || null,
        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : null,
      };
      updateMutation.mutate({ id: invoice.id, updates });
    } else {
      // Create (requiere archivo)
      if (!selectedFile) {
        toast.warning('Debe seleccionar un archivo');
        return;
      }

      const createData: CreateInvoiceData = {
        file: selectedFile,
        invoiceNumber: formData.invoiceNumber || undefined,
        providerName: formData.providerName || undefined,
        issueDate: formData.issueDate || undefined,
        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : undefined,
      };
      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!invoice && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm text-gray-600 mb-2">
              {selectedFile ? (
                <span className="font-medium text-blue-600">{selectedFile.name}</span>
              ) : (
                <>
                  Arrastra un archivo aquí o{' '}
                  <span className="text-blue-600 underline">examina</span>
                </>
              )}
            </span>
            <span className="text-xs text-gray-500">
              PDF, imágenes o documentos de Office (máx. 10MB)
            </span>
          </label>
        </div>
      )}

      {invoice && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Nota:</strong> No se puede cambiar el archivo al editar. Solo puede
            modificar los metadatos de la factura.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Factura
          </label>
          <input
            type="text"
            value={formData.invoiceNumber}
            onChange={(e) =>
              setFormData({ ...formData, invoiceNumber: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: FAC-2024-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proveedor
          </label>
          <input
            type="text"
            value={formData.providerName}
            onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nombre del proveedor"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Emisión
          </label>
          <input
            type="date"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto Total
          </label>
          <input
            type="number"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : invoice ? 'Actualizar' : 'Subir Factura'}
        </button>
      </div>
    </form>
  );
}
