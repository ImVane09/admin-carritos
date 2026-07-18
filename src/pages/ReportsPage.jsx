import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";
import {
  fetchReportsAllSummary,
  fetchReportsDriversSummary,
} from "../services/adminService";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [driversLoading, setDriversLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [allDriversForKpis, setAllDriversForKpis] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [ratings, setRatings] = useState({ distribution: [], comments: [] });
  const [routes, setRoutes] = useState([]);
  const [stats, setStats] = useState({ trips: 0, completed: 0 });

  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [driversPage, setDriversPage] = useState(1);
  const [driversTotal, setDriversTotal] = useState(0);

  const [startDate, setStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return start;
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date();
  });

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
  };

  // Detalle de conductor seleccionado para el modal
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const dt = useRef(null);

  const fetchPaginatedDrivers = async (pageVal, searchVal) => {
    setDriversLoading(true);
    try {
      const params = { per_page: 5, page: pageVal, search: searchVal };
      if (startDate) params.start_date = formatDate(startDate);
      if (endDate) params.end_date = formatDate(endDate);

      const result = await fetchReportsDriversSummary(params);
      setDrivers(result?.data || []);
      setDriversTotal(result?.total || 0);
    } catch (error) {
      console.error("Error al cargar conductores paginados:", error);
    } finally {
      setDriversLoading(false);
    }
  };

  const loadData = async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const params = {};
      if (startDate) params.start_date = formatDate(startDate);
      if (endDate) params.end_date = formatDate(endDate);

      const data = await fetchReportsAllSummary(params);
      setAllDriversForKpis(data.drivers || []);
      setDestinations(data.destinations || []);
      setHourly(data.hourly || []);
      setDaily(data.daily || []);
      setRatings(data.ratings || { distribution: [], comments: [] });
      setRoutes(data.routes || []);
      setStats(data.stats || { trips: 0, completed: 0 });

      // Cargar página inicial de conductores
      await fetchPaginatedDrivers(1, "");
      setDriversPage(1);
    } catch (error) {
      console.error("Error al cargar datos del reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      setDriversPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  useEffect(() => {
    if (!loading) {
      fetchPaginatedDrivers(driversPage, debouncedGlobalFilter);
    }
  }, [driversPage, debouncedGlobalFilter]);

  // --- Computar Estadísticas Generales (KPIs) ---
  const totalCompletedTrips = useMemo(() => {
    return stats.completed || 0;
  }, [stats]);

  const totalPassengers = useMemo(() => {
    return allDriversForKpis.reduce(
      (sum, d) => sum + parseInt(d.total_passengers || 0),
      0,
    );
  }, [allDriversForKpis]);

  const averageSystemScore = useMemo(() => {
    const ratedDrivers = allDriversForKpis.filter((d) => d.rating_count > 0);
    if (ratedDrivers.length === 0) return 5.0;
    const sum = ratedDrivers.reduce(
      (acc, d) => acc + parseFloat(d.score || 0),
      0,
    );
    return (sum / ratedDrivers.length).toFixed(2);
  }, [allDriversForKpis]);

  const operationalEfficiency = useMemo(() => {
    const total = stats.trips || 0;
    const completed = stats.completed || 0;
    if (total === 0) return "0.0";
    return ((completed / total) * 100).toFixed(1);
  }, [stats]);

  const totalCanceledTrips = useMemo(() => {
    return allDriversForKpis.reduce(
      (sum, d) => sum + parseInt(d.canceled_trips || 0),
      0,
    );
  }, [allDriversForKpis]);

  // --- Exportar Tabla a CSV (Optimizado para Excel en Español) ---
  const exportCSV = () => {
    const headers = [
      "Conductor",
      "Carreras Finalizadas",
      "Cancelaciones",
      "Pasajeros Transportados",
      "Ocupación Promedio",
      "Tiempo Promedio (min)",
      "Calificación",
    ];

    const rows = allDriversForKpis.map((d) => [
      d.name || "",
      d.completed_trips || 0,
      d.canceled_trips || 0,
      d.total_passengers || 0,
      d.avg_passengers || "0.0",
      d.avg_duration_minutes || "0.0",
      parseFloat(d.score || 0).toFixed(1),
    ]);

    // Usamos punto y coma ';' como delimitador porque Excel en español
    // (con coma ',' como separador decimal) requiere ';' para separar columnas.
    const csvContent = [
      headers.join(";"),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(";"),
      ),
    ].join("\r\n");

    // Añadir el BOM UTF-8 (\uFEFF) para que Excel reconozca correctamente las tildes y eñes
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_conductores_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Configuración Gráfico 1: Demanda Horaria de Pasajeros (Horas Activas 7 AM a 10 PM) ---
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

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        padding: 12,
        cornerRadius: 8,
        backgroundColor: "#1e293b",
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          font: { family: "Outfit, sans-serif", size: 10 },
        },
      },
      y: {
        grid: {
          color: "#f1f5f9",
        },
        ticks: {
          color: "#64748b",
          font: { family: "Outfit, sans-serif" },
        },
      },
    },
  }), []);

  // --- Configuración Gráfico 2: Rendimiento de Conductores (Completados vs Cancelados) ---
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
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: "Outfit, sans-serif", size: 12 },
          color: "#64748b",
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        padding: 12,
        backgroundColor: "#1e293b",
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          font: { family: "Outfit, sans-serif", size: 10 },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        stacked: false,
        grid: {
          color: "#f1f5f9",
        },
        ticks: {
          color: "#64748b",
          font: { family: "Outfit, sans-serif" },
        },
      },
    },
  }), []);

  // --- Gráfico Adicional: Calificación Promedio por Conductor (Amber Vertical Bars) ---
  const ratingsBarChartData = useMemo(() => {
    const labels = allDriversForKpis.map((d) => d.name || "Conductor");
    const scores = allDriversForKpis.map((d) => parseFloat(d.score || 0));

    return {
      labels: labels,
      datasets: [
        {
          label: "Calificación Promedio",
          data: scores,
          backgroundColor: "rgba(251, 191, 36, 0.85)", // Amber yellow
          borderColor: "#fbbf24",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [allDriversForKpis]);

  const ratingsBarChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Calificación: ${context.parsed.y.toFixed(1)} ★`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#334155",
          font: { family: "Outfit, sans-serif", weight: 600 },
        },
      },
      y: {
        min: 0,
        max: 5,
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#64748b",
          font: { family: "Outfit, sans-serif" },
        },
      },
    },
  }), []);

  // --- Gráfico Adicional: Distribución de Carga Operativa (Doughnut Chart) ---
  const workDistributionChartData = useMemo(() => {
    const labels = allDriversForKpis.map((d) => d.name || "Conductor");
    const tripCounts = allDriversForKpis.map((d) =>
      parseInt(d.completed_trips || 0),
    );

    return {
      labels: labels,
      datasets: [
        {
          data: tripCounts,
          backgroundColor: [
            "#144985",
            "#1E88E5",
            "#0288D1",
            "#00ACC1",
            "#26A69A",
            "#43A047",
            "#7CB342",
            "#AFB42B",
            "#FDD835",
            "#FFB300",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  }, [allDriversForKpis]);

  // --- Configuración Gráfico 3: Demanda de Viajes por Día (Line/Bar Chart por Fechas de los últimos 15 días) ---
  const dailyChartData = useMemo(() => {
    const labels = daily.map((item) => {
      if (!item.date) return "—";
      const dateObj = new Date(item.date);
      // Formatear fecha como DD/MM/YYYY
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

  // --- Configuración Gráfico 4: Popularidad de Destinos (Doughnut Chart) ---
  const doughnutChartData = useMemo(() => {
    return {
      labels: destinations.map((d) => d.destination_address || "Sin dirección"),
      datasets: [
        {
          data: destinations.map((d) => d.count),
          backgroundColor: [
            "#144985",
            "#1E88E5",
            "#0288D1",
            "#00ACC1",
            "#26A69A",
            "#43A047",
            "#7CB342",
            "#AFB42B",
            "#FDD835",
            "#FFB300",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  }, [destinations]);

  const doughnutChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%", // Más fino y moderno
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
      tooltip: {
        padding: 12,
        backgroundColor: "#1e293b",
        cornerRadius: 8,
      },
    },
  }), []);

  // --- Distribución de Calificaciones de Estrellas ---
  const starStats = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let total = 0;
    (ratings.distribution || []).forEach((item) => {
      const stars = parseInt(item.stars);
      if (counts[stars] !== undefined) {
        counts[stars] = parseInt(item.count);
        total += parseInt(item.count);
      }
    });

    return {
      counts,
      total,
      percentages: {
        5: total > 0 ? ((counts[5] / total) * 100).toFixed(0) : 0,
        4: total > 0 ? ((counts[4] / total) * 100).toFixed(0) : 0,
        3: total > 0 ? ((counts[3] / total) * 100).toFixed(0) : 0,
        2: total > 0 ? ((counts[2] / total) * 100).toFixed(0) : 0,
        1: total > 0 ? ((counts[1] / total) * 100).toFixed(0) : 0,
      },
    };
  }, [ratings]);

  // --- Templates para la Tabla de Conductores ---
  const driverNameTemplate = (rowData) => {
    const initials = rowData.name
      ? rowData.name.slice(0, 1).toUpperCase()
      : "C";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "50%",
            backgroundColor: "#eff6ff",
            color: "var(--primary-main)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #dbeafe",
            fontSize: "0.95rem",
          }}
        >
          {initials}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 700, color: "var(--primary-main)" }}>
            {rowData.name}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
            {rowData.email}
          </span>
        </div>
      </div>
    );
  };

  const ratingTemplate = (rowData) => {
    const score = parseFloat(rowData.score || 0);
    const fullStars = Math.floor(score);
    const halfStar = score % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <i
            key={`f-${i}`}
            className="pi pi-star-fill"
            style={{ color: "#fbbf24", fontSize: "0.85rem" }}
          />
        ))}
        {halfStar > 0 && (
          <i
            className="pi pi-star-half"
            style={{ color: "#fbbf24", fontSize: "0.85rem" }}
          />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <i
            key={`e-${i}`}
            className="pi pi-star"
            style={{ color: "#cbd5e1", fontSize: "0.85rem" }}
          />
        ))}
        <span
          style={{
            marginLeft: "0.4rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#334155",
          }}
        >
          {score.toFixed(1)}
        </span>
      </div>
    );
  };

  const statusTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.is_active ? "Activo" : "Inactivo"}
        severity={rowData.is_active ? "success" : "danger"}
        style={{
          borderRadius: "999px",
          padding: "0.25rem 0.6rem",
          fontWeight: 700,
        }}
      />
    );
  };

  const actionTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-eye"
        severity="info"
        text
        onClick={() => {
          setSelectedDriver(rowData);
          setDetailVisible(true);
        }}
        tooltip="Ver Detalles"
        tooltipOptions={{ position: "bottom" }}
      />
    );
  };

  return (
    <div
      className="reports-layout"
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      {/* Banner de Cabecera Premium */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>Reportes e Inteligencia de Datos</h1>
          <p>
            Auditoría de rendimiento de la red de transporte universitario,
            paradas y distribución horaria en base a datos reales de la
            plataforma.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span
            style={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.9)",
              fontWeight: 600,
            }}
          >
            Desde:
          </span>
          <Calendar
            value={startDate}
            onChange={(e) => setStartDate(e.value)}
            readOnlyInput
            placeholder="Inicio"
            dateFormat="dd/mm/yy"
            style={{ width: "130px" }}
          />
          <span
            style={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.9)",
              fontWeight: 600,
            }}
          >
            Hasta:
          </span>
          <Calendar
            value={endDate}
            onChange={(e) => setEndDate(e.value)}
            readOnlyInput
            placeholder="Fin"
            dateFormat="dd/mm/yy"
            style={{ width: "130px" }}
          />
          <Button
            icon="pi pi-filter"
            label="Filtrar"
            severity="warning"
            size="small"
            onClick={() => loadData(true)}
            style={{
              borderRadius: "999px",
              color: "white",
              fontWeight: "bold",
            }}
          />
          <Button
            icon="pi pi-refresh"
            label="Restablecer"
            severity="info"
            size="small"
            outlined
            onClick={() => {
              const defaultStart = new Date();
              defaultStart.setMonth(defaultStart.getMonth() - 1);
              setStartDate(defaultStart);
              
              const defaultEnd = new Date();
              setEndDate(defaultEnd);
              
              // Call loadData with the default dates so it doesn't wait for React state update
              const loadWithDefaults = async () => {
                setLoading(true);
                try {
                  const params = {
                    start_date: formatDate(defaultStart),
                    end_date: formatDate(defaultEnd)
                  };
                  const data = await fetchReportsAllSummary(params);
                  setAllDriversForKpis(data.drivers || []);
                  setDestinations(data.destinations || []);
                  setHourly(data.hourly || []);
                  setDaily(data.daily || []);
                  setRatings(data.ratings || { distribution: [], comments: [] });
                  setRoutes(data.routes || []);
                  setStats(data.stats || { trips: 0, completed: 0 });

                  setDriversLoading(true);
                  try {
                    const pagParams = { per_page: 5, page: 1, search: "", ...params };
                    const pagResult = await fetchReportsDriversSummary(pagParams);
                    setDrivers(pagResult?.data || []);
                    setDriversTotal(pagResult?.total || 0);
                  } finally {
                    setDriversLoading(false);
                  }
                  setDriversPage(1);
                } catch (error) {
                  console.error(error);
                } finally {
                  setLoading(false);
                }
              };
              loadWithDefaults();
            }}
            style={{
              borderRadius: "999px",
              color: "white",
              borderColor: "rgba(255,255,255,0.4)",
            }}
          />
        </div>
      </div>

      {/* Grid de KPIs Analíticos Reales */}
      <div className="dashboard-grid-premium">
        <div className="stat-card-premium blue">
          <div className="stat-premium-info">
            <span>Carreras Completadas</span>
            {loading ? (
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "2.5rem",
                  margin: "0.25rem 0",
                }}
              >
                <ProgressSpinner
                  style={{ width: "22px", height: "22px" }}
                  strokeWidth="6"
                />
              </h2>
            ) : (
              <h2>{totalCompletedTrips}</h2>
            )}
            <p>
              <i className="pi pi-check-circle" style={{ color: "#4caf50" }} />{" "}
              Viajes con éxito registrados
            </p>
          </div>
          <div className="stat-icon-wrapper">
            <i className="pi pi-check-circle" />
          </div>
        </div>

        <div className="stat-card-premium cyan">
          <div className="stat-premium-info">
            <span>Pasajeros Movilizados</span>
            {loading ? (
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "2.5rem",
                  margin: "0.25rem 0",
                }}
              >
                <ProgressSpinner
                  style={{ width: "22px", height: "22px" }}
                  strokeWidth="6"
                />
              </h2>
            ) : (
              <h2>{totalPassengers}</h2>
            )}
            <p>
              <i
                className="pi pi-users"
                style={{ color: "var(--primary-light)" }}
              />{" "}
              Estudiantes y personal transportados
            </p>
          </div>
          <div className="stat-icon-wrapper">
            <i className="pi pi-users" />
          </div>
        </div>

        <div className="stat-card-premium green">
          <div className="stat-premium-info">
            <span>Calidad del Servicio</span>
            {loading ? (
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "2.5rem",
                  margin: "0.25rem 0",
                }}
              >
                <ProgressSpinner
                  style={{ width: "22px", height: "22px" }}
                  strokeWidth="6"
                />
              </h2>
            ) : (
              <h2>
                {averageSystemScore}{" "}
                <span style={{ fontSize: "1.2rem", color: "#fbbf24" }}>★</span>
              </h2>
            )}
            <p>
              <i className="pi pi-star-fill" style={{ color: "#fbbf24" }} />{" "}
              Valoración general promedio
            </p>
          </div>
          <div className="stat-icon-wrapper">
            <i className="pi pi-star" />
          </div>
        </div>

        <div className="stat-card-premium purple">
          <div className="stat-premium-info">
            <span>Eficiencia Operacional</span>
            {loading ? (
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "2.5rem",
                  margin: "0.25rem 0",
                }}
              >
                <ProgressSpinner
                  style={{ width: "22px", height: "22px" }}
                  strokeWidth="6"
                />
              </h2>
            ) : (
              <h2>{operationalEfficiency}%</h2>
            )}
            <p>
              <i className="pi pi-times-circle" style={{ color: "#ef4444" }} />{" "}
              {totalCanceledTrips} cancelados de {stats.trips} totales
            </p>
          </div>
          <div className="stat-icon-wrapper">
            <i className="pi pi-chart-bar" />
          </div>
        </div>
      </div>

      {/* Nueva Fila: Gráfico de Demanda Diaria */}
      <Card
        style={{
          borderRadius: "1.25rem",
          border: "1px solid var(--border-color)",
          padding: "0.75rem 0.5rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--primary-main)",
                margin: 0,
              }}
            >
              Viajes Realizados
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Cantidad de viajes completados por día
            </span>
          </div>
          <i
            className="pi pi-calendar"
            style={{ fontSize: "1.25rem", color: "#6366f1" }}
          />
        </div>
        <div style={{ height: "260px", position: "relative" }}>
          {loading ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ProgressSpinner
                style={{ width: "30px", height: "30px" }}
                strokeWidth="4"
              />
            </div>
          ) : daily.length > 0 ? (
            <Chart
              type="line"
              data={dailyChartData}
              options={lineChartOptions}
              style={{ height: "100%" }}
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              No hay datos de viajes finalizado.
            </div>
          )}
        </div>
      </Card>

      {/* Primera Fila de Gráficos: Rendimiento de Conductores y Paradas Top */}
      <div
        className="dashboard-monitor-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Gráfico 1: Rendimiento de Conductores (Completados vs Cancelados) */}
        <Card
          style={{
            borderRadius: "1.25rem",
            border: "1px solid var(--border-color)",
            padding: "0.75rem 0.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "var(--primary-main)",
                  margin: 0,
                }}
              >
                Rendimiento de Conductores (Viajes Completados vs Cancelados)
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Comparativa de viajes finalizados con éxito contra solicitudes
                canceladas
              </span>
            </div>
            <i
              className="pi pi-car"
              style={{ fontSize: "1.25rem", color: "#10b981" }}
            />
          </div>
          <div style={{ height: "280px", position: "relative" }}>
            {loading ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ProgressSpinner
                  style={{ width: "30px", height: "30px" }}
                  strokeWidth="4"
                />
              </div>
            ) : drivers.length > 0 ? (
              <Chart
                type="bar"
                data={occupancyChartData}
                options={occupancyChartOptions}
                style={{ height: "100%" }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                No hay datos de conductores para mostrar.
              </div>
            )}
          </div>
        </Card>

        {/* Gráfico 2: Destinos más Utilizados */}
        <Card
          style={{
            borderRadius: "1.25rem",
            border: "1px solid var(--border-color)",
            padding: "0.75rem 0.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "var(--primary-main)",
                  margin: 0,
                }}
              >
                Top 5 Paradas Más Solicitadas (Destinos)
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Las 5 paradas de mayor afluencia en el campus y porcentaje de
                uso
              </span>
            </div>
            <i
              className="pi pi-map-marker"
              style={{ fontSize: "1.25rem", color: "#00acc1" }}
            />
          </div>
          <div style={{ height: "280px", position: "relative" }}>
            {loading ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ProgressSpinner
                  style={{ width: "30px", height: "30px" }}
                  strokeWidth="4"
                />
              </div>
            ) : destinations.length > 0 ? (
              <Chart
                type="doughnut"
                data={doughnutChartData}
                options={doughnutChartOptions}
                style={{ height: "100%" }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                No hay datos de paradas registrados.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Segunda Fila de Gráficos: Distribución de Trabajo y Tiempos de Ruta */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Distribución de Carga Operativa */}
        <Card
          style={{
            borderRadius: "1.25rem",
            border: "1px solid var(--border-color)",
            padding: "0.75rem 0.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--primary-main)",
              marginBottom: "0.25rem",
            }}
          >
            📊 Distribución de Trabajo por Conductor
          </h3>
          <span
            style={{
              fontSize: "0.8rem",
              color: "#64748b",
              display: "block",
              marginBottom: "1.25rem",
            }}
          >
            Porcentaje de viajes completados por conductor sobre la actividad
            total
          </span>
          <div style={{ height: "240px", position: "relative" }}>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <ProgressSpinner
                  style={{ width: "30px", height: "30px" }}
                  strokeWidth="4"
                />
              </div>
            ) : allDriversForKpis.length > 0 ? (
              <Chart
                type="doughnut"
                data={workDistributionChartData}
                options={doughnutChartOptions}
                style={{ height: "100%" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                }}
              >
                No hay datos operativos registrados.
              </div>
            )}
          </div>
        </Card>

        {/* Tiempos Promedio de Viaje por Ruta */}
        <Card
          style={{
            borderRadius: "1.25rem",
            border: "1px solid var(--border-color)",
            padding: "0.75rem 0.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--primary-main)",
              marginBottom: "0.25rem",
            }}
          >
            ⏱️ Tiempos Promedio de Viaje por Ruta
          </h3>
          <span
            style={{
              fontSize: "0.8rem",
              color: "#64748b",
              display: "block",
              marginBottom: "1.25rem",
            }}
          >
            Duración media en minutos de los trayectos completados más
            habituales del campus.
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              height: "240px",
              overflowY: "auto",
              paddingRight: "0.25rem",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <ProgressSpinner
                  style={{ width: "30px", height: "30px" }}
                  strokeWidth="4"
                />
              </div>
            ) : routes.length > 0 ? (
              routes.map((r, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#fafcff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "1rem",
                    padding: "0.75rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#334155" }}>
                      Desde: <strong>{r.origin_address}</strong>
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#334155" }}>
                      Hacia: <strong>{r.destination_address}</strong>
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                      ({r.count} viajes completados)
                    </span>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        color: "var(--primary-main)",
                      }}
                    >
                      {r.avg_duration_minutes}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      minutos
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                }}
              >
                No se registran datos suficientes sobre rutas completadas en la
                base de datos.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Leaderboard DataTable de Conductores */}
      <Card
        style={{
          borderRadius: "1.25rem",
          border: "1px solid var(--border-color)",
          padding: "0.75rem 0.5rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
        }}
      >
        {/* Cabecera de la Tabla */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--primary-main)",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              Rendimiento y Auditoría de Conductores
            </h3>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Estadísticas de finalización, cancelaciones, pasajeros llevados,
              ocupación y tiempos.
            </span>
          </div>
          <div
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar Conductor..."
              />
            </span>
            <Button
              label="Exportar CSV"
              icon="pi pi-file-excel"
              onClick={exportCSV}
              className="p-button-outlined"
            />
          </div>
        </div>

        {/* PrimeReact DataTable */}
        <DataTable
          ref={dt}
          value={drivers}
          lazy
          paginator
          first={(driversPage - 1) * 5}
          rows={5}
          totalRecords={driversTotal}
          onPage={(e) => setDriversPage(e.page + 1)}
          emptyMessage="No se encontraron conductores registrados en el sistema."
          rowHover
          className="p-datatable-sm"
          tableStyle={{ minWidth: "60rem" }}
          loading={driversLoading}
        >
          <Column
            field="name"
            header="Conductor"
            body={driverNameTemplate}
            sortable
            style={{ width: "25%" }}
          />
          <Column
            field="completed_trips"
            header="Carreras Finalizadas"
            sortable
            style={{ textAlign: "center", width: "12%" }}
          />
          <Column
            field="canceled_trips"
            header="Cancelaciones"
            sortable
            style={{ textAlign: "center", width: "12%" }}
          />
          <Column
            field="total_passengers"
            header="Pasajeros"
            sortable
            style={{ textAlign: "center", width: "10%" }}
          />
          <Column
            field="avg_passengers"
            header="Ocupación Prom."
            body={(rowData) => `${rowData.avg_passengers} pas.`}
            sortable
            style={{ textAlign: "center", width: "13%" }}
          />
          <Column
            field="avg_duration_minutes"
            header="Tiempo Prom."
            body={(rowData) => `${rowData.avg_duration_minutes} min.`}
            sortable
            style={{ textAlign: "center", width: "12%" }}
          />
          <Column
            field="score"
            header="Calificación"
            body={ratingTemplate}
            sortable
            style={{ width: "12%" }}
          />
          <Column
            body={actionTemplate}
            style={{ textAlign: "center", width: "4%" }}
          />
        </DataTable>
      </Card>

      {/* Modal Dialog para Detalle del Conductor */}
      <Dialog
        header="Hoja de Auditoría Individual"
        visible={detailVisible}
        style={{ width: "420px", borderRadius: "1.25rem" }}
        onHide={() => setDetailVisible(false)}
        draggable={false}
        resizable={false}
        headerStyle={{ borderBottom: "1px solid #f1f5f9", padding: "1.25rem" }}
        contentStyle={{ padding: "1.25rem" }}
      >
        {selectedDriver && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              alignItems: "center",
            }}
          >
            {/* Avatar Grande */}
            <div
              style={{
                width: "4.5rem",
                height: "4.5rem",
                borderRadius: "50%",
                backgroundColor: "#eff6ff",
                color: "var(--primary-main)",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #dbeafe",
                fontSize: "2rem",
                boxShadow: "0 4px 15px rgba(30,136,229,0.1)",
              }}
            >
              {selectedDriver.name
                ? selectedDriver.name.slice(0, 1).toUpperCase()
                : "C"}
            </div>

            {/* Nombre y Correo */}
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "var(--primary-main)",
                  margin: 0,
                }}
              >
                {selectedDriver.name}
              </h2>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {selectedDriver.email}
              </span>
            </div>

            {/* Tarjeta de Métricas Rápidas */}
            <div
              style={{
                width: "100%",
                backgroundColor: "#fafcff",
                border: "1px solid #e2e8f0",
                borderRadius: "1rem",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed #e2e8f0",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  Carreras Realizadas
                </span>
                <strong style={{ color: "var(--primary-main)" }}>
                  {selectedDriver.completed_trips} viajes
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed #e2e8f0",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  Cancelaciones
                </span>
                <strong style={{ color: "#ef4444" }}>
                  {selectedDriver.canceled_trips} viajes
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed #e2e8f0",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  Pasajeros Llevados
                </span>
                <strong style={{ color: "var(--primary-main)" }}>
                  {selectedDriver.total_passengers} pasajeros
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed #e2e8f0",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  Ocupación Promedio
                </span>
                <strong style={{ color: "var(--primary-main)" }}>
                  {selectedDriver.avg_passengers} pasajeros
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed #e2e8f0",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  Tiempo Promedio de Viaje
                </span>
                <strong style={{ color: "var(--primary-main)" }}>
                  {selectedDriver.avg_duration_minutes} min.
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed #e2e8f0",
                  paddingBottom: "0.5rem",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  Valoración Acumulada
                </span>
                <strong>{ratingTemplate(selectedDriver)}</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "0.25rem",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  Estado Operativo
                </span>
                <strong>{statusTemplate(selectedDriver)}</strong>
              </div>
            </div>

            <Button
              label="Cerrar Auditoría"
              onClick={() => setDetailVisible(false)}
              className="p-button-outlined"
              style={{
                width: "100%",
                borderRadius: "999px",
                marginTop: "0.5rem",
              }}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
