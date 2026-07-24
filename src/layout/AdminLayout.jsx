import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { useAuth } from '../context/AuthContext';

const menu = [
  { section: 'Monitoreo' },
  { to: '/', label: 'Dashboard', icon: 'pi pi-home', permission: 'view_dashboard' },
  { to: '/users', label: 'Usuarios', icon: 'pi pi-users', permission: 'manage_users' },
  { section: 'Reportes', collapsible: true },
  { to: '/reports/drivers', label: 'Conductores', icon: 'pi pi-car', permission: 'view_driver_reports', nested: true },
  { to: '/reports/routes', label: 'Rutas', icon: 'pi pi-map', permission: 'view_route_reports', nested: true },
  { to: '/reports/passengers', label: 'Pasajeros', icon: 'pi pi-users', permission: 'view_passenger_reports', nested: true },
  { section: 'Gestión General', collapsible: true, permission: 'manage_users' },
  { to: '/management/admins', label: 'Administradores', icon: 'pi pi-shield', nested: true, permission: 'manage_users' },
  { to: '/management/drivers', label: 'Conductores', icon: 'pi pi-car', nested: true, permission: 'manage_users' },
  { to: '/management/passengers', label: 'Pasajeros', icon: 'pi pi-users', nested: true, permission: 'manage_users' },
  { to: '/management/destinations', label: 'Destinos', icon: 'pi pi-map-marker', nested: true, permission: 'manage_users' },
  { to: '/management/vehicles', label: 'Carritos', icon: 'pi pi-car', nested: true, permission: 'manage_users' },
  { to: '/management/trips', label: 'Historial de Viajes', icon: 'pi pi-history', nested: true, permission: 'view_dashboard' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isManagementOpen, setIsManagementOpen] = useState(true);

  const onLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const hasPermission = (permissionName) => {
    if (!permissionName) return true;
    if (user?.id === 1) return true;
    return user?.permissions?.includes(permissionName);
  };

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <div className="brand-icon-wrapper" style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #144985 0%, #1E88E5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(20, 73, 133, 0.25)'
          }}>
            <i className="pi pi-car" style={{ fontSize: '1.25rem' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-main)', lineHeight: '1.2', letterSpacing: '-0.3px' }}>CARRITOS</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)', letterSpacing: '1px', textTransform: 'uppercase' }}>ADMINISTRADOR</span>
          </div>
        </Link>

        <nav className="menu">
          {menu.map((item, idx) => {
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }

            if (item.section) {
              const isCollapsible = item.collapsible;
              if (isCollapsible) {
                return (
                  <div 
                    key={`sec-${idx}`} 
                    onClick={() => setIsManagementOpen(!isManagementOpen)}
                    style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      color: 'var(--primary-main)', 
                      letterSpacing: '1.2px', 
                      textTransform: 'uppercase',
                      marginTop: '1.5rem',
                      marginBottom: '0.5rem',
                      paddingLeft: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <span>{item.section}</span>
                    <i className={isManagementOpen ? "pi pi-chevron-down" : "pi pi-chevron-right"} style={{ fontSize: '0.7rem', color: 'var(--primary-light)' }} />
                  </div>
                );
              }

              return (
                <div 
                  key={`sec-${idx}`} 
                  style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    color: 'var(--text-tertiary)', 
                    letterSpacing: '1.2px', 
                    textTransform: 'uppercase',
                    marginTop: idx > 0 ? '1.25rem' : '0.25rem',
                    marginBottom: '0.4rem',
                    paddingLeft: '0.85rem'
                  }}
                >
                  {item.section}
                </div>
              );
            }

            if (item.nested && !isManagementOpen) {
              return null;
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `menu-item ${isActive ? 'active' : ''} ${item.nested ? 'nested' : ''}`}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div className="top-actions">
            <Avatar label={(user?.name || 'A').slice(0, 1).toUpperCase()} shape="circle" />
            <Button label="Salir" icon="pi pi-sign-out" severity="danger" text onClick={onLogout} />
          </div>
        </header>

        <section className="page-slot">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
