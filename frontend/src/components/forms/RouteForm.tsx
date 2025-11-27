import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import routesService, { Route, CreateRouteData, RouteExpense } from '../../services/routes.service';
import { busesService, Bus } from '../../services/buses.service';
import { usersService } from '../../services/users.service';
import { useAuthStore } from '../../stores/auth.store';
import { useToast } from '../../contexts/ToastContext';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface RouteFormProps {
  route?: Route | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RouteForm({ route, onSuccess, onCancel }: RouteFormProps) {
  const { user } = useAuthStore();
  const toast = useToast();
  const isEdit = !!route;

  // Query para buses
  const { data: busesResponse } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesService.getBuses({ limit: 100 }),
  });

  // Query para usuarios (trabajadores)
  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers({ limit: 100 }),
  });

  const buses = busesResponse?.data || [];
  const users = usersResponse?.data || [];
  const workers = users.filter((u: any) => u.role === 'WORKER');

  // Estados para las ciudades
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');

  // Estado del formulario
  const [formData, setFormData] = useState<CreateRouteData>({
    busId: route?.busId || 0,
    workerId: route?.workerId || 0,
    routeName: route?.routeName || '',
    routeDate: route?.routeDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    startTime: route?.startTime?.split('T')[1]?.substring(0, 5) || '',
    endTime: route?.endTime?.split('T')[1]?.substring(0, 5) || '',
    totalIncome: Number(route?.totalIncome) || 0,
    notes: route?.notes || '',
    expenses: (route?.routeExpenses || []).map(exp => ({
      ...exp,
      amount: Number(exp.amount) // Convertir a número
    })),
    isLocked: route?.isLocked ?? true,
  });

  // Efecto para auto-seleccionar bus y worker si es WORKER
  useEffect(() => {
    if (user?.role === 'WORKER' && user.assignedBusId && !route) {
      setFormData(prev => ({
        ...prev,
        busId: user.assignedBusId!,
        workerId: user.id,
      }));
    }
  }, [user, route]);

  const [newExpense, setNewExpense] = useState<RouteExpense>({
    expenseName: '',
    amount: 0,
  });

  // Inicializar ciudades desde routeName existente
  useEffect(() => {
    if (route?.routeName) {
      const parts = route.routeName.split('→').map(s => s.trim());
      if (parts.length === 2) {
        setDepartureCity(parts[0]);
        setArrivalCity(parts[1]);
      }
    }
  }, [route]);

  // Actualizar routeName cuando cambien las ciudades
  useEffect(() => {
    if (departureCity && arrivalCity) {
      setFormData(prev => ({
        ...prev,
        routeName: `${departureCity.toUpperCase()} → ${arrivalCity.toUpperCase()}`
      }));
    }
  }, [departureCity, arrivalCity]);

  // Calcular totales automáticamente
  const totalExpenses = formData.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const netIncome = Number(formData.totalIncome) - totalExpenses;

  // Mutation para crear/actualizar
  const mutation = useMutation({
    mutationFn: (data: CreateRouteData) => {
      if (isEdit && route) {
        return routesService.updateRoute(route.id, data);
      }
      return routesService.createRoute(data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Ruta actualizada exitosamente' : 'Ruta creada exitosamente');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error', error.response?.data?.error || 'Error al guardar la ruta');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.busId) {
      toast.warning('Selecciona un bus');
      return;
    }
    if (!formData.workerId) {
      toast.warning('Selecciona un conductor');
      return;
    }
    if (!departureCity.trim() || !arrivalCity.trim()) {
      toast.warning('Ingresa la ciudad de salida y llegada');
      return;
    }
    if (!formData.routeDate) {
      toast.warning('Selecciona una fecha para la ruta');
      return;
    }
    if (formData.totalIncome <= 0) {
      toast.warning('El ingreso total debe ser mayor a 0');
      return;
    }

    // Validar que la hora de fin no sea menor a la de inicio
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        toast.warning('La hora de fin debe ser mayor a la hora de inicio');
        return;
      }
    }

    // Validar que las ciudades sean diferentes
    if (departureCity.trim().toUpperCase() === arrivalCity.trim().toUpperCase()) {
      toast.warning('La ciudad de salida y llegada deben ser diferentes');
      return;
    }

    // Preparar datos para enviar
    const dataToSubmit = {
      ...formData,
      // Convertir startTime y endTime a formato datetime si existen
      startTime: formData.startTime 
        ? `${formData.routeDate}T${formData.startTime}:00.000Z`
        : undefined,
      endTime: formData.endTime 
        ? `${formData.routeDate}T${formData.endTime}:00.000Z`
        : undefined,
    };

    mutation.mutate(dataToSubmit);
  };

  const handleAddExpense = () => {
    if (!newExpense.expenseName.trim()) {
      toast.warning('Ingresa el nombre del gasto');
      return;
    }
    if (newExpense.amount <= 0) {
      toast.warning('El monto debe ser mayor a 0');
      return;
    }

    setFormData(prev => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        {
          expenseName: newExpense.expenseName.toUpperCase(),
          amount: Number(newExpense.amount), // Asegurar que sea número
        },
      ],
    }));

    // Limpiar formulario de gasto
    setNewExpense({ expenseName: '', amount: 0 });
  };

  const handleRemoveExpense = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.filter((_, i) => i !== index),
    }));
  };

  const handleExpenseNameChange = (value: string) => {
    // Convertir automáticamente a mayúsculas mientras escribe
    setNewExpense(prev => ({
      ...prev,
      expenseName: value.toUpperCase(),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Ruta' : 'Nueva Ruta'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bus *
            </label>
            <select
              value={formData.busId}
              onChange={e => setFormData({ ...formData, busId: parseInt(e.target.value) })}
              disabled={user?.role === 'WORKER'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              required
            >
              <option value={0}>Seleccionar bus</option>
              {buses.map((bus: Bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.internalCode} {bus.plateNumber && `- ${bus.plateNumber}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conductor *
            </label>
            <select
              value={formData.workerId}
              onChange={e => setFormData({ ...formData, workerId: parseInt(e.target.value) })}
              disabled={user?.role === 'WORKER'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              required
            >
              <option value={0}>Seleccionar conductor</option>
              {workers.map((worker: any) => (
                <option key={worker.id} value={worker.id}>
                  {worker.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad de Salida *
            </label>
            <input
              type="text"
              value={departureCity}
              onChange={e => setDepartureCity(e.target.value)}
              placeholder="Ej: MEDELLÍN"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad de Llegada *
            </label>
            <input
              type="text"
              value={arrivalCity}
              onChange={e => setArrivalCity(e.target.value)}
              placeholder="Ej: BOGOTÁ"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              value={formData.routeDate}
              onChange={e => setFormData({ ...formData, routeDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora Inicio
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora Fin
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Ingresos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingreso Total *
          </label>
          <input
            type="number"
            value={formData.totalIncome}
            onChange={e => setFormData({ ...formData, totalIncome: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Gastos Dinámicos */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Gastos de la Ruta</h3>
          
          {/* Agregar Nuevo Gasto */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <input
                  type="text"
                  value={newExpense.expenseName}
                  onChange={e => handleExpenseNameChange(e.target.value)}
                  placeholder="NOMBRE DEL GASTO"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                />
              </div>
              <div className="md:col-span-7 flex gap-2">
                <input
                  type="number"
                  value={newExpense.amount || ''}
                  onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Monto"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  type="button"
                  onClick={handleAddExpense}
                  size="sm"
                >
                  <PlusIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Gastos */}
          {formData.expenses.length > 0 ? (
            <div className="space-y-2">
              {formData.expenses.map((expense, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 uppercase text-sm">
                      {expense.expenseName}
                    </p>
                    <p className="text-lg font-bold text-gray-700">
                      ${expense.amount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">
              No hay gastos agregados. Usa el formulario arriba para agregar gastos.
            </p>
          )}
        </div>

        {/* Resumen Financiero */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Resumen</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Ingresos:</span>
              <span className="font-bold text-blue-900">
                ${formData.totalIncome.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Gastos:</span>
              <span className="font-bold text-blue-900">
                ${totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-lg border-t border-blue-300 pt-2">
              <span className="font-bold text-blue-900">Neto:</span>
              <span className={`font-bold ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ${netIncome.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas Adicionales
          </label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Observaciones, incidencias, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Solo ADMIN puede modificar isLocked */}
        {user?.role === 'ADMIN' && isEdit && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isLocked"
              checked={formData.isLocked}
              onChange={e => setFormData({ ...formData, isLocked: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isLocked" className="text-sm text-gray-700">
              Bloquear ruta (no se podrá editar)
            </label>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            isLoading={mutation.isPending}
            className="flex-1"
          >
            {isEdit ? 'Actualizar' : 'Crear'} Ruta
          </Button>
        </div>
      </div>
    </form>
  );
}
