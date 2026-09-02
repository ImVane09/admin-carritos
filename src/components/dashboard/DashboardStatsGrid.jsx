import StatCardPremium from '../StatCardPremium';

export default function DashboardStatsGrid({
  stats,
  statsLoading,
  activeDriversCount,
  totalCancellations,
  avgWaitTime
}) {
  return (
    <div
      className="dashboard-stats-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.25rem",
        marginBottom: "1.25rem",
      }}
    >
      <StatCardPremium
        title="Usuarios Registrados"
        value={stats.users}
        icon="pi pi-users"
        tone="blue"
        subtitle="En el sistema"
        loading={statsLoading}
      />
      <StatCardPremium
        title="Conductores Totales"
        value={stats.drivers}
        icon="pi pi-id-card"
        tone="amber"
        subtitle="Registrados"
        loading={statsLoading}
      />
      <StatCardPremium
        title="Destinos Campus"
        value={stats.destinations}
        icon="pi pi-map-marker"
        tone="green"
        subtitle="Puntos de parada"
        loading={statsLoading}
      />
      <StatCardPremium
        title="Historial de Viajes"
        value={stats.trips}
        icon="pi pi-history"
        tone="purple"
        subtitle="Total de viajes"
        loading={statsLoading}
      />
      <StatCardPremium
        title="Viajes Completados"
        value={stats.completed}
        icon="pi pi-check-circle"
        tone="blue"
        subtitle="Carreras exitosas"
        loading={statsLoading}
      />
      <StatCardPremium
        title="Carritos en Línea"
        value={activeDriversCount}
        icon="pi pi-bolt"
        tone="green"
        subtitle="Conductores activos"
        loading={statsLoading}
      />
      <StatCardPremium
        title="Cancelaciones"
        value={totalCancellations}
        icon="pi pi-times-circle"
        tone="red"
        subtitle="Viajes anulados"
        loading={statsLoading}
      />
      <StatCardPremium
        title="Espera Promedio"
        value={`${avgWaitTime} min`}
        icon="pi pi-clock"
        tone="amber"
        subtitle="Tiempo de atención"
        loading={statsLoading}
      />
      <StatCardPremium
        title="Quejas Pendientes"
        value={stats.pending_complaints}
        icon="pi pi-exclamation-circle"
        tone="red"
        subtitle={`${stats.complaints ?? 0} registradas`}
        loading={statsLoading}
      />
    </div>
  );
}
