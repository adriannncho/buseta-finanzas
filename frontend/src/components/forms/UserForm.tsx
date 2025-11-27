import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { usersService, CreateUserData, UpdateUserData } from '../../services/users.service';
import { busesService } from '../../services/buses.service';
import { useToast } from '../../contexts/ToastContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { User } from '../../types/common';

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    nationalId: '',
    password: '',
    role: 'WORKER' as 'ADMIN' | 'WORKER',
    assignedBusId: null as number | null,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar lista de buses activos
  const { data: busesData } = useQuery({
    queryKey: ['buses', { isActive: true }],
    queryFn: () => busesService.getBuses({ isActive: true, limit: 100 }),
  });

  const buses = busesData?.data || [];

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        email: user.email || '',
        nationalId: user.nationalId,
        password: '',
        role: user.role,
        assignedBusId: user.assignedBusId,
        isActive: user.isActive,
      });
    }
  }, [user]);

  // Mutation para crear
  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersService.createUser(data),
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al crear usuario';
      toast.error(message);
      setErrors({ general: message });
    },
  });

  // Mutation para actualizar
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: UpdateUserData }) =>
      usersService.updateUser(data.id, data.updates),
    onSuccess: () => {
      toast.success('Usuario actualizado exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al actualizar usuario';
      toast.error(message);
      setErrors({ general: message });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre es requerido';
    }

    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'La cédula es requerida';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (formData.password && formData.password.length > 0 && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (user) {
      // Actualizar
      const updates: UpdateUserData = {
        fullName: formData.fullName,
        email: formData.email || undefined,
        nationalId: formData.nationalId,
        role: formData.role,
        assignedBusId: formData.assignedBusId,
        isActive: formData.isActive,
      };

      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password && formData.password.trim()) {
        updates.password = formData.password;
      }

      await updateMutation.mutateAsync({ id: user.id.toString(), updates });
    } else {
      // Crear
      const data: CreateUserData = {
        fullName: formData.fullName,
        email: formData.email || undefined,
        nationalId: formData.nationalId,
        password: formData.password,
        role: formData.role,
        assignedBusId: formData.assignedBusId,
      };

      await createMutation.mutateAsync(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errors.general}
        </div>
      )}

      <Input
        label="Nombre Completo"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        error={errors.fullName}
        disabled={isLoading}
      />

      <Input
        label="Cédula"
        value={formData.nationalId}
        onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
        error={errors.nationalId}
        disabled={isLoading}
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        disabled={isLoading}
      />

      <Input
        label={user ? "Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        disabled={isLoading}
        placeholder={user ? "Dejar vacío para mantener contraseña actual" : "Mínimo 6 caracteres"}
      />

      <Select
        label="Rol"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
        options={[
          { value: 'ADMIN', label: 'Administrador' },
          { value: 'WORKER', label: 'Trabajador' },
        ]}
        disabled={isLoading}
      />

      <Select
        label="Bus Asignado"
        value={formData.assignedBusId?.toString() || ''}
        onChange={(e) => setFormData({ ...formData, assignedBusId: e.target.value ? parseInt(e.target.value) : null })}
        options={[
          { value: '', label: 'Sin asignar' },
          ...buses.map(bus => ({
            value: bus.id.toString(),
            label: `${bus.internalCode} - ${bus.plateNumber}`
          }))
        ]}
        disabled={isLoading}
      />

      {user && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            disabled={isLoading}
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Usuario activo
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {user ? 'Actualizar' : 'Crear'} Usuario
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
