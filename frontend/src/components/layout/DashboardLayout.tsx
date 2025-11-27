import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { usePermissions } from '../../hooks/usePermissions';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const { canView } = usePermissions();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number } | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    setIsUserMenuOpen(false);
    await logout();
  };

  const openLogoutModal = () => {
    setShowLogoutModal(true);
    setIsUserMenuOpen(false);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMouseEnter = (e: React.MouseEvent, path: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({ top: rect.top + rect.height / 2 });
    setActiveTooltip(path);
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Inicio', 
      module: 'dashboard',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    },
    { 
      path: '/dashboard/routes', 
      label: 'Rutas', 
      module: 'routes',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
    },
    { 
      path: '/dashboard/users', 
      label: 'Usuarios', 
      module: 'users',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    },
    { 
      path: '/dashboard/buses', 
      label: 'Buses', 
      module: 'buses',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    },
    { 
      path: '/dashboard/expenses', 
      label: 'Gastos', 
      module: 'expenses',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    },
    { 
      path: '/dashboard/budgets', 
      label: 'Presupuestos', 
      module: 'budgets',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    { 
      path: '/dashboard/profit-sharing', 
      label: 'Reparto de Ganancias', 
      module: 'profit-sharing',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    { 
      path: '/dashboard/audit', 
      label: 'Auditoría', 
      module: 'audit',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    },
  ];

  return (
    <div className="flex h-screen bg-background-secondary">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-surface border-r border-border flex flex-col transform transition-all duration-300 ease-in-out overflow-visible ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${isSidebarCollapsed ? 'lg:w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className={`border-b border-border flex items-center ${isSidebarCollapsed ? 'justify-center h-[77px]' : 'justify-between p-6'}`}>
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold text-primary">Gestión Busetas</h1>
          )}
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 hover:bg-background-secondary rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 overflow-y-auto" style={{ overflow: 'visible' }}>
          <ul className="space-y-1" style={{ overflow: 'visible' }}>
            {menuItems
              .filter(item => canView(item.module))
              .map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path} className="relative group">
                    <Link
                      to={item.path}
                      onClick={closeSidebar}
                      onMouseEnter={(e) => isSidebarCollapsed && window.innerWidth >= 1024 && handleMouseEnter(e, item.path)}
                      onMouseLeave={handleMouseLeave}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-text hover:bg-background-secondary'
                      } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!isSidebarCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                    {/* Tooltip para sidebar colapsado - solo en desktop */}
                    {isSidebarCollapsed && activeTooltip === item.path && tooltipPosition && (
                      <div 
                        className="hidden lg:block fixed px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none"
                        style={{ 
                          zIndex: 99999,
                          left: '5rem',
                          top: `${tooltipPosition.top}px`,
                          transform: 'translateY(-50%)'
                        }}
                      >
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        </nav>

        {/* Botón para colapsar/expandir (solo en desktop) */}
        <div className="hidden lg:block p-4 border-t border-border">
          <button
            onClick={toggleSidebarCollapse}
            className="w-full p-2 hover:bg-background-secondary rounded-lg transition flex items-center justify-center"
            title={isSidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Navbar superior */}
        <nav className="sticky top-0 z-30 bg-surface border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Botón hamburguesa móvil */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-background-secondary rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Título o logo (visible en escritorio) */}
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-primary">Sistema de Gestión</h2>
            </div>

            {/* Espaciador para móvil */}
            <div className="flex-1 lg:hidden" />

            {/* Menú de usuario - siempre a la derecha */}
            <div className="relative ml-auto">
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-2 p-2 hover:bg-background-secondary rounded-lg transition"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {user?.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold">{user?.fullName}</p>
                  <p className="text-xs text-text-secondary">{user?.role}</p>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menú de usuario */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <p className="font-semibold text-sm">{user?.fullName}</p>
                      <p className="text-xs text-text-secondary">{user?.email}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        Rol: <span className="font-medium">{user?.role}</span>
                      </p>
                    </div>
                    <button
                      onClick={openLogoutModal}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-background-secondary transition flex items-center gap-2 text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </nav>
        
        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {children}
        </div>
        </div>
      </main>

      {/* Modal de confirmación de cierre de sesión */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Cerrar sesión</h3>
                <p className="text-sm text-text-secondary mt-1">¿Estás seguro de que deseas cerrar sesión?</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
