import { useEffect, useState, useMemo } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import {
  fetchReportsAllSummary,
  fetchReportsDriversSummary,
} from "../services/adminService";
import DateRangeFilter from "../components/ui/DateRangeFilter";
import CustomDataTable from "../components/ui/CustomDataTable";
import ReportsPageStats from "../components/reports/ReportsPageStats";
import ReportsPageCharts from "../components/reports/ReportsPageCharts";

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
  const [endDate, setEndDate] = useState(() => new Date());

  const [selectedDriver, setSelectedDriver] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

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
    if (showSpinner) setLoading(true);
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

  // Derived KPIs para ReportsPageStats
  const totalPassengers = useMemo(() => hourly.reduce((sum, h) => sum + parseInt(h.passengers_count || 0), 0), [hourly]);
  const operationalEfficiency = useMemo(() => stats.trips > 0 ? ((stats.completed / stats.trips) * 100).toFixed(1) : 0, [stats]);

  // Templates
  const driverNameTemplate = (rowData) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", backgroundColor: "#eff6ff", color: "var(--primary-main)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #dbeafe", fontSize: "0.95rem" }}>
        {rowData.name ? rowData.name.slice(0, 1).toUpperCase() : "C"}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: 700, color: "var(--primary-main)" }}>{rowData.name}</span>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{rowData.email}</span>
      </div>
    </div>
  );

  const ratingTemplate = (rowData) => {
    const score = parseFloat(rowData.score || 0);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <i className="pi pi-star-fill" style={{ color: "#fbbf24", fontSize: "0.85rem" }} />
        <span style={{ marginLeft: "0.4rem", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
          {score.toFixed(1)}
        </span>
      </div>
    );
  };

  const statusTemplate = (rowData) => (
    <Tag value={rowData.is_active ? "Activo" : "Inactivo"} severity={rowData.is_active ? "success" : "danger"} style={{ borderRadius: "999px", padding: "0.25rem 0.6rem", fontWeight: 700 }} />
  );

  const actionTemplate = (rowData) => (
    <Button icon="pi pi-eye" severity="info" text onClick={() => { setSelectedDriver(rowData); setDetailVisible(true); }} tooltip="Ver Detalles" tooltipOptions={{ position: "bottom" }} />
  );

  const tableColumns = [
    { field: "name", header: "Conductor", body: driverNameTemplate },
    { field: "completed_trips", header: "Completados" },
    { field: "canceled_trips", header: "Cancelados" },
    { field: "passengers_transported", header: "Pasajeros Llevados" },
    { field: "score", header: "Calificación Prom.", body: ratingTemplate },
    { header: "Estado", body: statusTemplate },
    { header: "Acción", body: actionTemplate }
  ];

  const resetFilters = () => {
    const defaultStart = new Date();
    defaultStart.setMonth(defaultStart.getMonth() - 1);
    setStartDate(defaultStart);
    setEndDate(new Date());
    setTimeout(() => loadData(true), 0);
  };

  return (
    <div className="reports-layout" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>Reportes e Inteligencia de Datos</h1>
          <p>Auditoría de rendimiento de la red de transporte universitario, paradas y distribución horaria en base a datos reales de la plataforma.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <DateRangeFilter startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} onFilter={loadData} loading={loading} />
          <Button icon="pi pi-refresh" label="Restablecer" severity="info" size="small" outlined onClick={resetFilters} style={{ borderRadius: "999px", color: "white", borderColor: "rgba(255,255,255,0.4)" }} />
        </div>
      </div>

      <ReportsPageStats loading={loading} allDriversForKpis={allDriversForKpis} totalPassengers={totalPassengers} operationalEfficiency={operationalEfficiency} stats={stats} />

      <ReportsPageCharts loading={loading} hourly={hourly} drivers={drivers} allDriversForKpis={allDriversForKpis} daily={daily} destinations={destinations} routes={routes} />

      <CustomDataTable
        value={drivers}
        columns={tableColumns}
        loading={driversLoading}
        page={driversPage}
        totalRecords={driversTotal}
        onPageChange={setDriversPage}
        title="Rendimiento y Auditoría de Conductores"
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        searchPlaceholder="Buscar Conductor..."
      />

      <Dialog visible={detailVisible} onHide={() => setDetailVisible(false)} header={`Detalles del Conductor - ${selectedDriver?.name || ""}`} style={{ width: "450px" }} modal breakpoints={{ "960px": "75vw", "641px": "100vw" }}>
        {selectedDriver && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Completados</span>
                <h3 style={{ margin: "0.25rem 0 0 0", color: "#10b981", fontSize: "1.5rem" }}>{selectedDriver.completed_trips || 0}</h3>
              </div>
              <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Cancelados</span>
                <h3 style={{ margin: "0.25rem 0 0 0", color: "#ef4444", fontSize: "1.5rem" }}>{selectedDriver.canceled_trips || 0}</h3>
              </div>
              <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Pasajeros Llevados</span>
                <h3 style={{ margin: "0.25rem 0 0 0", color: "#3b82f6", fontSize: "1.5rem" }}>{selectedDriver.passengers_transported || 0}</h3>
              </div>
              <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Calificación Promedio</span>
                <h3 style={{ margin: "0.25rem 0 0 0", color: "#f59e0b", fontSize: "1.5rem" }}>{parseFloat(selectedDriver.score || 0).toFixed(1)} ★</h3>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
