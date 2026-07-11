import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, BarChart3, Home, ChevronLeft, ChevronRight, Menu, X, Download, LogOut, Users, Tag, Calendar } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';

export type AdminSection = 'pedidos' | 'clientes' | 'cumpleanos' | 'estadisticas' | 'productos' | 'categorias' | 'promociones';

interface AdminLayoutProps {
  activeSection?: AdminSection;
  onChangeSection?: (s: AdminSection) => void;
  onExportCSV?: () => void;
  children: React.ReactNode;
}

const sections = [
  { id: 'pedidos' as const, label: 'Pedidos', icon: Package },
  { id: 'clientes' as const, label: 'Clientes', icon: Users },
  { id: 'cumpleanos' as const, label: 'Cumpleaños', icon: Calendar },
  { id: 'categorias' as const, label: 'Categorías', icon: Package },
  { id: 'productos' as const, label: 'Productos', icon: Package },
  { id: 'promociones' as const, label: 'Promociones', icon: Tag },
  { id: 'estadisticas' as const, label: 'Estadísticas', icon: BarChart3 },
];

const sectionTitles: Record<string, string> = {
  pedidos: 'Pedidos',
  clientes: 'Clientes',
  cumpleanos: 'Cumpleaños',
  categorias: 'Categorías',
  productos: 'Productos',
  promociones: 'Promociones',
  estadisticas: 'Estadísticas',
};

export default function AdminLayout({ activeSection = 'pedidos', onChangeSection = () => {}, onExportCSV, children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const user = getAuth().currentUser;

  useEffect(() => {
    const closeIfDesktop = () => {
      if (window.innerWidth >= 1024) setIsMobileOpen(false);
    };
    window.addEventListener('resize', closeIfDesktop);
    return () => window.removeEventListener('resize', closeIfDesktop);
  }, []);

  return (
    <div className="flex min-h-screen" style={{ background: '#f8f9fa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[39] lg:hidden"
          style={{ background: 'rgba(15, 23, 42, 0.38)', border: 0, padding: 0, margin: 0 }}
          aria-label="Cerrar navegación"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed lg:sticky top-0 left-0 h-screen bg-white flex flex-col z-[40] overflow-hidden"
        style={{
          width: isCollapsed ? '64px' : '220px',
          borderRight: '1px solid #f0f0f0',
          color: '#333',
          transform: isMobileOpen ? 'translateX(0)' : undefined,
          transition: 'width 0.2s ease, transform 0.2s ease',
        }}
        aria-label="Navegación principal"
      >
        {/* Header */}
        <div
          className="flex items-center shrink-0"
          style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            minHeight: '64px',
            justifyContent: isCollapsed ? 'center' : 'space-between',
          }}
        >
          {!isCollapsed && (
            <div className="flex items-center min-w-0 flex-1">
              <div
                className="shrink-0 mr-2 flex items-center justify-center"
                style={{ width: '28px', height: '28px', background: '#dc2626', borderRadius: '4px', color: '#fff' }}
              >
                <Package size={18} />
              </div>
              <span className="font-bold text-sm tracking-wide truncate" style={{ color: '#333' }}>
                Pecado Picoso
              </span>
            </div>
          )}
          {isCollapsed && (
            <div
              className="flex items-center justify-center"
              style={{ width: '28px', height: '28px', background: '#dc2626', borderRadius: '4px', color: '#fff' }}
            >
              <Package size={18} />
            </div>
          )}

          {/* Toggle (desktop) */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center shrink-0"
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              color: '#666',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            title={isCollapsed ? 'Expandir' : 'Colapsar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          {/* Close (mobile) */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="flex lg:hidden items-center justify-center shrink-0"
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              color: '#666',
              cursor: 'pointer',
            }}
            aria-label="Cerrar menú lateral"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col overflow-y-auto" style={{ padding: '8px', gap: '2px' }}>
          {!isCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#999' }}>
              Administrador
            </div>
          )}
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChangeSection(s.id);
                  setIsMobileOpen(false);
                }}
                className="flex items-center w-full border-none bg-transparent cursor-pointer text-left"
                style={{
                  gap: '12px',
                  padding: isCollapsed ? '12px' : '10px 12px',
                  fontWeight: 400,
                  fontSize: '0.9rem',
                  borderRadius: '4px',
                  color: isActive ? '#e85a5a' : '#555',
                  background: isActive ? '#fff0f0' : 'transparent',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f8f8f8';
                    e.currentTarget.style.color = '#333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#555';
                  }
                }}
                title={isCollapsed ? s.label : undefined}
              >
                <span
                  className="shrink-0 inline-flex items-center justify-center"
                  style={{ width: '20px', height: '20px', color: isActive ? '#e85a5a' : '#888' }}
                >
                  <Icon size={20} />
                </span>
                {!isCollapsed && (
                  <span
                    className="truncate"
                    style={{ fontSize: '0.9rem', lineHeight: 1.2, color: 'inherit' }}
                  >
                    {s.label}
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-auto pt-4" style={{ borderTop: '1px solid #f0f0f0' }}>
            <Link
              to="/"
              className="flex items-center w-full text-left"
              style={{
                gap: '12px',
                padding: isCollapsed ? '12px' : '10px 12px',
                fontWeight: 400,
                fontSize: '0.9rem',
                borderRadius: '4px',
                color: '#555',
                background: 'transparent',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f8f8';
                e.currentTarget.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#555';
              }}
              title={isCollapsed ? 'Ir a la tienda' : undefined}
            >
              <span className="shrink-0 inline-flex items-center justify-center" style={{ width: '20px', height: '20px', color: '#888' }}>
                <Home size={20} />
              </span>
              {!isCollapsed && <span className="truncate" style={{ fontSize: '0.9rem', lineHeight: 1.2 }}>Ir a la tienda</span>}
            </Link>
          </div>
          <div className="mt-auto pt-4" style={{ borderTop: '1px solid #f0f0f0' }}>
            <button
              type="button"
              onClick={() => { signOut(getAuth()); }}
              className="flex items-center w-full border-none bg-transparent cursor-pointer text-left"
              style={{
                gap: '12px',
                padding: isCollapsed ? '12px' : '10px 12px',
                fontWeight: 400,
                fontSize: '0.9rem',
                borderRadius: '4px',
                color: '#555',
                background: 'transparent',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f8f8';
                e.currentTarget.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#555';
              }}
              title={isCollapsed ? 'Salir' : undefined}
            >
              <span className="shrink-0 inline-flex items-center justify-center" style={{ width: '20px', height: '20px', color: '#888' }}>
                <LogOut size={20} />
              </span>
              {!isCollapsed && <span className="truncate" style={{ fontSize: '0.9rem', lineHeight: 1.2 }}>Cerrar sesión</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 bg-white"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: '12px 20px', gap: '16px' }}
          >
            <div className="flex items-center" style={{ gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden inline-flex items-center justify-center cursor-pointer"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                  background: '#fff',
                  color: '#333',
                }}
                aria-label="Abrir navegación"
              >
                <Menu size={18} />
              </button>
              <h1 className="m-0" style={{ fontSize: '1rem', color: '#333', fontWeight: 500 }}>
                {sectionTitles[activeSection] || 'Panel'}
              </h1>
            </div>

            <div className="flex items-center" style={{ gap: '12px' }}>
              {onExportCSV && (
                <button
                  type="button"
                  onClick={onExportCSV}
                  className="inline-flex items-center justify-center cursor-pointer"
                  style={{
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#333',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#d0d0d0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                >
                  <Download size={16} />
                  Exportar Excel
                </button>
              )}
              <span className="hidden sm:inline truncate" style={{ fontSize: '0.85rem', color: '#666', maxWidth: '200px' }}>
                {user?.email || ''}
              </span>
              <button
                type="button"
                onClick={() => { signOut(getAuth()); }}
                className="inline-flex items-center justify-center cursor-pointer"
                style={{
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#dc2626',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff0f0';
                  e.currentTarget.style.borderColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <LogOut size={16} />
                Salir
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '16px 20px', width: '100%' }}>
          {children}
        </main>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 1023px) {
          aside { transform: translateX(-100%); }
          aside[style*="translateX(0)"] { transform: translateX(0) !important; }
        }
        @media (max-width: 1024px) {
          aside { width: 220px !important; }
          aside.is-collapsed { width: 220px !important; }
        }
        @media (max-width: 640px) {
          main { padding-left: 12px !important; padding-right: 12px !important; }
        }
      `}</style>
    </div>
  );
}
