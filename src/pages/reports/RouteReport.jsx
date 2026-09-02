import { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { fetchReportsAllSummary, fetchReportsRoutesSummary, fetchReportsTripsCoordinates, exportRoutesReport } from "../../services/adminService";
import HeatMap from "../../components/HeatMap";
import DateRangeFilter from "../../components/ui/DateRangeFilter";
import CustomDataTable from "../../components/ui/CustomDataTable";
import RouteReportCharts from "../../components/reports/RouteReportCharts";

export default function RouteReport() {
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState([]);
  const [routesList, setRoutesList] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [waitTimes, setWaitTimes] = useState([]);
  const [coordinates, setCoordinates] = useState([]);

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
      setCancellations(data.cancellations || []);
      setWaitTimes(data.wait_times || []);
      setRoutes(data.routes || []);

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
  }, [debouncedGlobalFilter, routesPage]);

  const handleExport = async () => {
    const params = {
      start_date: startDate ? formatDate(startDate) : null,
      end_date: endDate ? formatDate(endDate) : null,
    };
    if (debouncedGlobalFilter) {
      params.search = debouncedGlobalFilter;
    }
    await exportRoutesReport(params);
  };

  const tableColumns = [
    { field: "origin_address", header: "Origen" },
    { field: "destination_address", header: "Destino" },
    { field: "completed_trips", header: "Completados" },
    { field: "canceled_trips", header: "Cancelados" },
    { field: "avg_duration_minutes", header: "Duración Prom. (min)" },
  ];

  return (
    <div className="reports-layout" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>Reporte de Rutas y Tráfico</h1>
          <p>Visualización de zonas de calor, destinos principales y rutas más transitadas.</p>
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

      <RouteReportCharts 
        destinations={destinations}
        cancellations={cancellations}
        waitTimes={waitTimes}
        coordinates={coordinates}
        routes={routes}
        loading={loading}
      />

      <CustomDataTable
        value={routesList}
        columns={tableColumns}
        loading={loading}
        page={routesPage}
        totalRecords={routesTotal}
        onPageChange={setRoutesPage}
        title="Historial de Rutas"
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        searchPlaceholder="Buscar ruta..."
        onExport={handleExport}
        showExport={true}
      />
    </div>
  );
}
