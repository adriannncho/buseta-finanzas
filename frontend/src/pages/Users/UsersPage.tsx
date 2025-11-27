import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../../services/users.service';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import UserForm from '../../components/forms/UserForm';
import { User } from '../../types/common';

export default function UsersPage() {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ADMIN' | 'WORKER' | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    user: User | null;
    action: 'delete' | 'activate';
  }>({ isOpen: false, user: null, action: 'delete' });

  const queryClient = useQueryClient();

  // Query para listar usuarios
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: () =>
      usersService.getUsers({
        page,
        limit: 10,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      }),
  });

  // Mutation para eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersService.deleteUser(id.toString()),
    onSuccess: () => {
      toast.success('Usuario desactivado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al desactivar usuario');
    },
  });

  // Mutation para activar usuario
  const activateMutation = useMutation({
    mutationFn: (id: number) => usersService.activateUser(id.toString()),
    onSuccess: () => {
      toast.success('Usuario activado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al activar usuario');
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setConfirmModal({ isOpen: true, user, action: 'delete' });
  };

  const handleActivate = (user: User) => {
    setConfirmModal({ isOpen: true, user, action: 'activate' });
  };

  const confirmAction = async () => {
    if (!confirmModal.user) return;

    if (confirmModal.action === 'delete') {
      await deleteMutation.mutateAsync(confirmModal.user.id);
    } else {
      await activateMutation.mutateAsync(confirmModal.user.id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          + Nuevo Usuario
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="WORKER">Trabajador</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Cargando usuarios...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error al cargar usuarios
          </div>
        )}

        {data && data.data.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            No se encontraron usuarios
          </div>
        )}

        {data && data.data.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold">Cédula</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Rol</th>
                    <th className="text-left py-3 px-4 font-semibold">Estado</th>
                    <th className="text-right py-3 px-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-background-secondary transition">
                      <td className="py-3 px-4">{user.fullName}</td>
                      <td className="py-3 px-4">{user.nationalId}</td>
                      <td className="py-3 px-4">{user.email || '-'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {user.role === 'ADMIN' ? 'Admin' : 'Trabajador'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1.5 text-sm font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
                          >
                            Editar
                          </button>
                          {user.isActive ? (
                            <button
                              onClick={() => handleDelete(user)}
                              className="px-3 py-1.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(user)}
                              className="px-3 py-1.5 text-sm font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                            >
                              Activar
                            </button>
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
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-text-secondary">
                  Mostrando {data.data.length} de {data.pagination.total} usuarios
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

      {/* Modal de formulario */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        maxWidth="md"
      >
        <UserForm user={editingUser} onSuccess={handleSuccess} onCancel={handleCloseModal} />
      </Modal>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null, action: 'delete' })}
        onConfirm={confirmAction}
        title={confirmModal.action === 'delete' ? 'Desactivar usuario' : 'Activar usuario'}
        message={
          confirmModal.action === 'delete'
            ? `¿Está seguro de que desea desactivar al usuario ${confirmModal.user?.fullName}?`
            : `¿Está seguro de que desea activar al usuario ${confirmModal.user?.fullName}?`
        }
        confirmText={confirmModal.action === 'delete' ? 'Desactivar' : 'Activar'}
        variant={confirmModal.action === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
}
