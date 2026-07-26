import { useEffect, useMemo, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { ProgressSpinner } from "primereact/progressspinner";
import { fetchReportsAllSummary, fetchReportsDriversSummary } from "../../services/adminService";

export default function DriverReport() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [allDriversForKpis, setAllDriversForKpis] = useState([]);
  const [ratings, setRatings] = useState({ distribution: [], comments: [] });
  const dt = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [driversPage, setDriversPage] = useState(1);
  const [driversTotal, setDriversTotal] = useState(0);

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

  const fetchPaginatedDrivers = async (pageVal, searchVal) => {
    try {
      const params = { per_page: 5, page: pageVal, search: searchVal };
      if (startDate) params.start_date = formatDate(startDate);
      if (endDate) params.end_date = formatDate(endDate);

      const result = await fetchReportsDriversSummary(params);
      setDrivers(result?.data || []);
      setDriversTotal(result?.total || 0);
    } catch (error) {
      console.error("Error al cargar conductores paginados:", error);
    }
  };

  const loadData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = formatDate(startDate);
      if (endDate) params.end_date = formatDate(endDate);

      const data = await fetchReportsAllSummary(params);
      setAllDriversForKpis(data.drivers || []);
      setRatings(data.ratings || { distribution: [], comments: [] });

      await fetchPaginatedDrivers(1, debouncedGlobalFilter);
      setDriversPage(1);
    } catch (error) {
      console.error("Error al cargar datos del reporte:", error);
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
      setDriversPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  useEffect(() => {
    if (!loading) {
      fetchPaginatedDrivers(driversPage, debouncedGlobalFilter);
    }
  }, [driversPage, debouncedGlobalFilter]);

  const totalCompletedTrips = useMemo(() => allDriversForKpis.reduce((sum, d) => sum + parseInt(d.completed_trips || 0), 0), [allDriversForKpis]);
  const averageSystemScore = useMemo(() => {
    const ratedDrivers = allDriversForKpis.filter((d) => d.rating_count > 0);
    if (ratedDrivers.length === 0) return 5.0;
    const sum = ratedDrivers.reduce((acc, d) => acc + parseFloat(d.score || 0), 0);
    return (sum / ratedDrivers.length).toFixed(2);
  }, [allDriversForKpis]);

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
    ratings.distribution.forEach((item) => {
      if (item.stars >= 1 && item.stars <= 5) {
        defaultData[item.stars - 1] = item.count;
      }
    });

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


  const statusTemplate = (rowData) => (
    <Tag
      value={rowData.is_active ? "Activo" : "Inactivo"}
      severity={rowData.is_active ? "success" : "danger"}
      style={{ borderRadius: "999px", padding: "0.25rem 0.6rem" }}
    />
  );

  const exportExcel = () => {
    if (dt.current) {
      dt.current.exportCSV();
    }
  };

  return (
    <div className="reports-layout" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>Reporte de Conductores</h1>
          <p>Auditoría de rendimiento, cancelaciones y calificaciones de los conductores.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Calendar value={startDate} onChange={(e) => setStartDate(e.value)} placeholder="Inicio" dateFormat="dd/mm/yy" style={{ width: "130px" }} />
          <Calendar value={endDate} onChange={(e) => setEndDate(e.value)} placeholder="Fin" dateFormat="dd/mm/yy" style={{ width: "130px" }} />
          <Button icon="pi pi-filter" label="Filtrar" severity="warning" onClick={() => loadData(true)} />
        </div>
      </div>

      <div className="dashboard-grid-premium">
        <div className="stat-card-premium blue">
          <div className="stat-premium-info">
            <span>Carreras Completadas</span>
            <h2>{totalCompletedTrips}</h2>
          </div>
          <div className="stat-premium-icon"><i className="pi pi-check-circle" /></div>
        </div>
        <div className="stat-card-premium amber">
          <div className="stat-premium-info">
            <span>Calificación Promedio</span>
            <h2>{averageSystemScore} ★</h2>
          </div>
          <div className="stat-premium-icon"><i className="pi pi-star-fill" /></div>
        </div>
      </div>

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
            ) : ratings.distribution.length > 0 ? (
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
            ) : ratings.comments.length > 0 ? (
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

      <Card className="management-table">
        <div className="management-toolbar">
          <h3>Detalle de Conductores</h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar conductor..." />
            </span>
            <Button type="button" icon="pi pi-file-excel" severity="success" rounded onClick={exportExcel} data-pr-tooltip="Exportar Excel" />
          </div>
        </div>
        <DataTable ref={dt} value={drivers} lazy paginator first={(driversPage - 1) * 5} rows={5} totalRecords={driversTotal} onPage={(e) => setDriversPage(e.page + 1)} loading={loading} responsiveLayout="scroll">
          <Column field="name" header="Nombre" />
          <Column field="email" header="Correo" />
          <Column field="completed_trips" header="Completados" />
          <Column field="canceled_trips" header="Cancelados" />
          <Column header="Estado" body={statusTemplate} />
        </DataTable>
      </Card>
    </div>
  );
}
