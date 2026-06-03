import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';

export default function ManagementPage() {
  const navigate = useNavigate();

  const managementOptions = [
    {
      title: 'Administradores',
      description: 'Gestionar cuentas administrativas del sistema',
      icon: 'pi pi-shield',
      color: '#f83737ff',
      path: '/management/admins',
      count: 3
    },
    {
      title: 'Conductores',
      description: 'Administrar conductores y sus vehículos',
      icon: 'pi pi-car',
      color: '#1E88E5',
      path: '/management/drivers',
      count: 24
    },
    {
      title: 'Pasajeros',
      description: 'Gestionar cuentas de pasajeros',
      icon: 'pi pi-users',
      color: '#4caf50',
      path: '/management/passengers',
      count: 156
    },
    {
      title: 'Destinos',
      description: 'Administrar lugares y destinos del sistema',
      icon: 'pi pi-map-marker',
      color: '#ff9800',
      path: '/management/destinations',
      count: 42
    },
    {
      title: 'Historial de Viajes',
      description: 'Ver y auditar el historial de viajes y calificaciones',
      icon: 'pi pi-history',
      color: '#9c27b0',
      path: '/management/trips',
      count: 'Historial'
    }
  ];

  return (
    <div className="management-section">
      <div className="management-header">
        <i className="pi pi-bars" />
        <div className="management-header-content">
          <h2>Centro de Gestión</h2>
          <p>Administración integral del sistema de carritos</p>
        </div>
      </div>

      <div className="stats-grid">
        {managementOptions.map((option) => (
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
          {managementOptions.map((option) => (
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
