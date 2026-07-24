import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

export default function PermissionRoute({ permission, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return null; 
  }

  const hasPermission = () => {
    if (!permission) return true;
    if (user?.id === 1) return true; // Super admin
    return user?.permissions?.includes(permission);
  };

  if (!hasPermission()) {
    // Si la ruta rechazada es la raíz y no tiene permiso para ver el dashboard
    if (location.pathname === '/') {
      // Buscar primera ruta disponible según sus permisos
      if (user?.permissions?.includes('view_driver_reports')) return <Navigate to="/reports/drivers" replace />;
      if (user?.permissions?.includes('view_route_reports')) return <Navigate to="/reports/routes" replace />;
      if (user?.permissions?.includes('manage_users')) return <Navigate to="/users" replace />;
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Card style={{ width: '400px', textAlign: 'center', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <i className="pi pi-lock" style={{ fontSize: '3rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}></i>
          <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Acceso Denegado</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            No tienes los permisos necesarios para visualizar este módulo.
          </p>
          <Button label="Regresar" icon="pi pi-arrow-left" onClick={() => navigate(-1)} />
        </Card>
      </div>
    );
  }

  return children;
}
