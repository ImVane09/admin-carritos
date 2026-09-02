import { useEffect, useMemo, useState } from "react";
import { Tag } from "primereact/tag";
import { fetchReportsAllSummary, fetchReportsDriversSummary, exportDriversReport } from "../../services/adminService";
import DateRangeFilter from "../../components/ui/DateRangeFilter";
import CustomDataTable from "../../components/ui/CustomDataTable";
import DriverReportCharts from "../../components/reports/DriverReportCharts";

export default function DriverReport() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [allDriversForKpis, setAllDriversForKpis] = useState([]);
  const [ratings, setRatings] = useState({ distribution: [], comments: [] });
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

  const handleExport = async () => {
    const params = {
      start_date: startDate ? startDate.toISOString().split("T")[0] : null,
      end_date: endDate ? endDate.toISOString().split("T")[0] : null,
    };
    if (debouncedGlobalFilter) {
      params.search = debouncedGlobalFilter;
    }
    await exportDriversReport(params);
  };

  const statusTemplate = (rowData) => (
    <Tag
      value={rowData.is_active ? "Activo" : "Inactivo"}
      severity={rowData.is_active ? "success" : "danger"}
      style={{ borderRadius: "999px", padding: "0.25rem 0.6rem" }}
    />
  );

  const tableColumns = [
    { field: "name", header: "Nombre" },
    { field: "email", header: "Correo" },
    { field: "completed_trips", header: "Completados" },
    { field: "canceled_trips", header: "Cancelados" },
    { header: "Estado", body: statusTemplate }
  ];

  return (
    <div className="reports-layout" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>Reporte de Conductores</h1>
          <p>Auditoría de rendimiento, cancelaciones y calificaciones de los conductores.</p>
        </div>
        <DateRangeFilter
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onFilter={loadData}
          loading={loading}
        />
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

      <DriverReportCharts 
        drivers={drivers}
        ratings={ratings}
        loading={loading}
      />

      <CustomDataTable
        value={drivers}
        columns={tableColumns}
        loading={loading}
        page={driversPage}
        totalRecords={driversTotal}
        onPageChange={setDriversPage}
        title="Detalle de Conductores"
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        searchPlaceholder="Buscar conductor..."
        onExport={handleExport}
        showExport={true}
      />
    </div>
  );
}
