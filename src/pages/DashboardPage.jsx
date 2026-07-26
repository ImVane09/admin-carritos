import { useEffect, useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { fetchDestinations, fetchDrivers, fetchDashboardStats, fetchHourlyReport } from '../services/adminService';
import DashboardLiveMap from '../components/DashboardLiveMap';
import { createEcho } from '../services/echoService';
import { Chart } from 'primereact/chart';

const CAMPUS_CENTER = [-0.9525, -80.7450];

function StatCardPremium({ title, value, icon, tone, subtitle, loading }) {
  return (
    <div className={`stat-card-premium ${tone}`}>
      <div className="stat-premium-info">
        <span>{title}</span>
        {loading ? (
          <h2 style={{ display: 'flex', alignItems: 'center', height: '2.5rem', margin: '0.25rem 0' }}>
            <ProgressSpinner style={{ width: '22px', height: '22px' }} strokeWidth="6" />
          </h2>
        ) : (
          <h2>{value}</h2>
        )}
        <p><i className="pi pi-check-circle" style={{ color: '#4caf50', fontSize: '0.8rem' }} /> {subtitle || 'Sincronizado'}</p>
      </div>
      <div className="stat-icon-wrapper">
        <i className={icon} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, drivers: 0, trips: 0, active: 0, completed: 0, destinations: 0 });
  const [drivers, setDrivers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [hourlyData, setHourlyData] = useState(null);
  const [cancellations, setCancellations] = useState([]);
  const [waitTimes, setWaitTimes] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  const activeDrivers = useMemo(() => {
    return drivers.filter((driver) => driver.is_online && driver.latitude !== null && driver.longitude !== null);
  }, [drivers]);

  useEffect(() => {
    let echoInstance = null;

    // 1. Cargar destinos una sola vez al montar el componente (son estáticos)
    const loadDestinations = async () => {
      try {
        const list = await fetchDestinations({ only_active: true });
        setDestinations(list || []);
      } catch (error) {
        console.error('Error al cargar destinos del campus:', error);
      }
    };
    loadDestinations();

    // 2. Cargar estadísticas y conductores en línea de manera asíncrona
    const loadDynamicData = async (isInitial = false) => {
      if (isInitial) setStatsLoading(true);
      try {
        const [dashboardStats, driversList, hourlyReport] = await Promise.all([
          fetchDashboardStats(),
          fetchDrivers(),
          fetchHourlyReport(),
        ]);
        
        setStats(dashboardStats);
        setDrivers(driversList);
        setCancellations(dashboardStats.cancellations || []);
        setWaitTimes(dashboardStats.wait_times || []);
        
        if (hourlyReport) {
          setHourlyData({
            labels: hourlyReport.labels || [],
            datasets: [
              {
                label: 'Viajes Completados',
                data: hourlyReport.data || [],
                fill: true,
                borderColor: '#1E88E5',
                tension: 0.4,
                backgroundColor: 'rgba(30, 136, 229, 0.1)'
              }
            ]
          });
        }
        
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error al cargar datos en tiempo real del dashboard:', error);
      } finally {
        if (isInitial) setStatsLoading(false);
      }
    };

    loadDynamicData(true);

    // 3. Inicializar WebSocket para actualización de GPS en vivo
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        echoInstance = createEcho(token);
        const channel = echoInstance.channel('drivers.live');

        channel.listen('.DriverGlobalLocationUpdated', (event) => {
          setDrivers((prevDrivers) => {
            const driverExists = prevDrivers.find((d) => d.id === event.driver_id);
            if (driverExists) {
              return prevDrivers.map((d) =>
                d.id === event.driver_id
                  ? {
                      ...d,
                      latitude: parseFloat(event.latitude),
                      longitude: parseFloat(event.longitude),
                      location_updated_at: event.timestamp || new Date().toISOString(),
                      is_online: true,
                    }
                  : d
              );
            } else {
              return [
                ...prevDrivers,
                {
                  id: event.driver_id,
                  name: `Conductor ${event.driver_id}`,
                  latitude: parseFloat(event.latitude),
                  longitude: parseFloat(event.longitude),
                  location_updated_at: event.timestamp || new Date().toISOString(),
                  is_online: true,
                },
              ];
            }
          });
        });

        channel.listen('.DriverOffline', (event) => {
          setDrivers((prevDrivers) => {
            return prevDrivers.map((d) =>
              d.id === event.driver_id
                ? { ...d, is_online: false }
                : d
            );
          });
        });

        // Escuchar cambios en las estadísticas del dashboard
        const publicChannel = echoInstance.channel('dashboard.stats');
        publicChannel.listen('.DashboardStatsUpdated', (event) => {
          if (event.stats) {
            setStats(event.stats);
            setCancellations(event.stats.cancellations || []);
            setWaitTimes(event.stats.wait_times || []);
          }
          if (event.hourly) {
            setHourlyData({
              labels: event.hourly.labels || [],
              datasets: [{
                label: 'Viajes Completados',
                data: event.hourly.data || [],
                fill: true,
                borderColor: '#1E88E5',
                tension: 0.4,
                backgroundColor: 'rgba(30, 136, 229, 0.1)'
              }]
            });
          }
          setLastUpdate(new Date());
        });
      } catch (wsError) {
        console.error('Error al inicializar la conexión de WebSockets:', wsError);
      }
    }

    return () => {
      if (echoInstance) {
        echoInstance.disconnect();
      }
    };
  }, []);

  const totalCancellations = useMemo(() => cancellations.reduce((sum, item) => sum + parseInt(item.count || 0), 0), [cancellations]);
  const avgWaitTime = useMemo(() => {
    if (waitTimes.length === 0) return "0.0";
    const sum = waitTimes.reduce((acc, item) => acc + parseFloat(item.avg_wait_minutes || 0), 0);
    return (sum / waitTimes.length).toFixed(1);
  }, [waitTimes]);

  return (
    <div className="dashboard-layout" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Banner de Bienvenida Premium */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>¡Bienvenido, Administrador!</h1>
          <p>Monitoreo unificado de la red de carritos y destinos del campus universitario.</p>
        </div>
        <div className="welcome-banner-date">
          <i className="pi pi-calendar" />
          <span>
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </div>

      <div className="dashboard-grid-premium">
        <StatCardPremium title="Usuarios del Sistema" value={stats.users} icon="pi pi-users" tone="blue" subtitle="Cuentas registradas" loading={statsLoading} />
        <StatCardPremium title="Conductores" value={stats.drivers} icon="pi pi-car" tone="cyan" subtitle="Asignados a ruta" loading={statsLoading} />
        <StatCardPremium title="Destinos Campus" value={stats.destinations} icon="pi pi-map-marker" tone="green" subtitle="Puntos de parada" loading={statsLoading} />
        <StatCardPremium title="Historial de Viajes" value={stats.trips} icon="pi pi-history" tone="purple" subtitle="Total de viajes" loading={statsLoading} />
        
        <StatCardPremium title="Viajes Completados" value={stats.completed} icon="pi pi-check-circle" tone="blue" subtitle="Carreras exitosas" loading={statsLoading} />
        <StatCardPremium title="Carritos en Línea" value={activeDrivers.length} icon="pi pi-bolt" tone="green" subtitle="Conductores activos" loading={statsLoading} />
        <StatCardPremium title="Cancelaciones" value={totalCancellations} icon="pi pi-times-circle" tone="red" subtitle="Viajes anulados" loading={statsLoading} />
        <StatCardPremium title="Espera Promedio" value={`${avgWaitTime} min`} icon="pi pi-clock" tone="amber" subtitle="Tiempo de atención" loading={statsLoading} />
      </div>

      {/* Panel Principal de Monitoreo */}
      <Card style={{ borderRadius: '1.25rem', border: '1px solid var(--border-color)', padding: '0.75rem 0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
        
        {/* Cabecera del Panel de Monitoreo */}
        <div className="hero-panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-main)', margin: 0, letterSpacing: '-0.3px' }}>
              Monitoreo Satelital en Tiempo Real
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Seguimiento de carritos activos y destinos predeterminados del campus.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="pulse-indicator">
              <div className="pulse-dot" />
              <span>SISTEMA EN VIVO</span>
            </div>
            <div className="welcome-banner-date" style={{ color: 'var(--text-primary)', background: 'var(--border-light)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
              <i className="pi pi-clock" style={{ color: 'var(--primary-light)' }} />
              <span>Sincronizado: {lastUpdate ? lastUpdate.toLocaleTimeString('es-ES') : 'conectando...'}</span>
            </div>
          </div>
        </div>

        {/* Grid del Mapa y Lista Lateral */}
        <div className="dashboard-monitor-grid">
          <div className="dashboard-map-card" style={{ border: '1px solid var(--border-color)', borderRadius: '1.25rem', overflow: 'hidden', padding: 0 }}>
            <DashboardLiveMap drivers={activeDrivers} destinations={destinations} center={CAMPUS_CENTER} />
          </div>

          <div className="dashboard-side-card" style={{ border: '1px solid var(--border-color)', borderRadius: '1.25rem', background: '#fafcff' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-main)', marginBottom: '1rem', marginTop: 0 }}>
              Carritos Activos en Campus ({activeDrivers.length})
            </h3>
            
            <div className="dashboard-driver-list" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {activeDrivers.length > 0 ? activeDrivers.map((driver) => (
                <div key={driver.id} className="dashboard-driver-item-premium">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="driver-premium-avatar">
                      {driver.name ? driver.name.slice(0, 1).toUpperCase() : 'C'}
                    </div>
                    <div className="driver-premium-info">
                      <strong>{driver.name || `Conductor #${driver.id}`}</strong>
                      <span className="driver-subtext">
                        <i className="pi pi-map-marker" /> {driver.latitude?.toFixed(5)}, {driver.longitude?.toFixed(5)}
                      </span>
                      <span className="driver-subtext" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                        <i className="pi pi-clock" style={{ fontSize: '0.7rem' }} /> {driver.location_updated_at ? new Date(driver.location_updated_at).toLocaleTimeString('es-ES') : 'en vivo'}
                      </span>
                    </div>
                  </div>
                  <Tag value="En línea" severity="success" style={{ borderRadius: '0.5rem', fontWeight: 700, padding: '0.25rem 0.5rem' }} />
                </div>
              )) : (
                <div className="empty-state" style={{ padding: '3.5rem 1rem', background: 'white', borderRadius: '1rem', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  <i className="pi pi-car" style={{ fontSize: '3rem', color: 'var(--border-color)', marginBottom: '1rem', opacity: 0.8 }} />
                  <h3 style={{ margin: '0.5rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>No hay carritos conectados</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Cuando un conductor active su GPS desde la aplicación móvil, aparecerá aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
