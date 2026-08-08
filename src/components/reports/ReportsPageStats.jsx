import { useMemo } from "react";
import { ProgressSpinner } from "primereact/progressspinner";

export default function ReportsPageStats({ loading, allDriversForKpis, totalPassengers, operationalEfficiency, stats }) {
  const totalCompletedTrips = useMemo(() => {
    return allDriversForKpis.reduce((sum, d) => sum + parseInt(d.completed_trips || 0), 0);
  }, [allDriversForKpis]);

  const averageSystemScore = useMemo(() => {
    const ratedDrivers = allDriversForKpis.filter((d) => d.rating_count > 0);
    if (ratedDrivers.length === 0) return 5.0;
    const sum = ratedDrivers.reduce((acc, d) => acc + parseFloat(d.score || 0), 0);
    return (sum / ratedDrivers.length).toFixed(2);
  }, [allDriversForKpis]);

  const totalCanceledTrips = useMemo(() => {
    return allDriversForKpis.reduce((sum, d) => sum + parseInt(d.canceled_trips || 0), 0);
  }, [allDriversForKpis]);

  return (
    <div className="dashboard-grid-premium">
      <div className="stat-card-premium blue">
        <div className="stat-premium-info">
          <span>Carreras Completadas</span>
          {loading ? (
            <h2 style={{ display: "flex", alignItems: "center", height: "2.5rem", margin: "0.25rem 0" }}>
              <ProgressSpinner style={{ width: "22px", height: "22px" }} strokeWidth="6" />
            </h2>
          ) : (
            <h2>{totalCompletedTrips}</h2>
          )}
          <p><i className="pi pi-check-circle" style={{ color: "#4caf50" }} /> Viajes con éxito registrados</p>
        </div>
        <div className="stat-icon-wrapper"><i className="pi pi-check-circle" /></div>
      </div>

      <div className="stat-card-premium cyan">
        <div className="stat-premium-info">
          <span>Pasajeros Movilizados</span>
          {loading ? (
            <h2 style={{ display: "flex", alignItems: "center", height: "2.5rem", margin: "0.25rem 0" }}>
              <ProgressSpinner style={{ width: "22px", height: "22px" }} strokeWidth="6" />
            </h2>
          ) : (
            <h2>{totalPassengers}</h2>
          )}
          <p><i className="pi pi-users" style={{ color: "var(--primary-light)" }} /> Estudiantes y personal transportados</p>
        </div>
        <div className="stat-icon-wrapper"><i className="pi pi-users" /></div>
      </div>

      <div className="stat-card-premium green">
        <div className="stat-premium-info">
          <span>Calidad del Servicio</span>
          {loading ? (
            <h2 style={{ display: "flex", alignItems: "center", height: "2.5rem", margin: "0.25rem 0" }}>
              <ProgressSpinner style={{ width: "22px", height: "22px" }} strokeWidth="6" />
            </h2>
          ) : (
            <h2>{averageSystemScore} <span style={{ fontSize: "1.2rem", color: "#fbbf24" }}>★</span></h2>
          )}
          <p><i className="pi pi-star-fill" style={{ color: "#fbbf24" }} /> Valoración general promedio</p>
        </div>
        <div className="stat-icon-wrapper"><i className="pi pi-star" /></div>
      </div>

      <div className="stat-card-premium purple">
        <div className="stat-premium-info">
          <span>Eficiencia Operacional</span>
          {loading ? (
            <h2 style={{ display: "flex", alignItems: "center", height: "2.5rem", margin: "0.25rem 0" }}>
              <ProgressSpinner style={{ width: "22px", height: "22px" }} strokeWidth="6" />
            </h2>
          ) : (
            <h2>{operationalEfficiency}%</h2>
          )}
          <p><i className="pi pi-times-circle" style={{ color: "#ef4444" }} /> {totalCanceledTrips} cancelados de {stats.trips} totales</p>
        </div>
        <div className="stat-icon-wrapper"><i className="pi pi-chart-bar" /></div>
      </div>
    </div>
  );
}
