import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { fetchDashboardStats } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

export default function ManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({
    admins: '...',
    drivers: '...',
    passengers: '...',
    destinations: '...',
    vehicles: '...',
    trips: '...'
  });

  useEffect(() => {
    let active = true;

    if (user?.id !== 1 && !user?.permissions?.includes('view_dashboard')) {
      return () => { active = false; };
    }

    const loadCounts = async () => {
      try {
        const stats = await fetchDashboardStats();

        if (!active) return;

        setCounts({
          admins: stats.admins,
          drivers: stats.drivers,
          passengers: stats.passengers,
          destinations: stats.destinations,
          vehicles: stats.vehicles,
          trips: stats.trips
        });
      } catch (err) {
        console.error('Error loading management page metrics:', err);
        if (!active) return;
        setError('No se pudieron cargar los indicadores. Intenta nuevamente.');
      }
    };

    loadCounts();

    return () => {
      active = false;
    };
  }, [user]);

  const managementOptions = [
    {
      title: 'Administradores',
      description: 'Gestionar cuentas administrativas del sistema',
      icon: 'pi pi-shield',
      color: '#f83737ff',
      path: '/management/admins',
      count: counts.admins,
      permission: 'manage_admins'
    },
    {
      title: 'Conductores',
      description: 'Administrar conductores y sus vehículos',
      icon: 'pi pi-car',
      color: '#1E88E5',
      path: '/management/drivers',
      count: counts.drivers,
      permission: 'manage_users'
    },
    {
      title: 'Pasajeros',
      description: 'Gestionar cuentas de pasajeros',
      icon: 'pi pi-users',
      color: '#4caf50',
      path: '/management/passengers',
      count: counts.passengers,
      permission: 'manage_users'
    },
    {
      title: 'Destinos',
      description: 'Administrar lugares y destinos del sistema',
      icon: 'pi pi-map-marker',
      color: '#ff9800',
      path: '/management/destinations',
      count: counts.destinations,
      permission: 'manage_destinations'
    },
    {
      title: 'Flota de Vehículos',
      description: 'Registro y estado de los carritos',
      icon: 'pi pi-car',
      color: '#f59e0b',
      path: '/management/vehicles',
      count: counts.vehicles,
      permission: 'manage_vehicles'
    },
    {
      title: 'Historial de Viajes',
      description: 'Ver y auditar el historial de viajes y calificaciones',
      icon: 'pi pi-history',
      color: '#9c27b0',
      path: '/management/trips',
      count: counts.trips === '...' ? '...' : (typeof counts.trips === 'number' ? `${counts.trips} viajes` : counts.trips),
      permission: 'view_history'
    },
    {
      title: 'Horarios (Shifts)',
      description: 'Gestionar turnos disponibles en el campus',
      icon: 'pi pi-clock',
      color: '#00bcd4',
      path: '/management/shifts',
      count: 'Ver',
      permission: 'manage_shifts'
    },
    {
      title: 'Asignaciones',
      description: 'Asignar vehículos y horarios a conductores',
      icon: 'pi pi-calendar-plus',
      color: '#e91e63',
      path: '/management/assignments',
      count: 'Ver',
      permission: 'manage_assignments'
    },
    {
      title: 'Eventos',
      description: 'Gestionar eventos y asignar carritos especiales',
      icon: 'pi pi-ticket',
      color: '#673ab7',
      path: '/management/events',
      count: 'Ver',
      permission: 'manage_events'
    }
  ];

  const canAccess = (permission) => user?.id === 1 || user?.permissions?.includes(permission);
  const visibleManagementOptions = managementOptions.filter((option) => canAccess(option.permission));

  return (
    <div className="management-section">
      <div className="management-header">
        <div className="management-header-left">
          <i className="pi pi-briefcase" style={{ color: 'white' }} />
          <div className="management-header-content">
            <h2>Gestión Administrativa</h2>
            <p>Selecciona un módulo para administrar los recursos del sistema</p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {error && <p role="alert" style={{ gridColumn: '1 / -1', color: 'var(--danger-color)' }}>{error}</p>}
        {visibleManagementOptions.map((option) => (
          <div
            key={option.path}
            className="stat-card"
            onClick={() => navigate(option.path)}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-inner">
              <div>
                <span>{option.title}</span>
                <h3>{option.count}</h3>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {option.description}
                </p>
              </div>
              <i className={option.icon} style={{ color: option.color, fontSize: '2.5rem' }} />
            </div>
          </div>
        ))}
      </div>

      <Card style={{ marginTop: '2rem' }}>
        <h3 style={{ color: 'var(--primary-main)', marginBottom: '1rem' }}>Acciones Rápidas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {visibleManagementOptions.map((option) => (
            <button
              key={option.path}
              onClick={() => navigate(option.path)}
              style={{
                padding: '1rem',
                border: `2px solid ${option.color}`,
                backgroundColor: 'transparent',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: option.color,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = option.color;
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = option.color;
              }}
            >
              <i className={option.icon} style={{ marginRight: '0.5rem' }} />
              {option.title}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
