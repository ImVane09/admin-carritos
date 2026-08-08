import { useMemo } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { ProgressSpinner } from "primereact/progressspinner";

export default function ReportsPageCharts({
  loading,
  hourly,
  drivers,
  allDriversForKpis,
  daily,
  destinations,
  routes
}) {
  const lineChartData = useMemo(() => {
    const activeHours = Array.from({ length: 16 }, (_, i) => i + 7);
    const hourlyCounts = activeHours.map((h) => {
      const match = hourly.find((item) => item.hour === h);
      return match ? match.count : 0;
    });
    const passengersCounts = activeHours.map((h) => {
      const match = hourly.find((item) => item.hour === h);
      return match ? match.passengers_count : 0;
    });

    return {
      labels: activeHours.map((h) => `${String(h).padStart(2, "0")}:00`),
      datasets: [
        {
          label: "Viajes Completados",
          data: hourlyCounts,
          fill: true,
          borderColor: "#1E88E5",
          tension: 0.4,
          backgroundColor: "rgba(30, 136, 229, 0.08)",
          pointBackgroundColor: "#144985",
          pointBorderColor: "#ffffff",
          pointHoverRadius: 6,
        },
        {
          label: "Pasajeros Transportados",
          data: passengersCounts,
          fill: true,
          borderColor: "#10b981",
          tension: 0.4,
          backgroundColor: "rgba(16, 185, 129, 0.04)",
          pointBackgroundColor: "#047857",
          pointBorderColor: "#ffffff",
          pointHoverRadius: 6,
        },
      ],
    };
  }, [hourly]);

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false, padding: 12, cornerRadius: 8, backgroundColor: "#1e293b" },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { family: "Outfit, sans-serif", size: 10 } } },
      y: { grid: { color: "#f1f5f9" }, ticks: { color: "#64748b", font: { family: "Outfit, sans-serif" } } },
    },
  }), []);

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

  const occupancyChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { usePointStyle: true, padding: 20, font: { family: "Outfit, sans-serif", size: 12 }, color: "#64748b" } },
      tooltip: { mode: "index", intersect: false, padding: 12, backgroundColor: "#1e293b", cornerRadius: 8 },
    },
    scales: {
      x: { stacked: false, grid: { display: false }, ticks: { color: "#64748b", font: { family: "Outfit, sans-serif", size: 10 }, maxRotation: 45, minRotation: 45 } },
      y: { stacked: false, grid: { color: "#f1f5f9" }, ticks: { color: "#64748b", font: { family: "Outfit, sans-serif" } } },
    },
  }), []);

  const workDistributionChartData = useMemo(() => {
    const labels = allDriversForKpis.map((d) => d.name || "Conductor");
    const tripCounts = allDriversForKpis.map((d) => parseInt(d.completed_trips || 0));
    return {
      labels: labels,
      datasets: [
        {
          data: tripCounts,
          backgroundColor: ["#144985", "#1E88E5", "#0288D1", "#00ACC1", "#26A69A", "#43A047", "#7CB342", "#AFB42B", "#FDD835", "#FFB300"],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  }, [allDriversForKpis]);

  const dailyChartData = useMemo(() => {
    const labels = daily.map((item) => {
      if (!item.date) return "—";
      const dateObj = new Date(item.date);
      return dateObj.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
    });
    const counts = daily.map((item) => item.count);

    return {
      labels: labels,
      datasets: [
        {
          label: "Viajes Finalizados",
          data: counts,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.08)",
          fill: true,
          tension: 0.3,
          pointBackgroundColor: "#4f46e5",
          pointBorderColor: "#ffffff",
          pointHoverRadius: 6,
        },
      ],
    };
  }, [daily]);

  const doughnutChartData = useMemo(() => {
    return {
      labels: destinations.map((d) => d.destination_address || "Sin dirección"),
      datasets: [
        {
          data: destinations.map((d) => d.count),
          backgroundColor: ["#144985", "#1E88E5", "#0288D1", "#00ACC1", "#26A69A", "#43A047", "#7CB342", "#AFB42B", "#FDD835", "#FFB300"],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  }, [destinations]);

  const doughnutChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { position: "bottom", labels: { usePointStyle: true, padding: 20, font: { family: "Outfit, sans-serif", size: 12 }, color: "#64748b" } },
      tooltip: { padding: 12, backgroundColor: "#1e293b", cornerRadius: 8 },
    },
  }), []);

  return (
    <>
      {/* Demanda Diaria */}
      <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", margin: 0 }}>Viajes Realizados</h3>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Cantidad de viajes completados por día</span>
          </div>
          <i className="pi pi-calendar" style={{ fontSize: "1.25rem", color: "#6366f1" }} />
        </div>
        <div style={{ height: "260px", position: "relative" }}>
          {loading ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
            </div>
          ) : daily.length > 0 ? (
            <Chart type="line" data={dailyChartData} options={lineChartOptions} style={{ height: "100%" }} />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              No hay datos de viajes finalizado.
            </div>
          )}
        </div>
      </Card>

      {/* Rendimiento Conductores y Paradas */}
      <div className="dashboard-monitor-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.25rem" }}>
        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", margin: 0 }}>Rendimiento de Conductores</h3>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Completados vs Cancelados</span>
            </div>
            <i className="pi pi-car" style={{ fontSize: "1.25rem", color: "#10b981" }} />
          </div>
          <div style={{ height: "280px", position: "relative" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" /></div>
            ) : drivers.length > 0 ? (
              <Chart type="bar" data={occupancyChartData} options={occupancyChartOptions} style={{ height: "100%" }} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>No hay datos de conductores para mostrar.</div>
            )}
          </div>
        </Card>

        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", margin: 0 }}>Top Paradas Más Solicitadas</h3>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Las paradas de mayor afluencia</span>
            </div>
            <i className="pi pi-map-marker" style={{ fontSize: "1.25rem", color: "#00acc1" }} />
          </div>
          <div style={{ height: "280px", position: "relative" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" /></div>
            ) : destinations.length > 0 ? (
              <Chart type="doughnut" data={doughnutChartData} options={doughnutChartOptions} style={{ height: "100%" }} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>No hay datos de paradas registrados.</div>
            )}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.25rem" }}>
        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>📊 Distribución de Trabajo por Conductor</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Porcentaje de viajes completados por conductor sobre la actividad total</span>
          <div style={{ height: "240px", position: "relative" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" /></div>
            ) : allDriversForKpis.length > 0 ? (
              <Chart type="doughnut" data={workDistributionChartData} options={doughnutChartOptions} style={{ height: "100%" }} />
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8", fontSize: "0.85rem" }}>No hay datos operativos registrados.</div>
            )}
          </div>
        </Card>

        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>⏱️ Tiempos Promedio de Viaje por Ruta</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Duración media en minutos de los trayectos completados más habituales del campus.</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "240px", overflowY: "auto", paddingRight: "0.25rem" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" /></div>
            ) : routes.length > 0 ? (
              routes.map((r, i) => (
                <div key={i} style={{ backgroundColor: "#fafcff", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#334155" }}>Desde: <strong>{r.origin_address}</strong></span>
                    <span style={{ fontSize: "0.75rem", color: "#334155" }}>Hacia: <strong>{r.destination_address}</strong></span>
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>({r.count} viajes completados)</span>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-main)" }}>{r.avg_duration_minutes}</span>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>minutos</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.85rem" }}>No se registran datos suficientes sobre rutas completadas en la base de datos.</div>
            )}
          </div>
        </Card>
      </div>

      <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)", marginTop: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", margin: 0 }}>Horarios Pico de Demanda de Viajes</h3>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Análisis de carga de solicitudes por franja horaria</span>
          </div>
          <i className="pi pi-clock" style={{ fontSize: "1.25rem", color: "#f59e0b" }} />
        </div>
        <div style={{ height: "320px", position: "relative" }}>
          {loading ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" /></div>
          ) : hourly.length > 0 ? (
            <Chart type="line" data={lineChartData} options={lineChartOptions} style={{ height: "100%" }} />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>No hay datos de demanda horaria para mostrar.</div>
          )}
        </div>
      </Card>
    </>
  );
}
