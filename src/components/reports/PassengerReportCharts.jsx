import { useMemo } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { ProgressSpinner } from "primereact/progressspinner";

export default function PassengerReportCharts({ hourly, daily, cancellations, waitTimes, loading }) {
  // Gráfico de Demanda Horaria
  const lineChartData = useMemo(() => {
    const activeHours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 to 22
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

  const lineChartOptions = {
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

  const barChartOptions = {
    ...lineChartOptions
  };

  // Gráfico de Demanda Diaria
  const dailyChartData = useMemo(() => {
    const labels = daily.map((item) => {
      if (!item.date) return "—";
      const dateObj = new Date(item.date);
      return dateObj.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      });
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

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
        {/* Demanda Diaria */}
        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Tendencia de Viajes por Día</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Cantidad de viajes completados por día en el período seleccionado.</span>
          <div style={{ height: "260px", position: "relative" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
            ) : daily.length > 0 ? (
              <Chart type="line" data={dailyChartData} options={lineChartOptions} style={{ height: "100%" }} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                No hay datos de viajes registrados.
              </div>
            )}
          </div>
        </Card>

        {/* Demanda Horaria */}
        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Demanda y Carga Operativa por Hora</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Horas de mayor flujo de pasajeros y viajes completados a lo largo del día.</span>
          <div style={{ height: "300px", position: "relative" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
            ) : hourly.length > 0 ? (
              <Chart type="line" data={lineChartData} options={lineChartOptions} style={{ height: "100%" }} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                No hay datos de demanda horaria registrados.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
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
