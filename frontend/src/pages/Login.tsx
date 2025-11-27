import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '../contexts/ToastContext';

export default function Login() {
  const { isAuthenticated, login } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ nationalId?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors: { nationalId?: string; password?: string } = {};

    if (!nationalId.trim()) {
      newErrors.nationalId = 'La cédula es requerida';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    setIsLoading(true);

    try {
      await login(nationalId, password);
      toast.success('Sesión iniciada correctamente');
    } catch (err: any) {
      let errorMessage = 'Credenciales inválidas. Verifica tu cédula y contraseña.';
      
      if (err.response?.status === 401) {
        errorMessage = err.response?.data?.error?.message || 'Credenciales inválidas. Usuario o contraseña incorrectos.';
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary md:bg-background-secondary">
      <div className="max-w-md w-full min-h-screen md:min-h-0 bg-surface md:bg-transparent">
        <div className="flex flex-col justify-center min-h-screen md:min-h-0" style={{ paddingLeft: '4rem', paddingRight: '4rem' }}>
          <div className="text-center mb-8 md:px-0" style={{ paddingLeft: '0', paddingRight: '0' }}>
            <h1 className="text-3xl font-bold text-primary mb-2">Gestión de Busetas</h1>
            <p className="text-text-secondary">Inicia sesión para continuar</p>
          </div>

          <div className="md:bg-surface md:rounded-xl md:shadow-lg md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nationalId" className="block text-sm font-medium mb-2">
                Cédula
              </label>
              <input
                id="nationalId"
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.nationalId ? 'border-red-500' : 'border-border'} bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition`}
                placeholder="Ingresa tu cédula"
                disabled={isLoading}
              />
              {errors.nationalId && (
                <p className="mt-1 text-sm text-red-600">{errors.nationalId}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.password ? 'border-red-500' : 'border-border'} bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition`}
                placeholder="Ingresa tu contraseña"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-text-secondary mb-4 md:mb-0">
          Sistema de gestión financiera y operativa
        </p>
        </div>
      </div>
    </div>
  );
}
