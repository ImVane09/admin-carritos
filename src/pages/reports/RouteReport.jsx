import { useEffect, useMemo, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { fetchReportsAllSummary, fetchReportsRoutesSummary, fetchReportsTripsCoordinates } from "../../services/adminService";
import { ProgressSpinner } from "primereact/progressspinner";
import HeatMap from "../../components/HeatMap";

export default function RouteReport() {
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [waitTimes, setWaitTimes] = useState([]);
  const [coordinates, setCoordinates] = useState([]);

  const [routesList, setRoutesList] = useState([]);
  const dt = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [routesPage, setRoutesPage] = useState(1);
  const [routesTotal, setRoutesTotal] = useState(0);

  const [startDate, setStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return start;
  });

  const [endDate, setEndDate] = useState(() => new Date());

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

  const fetchPaginatedRoutes = async (pageVal, searchVal) => {
    try {
      const params = { per_page: 5, page: pageVal, search: searchVal };
      if (startDate) params.start_date = formatDate(startDate);
      if (endDate) params.end_date = formatDate(endDate);

      const result = await fetchReportsRoutesSummary(params);
      setRoutesList(result?.data || []);
      setRoutesTotal(result?.total || 0);
    } catch (error) {
      console.error("Error al cargar rutas paginadas:", error);
    }
  };

  const loadData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = formatDate(startDate);
      if (endDate) params.end_date = formatDate(endDate);

      const data = await fetchReportsAllSummary(params);
      setDestinations(data.destinations || []);
      setRoutes(data.routes || []);
      setCancellations(data.cancellations || []);
      setWaitTimes(data.wait_times || []);

      const coords = await fetchReportsTripsCoordinates(params);
      setCoordinates(coords || []);

      await fetchPaginatedRoutes(1, debouncedGlobalFilter);
      setRoutesPage(1);
    } catch (error) {
      console.error("Error al cargar datos del reporte de rutas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      setRoutesPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  useEffect(() => {
    if (!loading) {
      fetchPaginatedRoutes(routesPage, debouncedGlobalFilter);
    }
  }, [routesPage, debouncedGlobalFilter]);

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

  const exportExcel = () => {
    if (dt.current) {
      dt.current.exportCSV();
    }
  };

  return (
    <div className="reports-layout" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>Reporte de Rutas</h1>
          <p>Análisis de las rutas más frecuentes, paradas principales y tiempos de recorrido.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Calendar value={startDate} onChange={(e) => setStartDate(e.value)} placeholder="Inicio" dateFormat="dd/mm/yy" style={{ width: "130px" }} />
          <Calendar value={endDate} onChange={(e) => setEndDate(e.value)} placeholder="Fin" dateFormat="dd/mm/yy" style={{ width: "130px" }} />
          <Button icon="pi pi-filter" label="Filtrar" severity="warning" onClick={() => loadData(true)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.25rem" }}>
        {/* Heatmap */}
        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Mapa de Solicitudes</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Concentración de puntos de inicio de los viajes (Heatmap).</span>
          <div style={{ height: "300px", position: "relative" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
            ) : coordinates.length > 0 ? (
              <HeatMap points={coordinates} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                No hay coordenadas registradas.
              </div>
            )}
          </div>
        </Card>

        {/* Destinos más Utilizados */}
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
                No hay datos de paradas registrados.
              </div>
            )}
          </div>
        </Card>

        {/* Tiempos Promedio de Viaje por Ruta */}
        <Card style={{ borderRadius: "1.25rem", border: "1px solid var(--border-color)", padding: "0.75rem 0.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary-main)", marginBottom: "0.25rem" }}>Tiempos Promedio de Viaje por Ruta</h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "1.25rem" }}>Duración media en minutos de los trayectos completados.</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "300px", overflowY: "auto", paddingRight: "0.25rem" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              </div>
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
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                No se registran datos suficientes sobre rutas completadas.
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

      <Card className="management-table">
        <div className="management-toolbar">
          <h3>Detalle de Rutas / Destinos</h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar origen o destino..." />
            </span>
            <Button type="button" icon="pi pi-file-excel" severity="success" rounded onClick={exportExcel} data-pr-tooltip="Exportar Excel" />
          </div>
        </div>
        <DataTable ref={dt} value={routesList} lazy paginator first={(routesPage - 1) * 5} rows={5} totalRecords={routesTotal} onPage={(e) => setRoutesPage(e.page + 1)} loading={loading} responsiveLayout="scroll">
          <Column field="origin_address" header="Origen" />
          <Column field="destination_address" header="Destino" />
          <Column field="completed_trips" header="Completados" />
          <Column field="canceled_trips" header="Cancelados" />
          <Column field="avg_duration_minutes" header="Duración Promedio (min)" />
        </DataTable>
      </Card>
    </div>
  );
}
