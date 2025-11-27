import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { busesService, Bus, GetBusesParams } from '../../services/buses.service';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import BusForm from '../../components/forms/BusForm';

export default function BusesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Estados de filtros y paginación
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    busId: string | null;
    action: 'delete' | 'activate';
  }>({ isOpen: false, busId: null, action: 'delete' });

  // Query para obtener buses
  const params: GetBusesParams = {
    page,
    limit: 10,
    search: search || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['buses', params],
    queryFn: () => busesService.getBuses(params),
  });

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => busesService.deleteBus(id),
    onSuccess: () => {
      toast.success('Bus eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar bus');
    },
  });

  // Mutation para activar
  const activateMutation = useMutation({
    mutationFn: (id: string) => busesService.activateBus(id),
    onSuccess: () => {
      toast.success('Bus activado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al activar bus');
    },
  });

  const handleEdit = (bus: Bus) => {
    setSelectedBus(bus);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, busId: id, action: 'delete' });
  };

  const handleActivate = (id: string) => {
    setConfirmModal({ isOpen: true, busId: id, action: 'activate' });
  };

  const confirmAction = async () => {
    if (!confirmModal.busId) return;

    if (confirmModal.action === 'delete') {
      await deleteMutation.mutateAsync(confirmModal.busId);
    } else {
      await activateMutation.mutateAsync(confirmModal.busId);
    }
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedBus(null);
    queryClient.invalidateQueries({ queryKey: ['buses'] });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Buses</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Nuevo Bus</Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar por código, placa o descripción..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
            ]}
          />
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando buses...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">Error al cargar buses</div>
        ) : !data?.data.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron buses
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Código Interno</th>
                    <th className="text-left py-3 px-4 font-semibold">Placa</th>
                    <th className="text-left py-3 px-4 font-semibold">Descripción</th>
                    <th className="text-left py-3 px-4 font-semibold">Estado</th>
                    <th className="text-right py-3 px-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((bus) => (
                    <tr key={bus.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{bus.internalCode}</td>
                      <td className="py-3 px-4">{bus.plateNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {bus.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            bus.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {bus.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(bus)}
                          >
                            Editar
                          </Button>
                          {bus.isActive ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(bus.id)}
                              isLoading={deleteMutation.isPending}
                            >
                              Eliminar
                            </Button>
                          ) : (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleActivate(bus.id)}
                              isLoading={activateMutation.isPending}
                            >
                              Activar
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
                  Mostrando {data.data.length} de {data.pagination.total} buses
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

      {/* Modal Crear */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Bus"
      >
        <BusForm
          onSuccess={handleFormSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBus(null);
        }}
        title="Editar Bus"
      >
        <BusForm
          bus={selectedBus}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedBus(null);
          }}
        />
      </Modal>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, busId: null, action: 'delete' })}
        onConfirm={confirmAction}
        title={confirmModal.action === 'delete' ? 'Eliminar bus' : 'Activar bus'}
        message={
          confirmModal.action === 'delete'
            ? '¿Está seguro de que desea eliminar este bus? Esta acción no se puede deshacer.'
            : '¿Está seguro de que desea activar este bus?'
        }
        confirmText={confirmModal.action === 'delete' ? 'Eliminar' : 'Activar'}
        variant={confirmModal.action === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
}
