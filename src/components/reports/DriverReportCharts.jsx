import { useMemo } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { ProgressSpinner } from "primereact/progressspinner";

export default function DriverReportCharts({ drivers, ratings, loading }) {
  const occupancyChartData = useMemo(() => {
    const labels = drivers.map((d) => d.name || "Conductor");
    const completedTrips = drivers.map((d) => parseInt(d.completed_trips || 0));
    const canceledTrips = drivers.map((d) => parseInt(d.canceled_trips || 0));

    return {
      labels: labels,
      datasets: [
        {
          label: "Viajes Completados",
          data: completedTrips,
          backgroundColor: "rgba(30, 136, 229, 0.85)",
          borderColor: "#1E88E5",
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Viajes Cancelados",
          data: canceledTrips,
          backgroundColor: "rgba(239, 68, 68, 0.85)",
          borderColor: "#ef4444",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [drivers]);

  const occupancyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#f1f5f9" } },
    },
  };

  // Gráfico de Distribución de Calificaciones
  const ratingsChartData = useMemo(() => {
    const defaultData = [0, 0, 0, 0, 0];
    if (ratings?.distribution) {
      ratings.distribution.forEach((item) => {
        if (item.stars >= 1 && item.stars <= 5) {
          defaultData[item.stars - 1] = item.count;
        }
      });
    }

    return {
      labels: ["1 Estrella", "2 Estrellas", "3 Estrellas", "4 Estrellas", "5 Estrellas"],
      datasets: [
        {
          data: defaultData,
          backgroundColor: ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"],
          borderWidth: 0,
        },
      ],
    };
  }, [ratings]);

  const ratingsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "right",
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
      <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
        <Card className="chart-card-premium">
          <h3>Rendimiento: Completados vs Cancelados</h3>
          <div style={{ height: "350px", marginTop: "1rem" }}>
            <Chart type="bar" data={occupancyChartData} options={occupancyChartOptions} height="350px" />
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Distribución de Calificaciones</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Evaluación del servicio otorgada por los pasajeros.</span>
          <div style={{ height: "260px", position: "relative" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
            ) : ratings?.distribution?.length > 0 ? (
              <Chart type="doughnut" data={ratingsChartData} options={ratingsChartOptions} style={{ height: "100%" }} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                No hay calificaciones registradas.
              </div>
            )}
          </div>
        </Card>

        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Últimos Comentarios</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Reseñas recientes dejadas por los pasajeros.</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "260px", overflowY: "auto", paddingRight: "0.25rem" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
            ) : ratings?.comments?.length > 0 ? (
              ratings.comments.map((c, i) => (
                <div key={i} style={{ backgroundColor: "#fafcff", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#334155" }}>{c.passenger_name || "Usuario Anónimo"}</span>
                    <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: "bold" }}>{c.rating} ★</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0, fontStyle: "italic" }}>"{c.comment}"</p>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                No se registran comentarios recientes.
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
