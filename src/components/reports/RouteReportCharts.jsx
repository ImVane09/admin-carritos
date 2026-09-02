import { useMemo } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { ProgressSpinner } from "primereact/progressspinner";
import HeatMap from "../../components/HeatMap";

export default function RouteReportCharts({ destinations, cancellations, waitTimes, coordinates, routes, loading }) {
  const doughnutChartData = useMemo(() => {
    const labels = destinations.map((d) => d.destination_address || "Sin dirección");
    const counts = destinations.map((d) => d.count);
    return {
      labels: labels,
      datasets: [
        {
          label: "Viajes",
          data: counts,
          backgroundColor: ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b"],
          borderWidth: 0,
        },
      ],
    };
  }, [destinations]);

  // Gráfico de Cancelaciones
  const cancellationsChartData = useMemo(() => {
    const labels = cancellations.map((item) => {
      if (!item.date) return "—";
      const dateObj = new Date(item.date);
      return dateObj.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
    });
    const counts = cancellations.map((item) => item.count);

    return {
      labels: labels,
      datasets: [
        {
          label: "Viajes Cancelados",
          data: counts,
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderColor: "#ef4444",
          borderWidth: 1,
          borderRadius: 6,
        }
      ]
    };
  }, [cancellations]);

  // Gráfico de Tiempos de Atención
  const waitTimesChartData = useMemo(() => {
    const labels = waitTimes.map((item) => {
      if (!item.date) return "—";
      const dateObj = new Date(item.date);
      return dateObj.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
    });
    const times = waitTimes.map((item) => parseFloat(item.avg_wait_minutes));

    return {
      labels: labels,
      datasets: [
        {
          label: "Tiempo de Atención Promedio (min)",
          data: times,
          backgroundColor: "rgba(245, 158, 11, 0.8)",
          borderColor: "#f59e0b",
          borderWidth: 1,
          borderRadius: 6,
        }
      ]
    };
  }, [waitTimes]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#f1f5f9" } },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: "Outfit, sans-serif", size: 12 },
          color: "#64748b",
        },
      },
    },
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.25rem" }}>
        
        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Mapa de Solicitudes</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Concentración de puntos de inicio de los viajes (Heatmap).</span>
          <div style={{ height: "300px", borderRadius: "1rem", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <HeatMap points={coordinates} />
          </div>
        </Card>

        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Top Paradas Más Solicitadas</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Las paradas de mayor afluencia en el campus.</span>
          <div style={{ height: "300px", position: "relative" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
            ) : destinations.length > 0 ? (
              <Chart type="doughnut" data={doughnutChartData} options={doughnutChartOptions} style={{ height: "100%" }} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                No hay datos de destinos registrados.
              </div>
            )}
          </div>
        </Card>

        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Tiempos Promedio de Viaje por Ruta</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Duración media en minutos de los trayectos completados.</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "300px", overflowY: "auto", paddingRight: "0.25rem" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
            ) : routes && routes.length > 0 ? (
              routes.map((r, i) => (
                <div key={i} style={{ backgroundColor: "#fafcff", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#334155" }}>Desde: <strong>{r.origin_address}</strong></span>
                    <span style={{ fontSize: "0.75rem", color: "#334155" }}>Hacia: <strong>{r.destination_address}</strong></span>
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>({r.count || r.completed_trips || 0} viajes completados)</span>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-main)" }}>{r.avg_duration_minutes}</span>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>minutos</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                No se registran rutas suficientes.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.25rem" }}>
        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Cancelaciones de Viajes</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Tendencia de viajes cancelados por los usuarios.</span>
          <div style={{ height: "260px", position: "relative" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
            ) : cancellations.length > 0 ? (
              <Chart type="bar" data={cancellationsChartData} options={barChartOptions} style={{ height: "100%" }} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                No hay cancelaciones registradas.
              </div>
            )}
          </div>
        </Card>

        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Tiempo de Atención</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Promedio en minutos desde la solicitud hasta la aceptación.</span>
          <div style={{ height: "260px", position: "relative" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
            ) : waitTimes.length > 0 ? (
              <Chart type="bar" data={waitTimesChartData} options={barChartOptions} style={{ height: "100%" }} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                No hay tiempos registrados.
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
