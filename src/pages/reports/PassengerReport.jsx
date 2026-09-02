import { useEffect, useState } from "react";
import { Tag } from "primereact/tag";
import {
  fetchReportsAllSummary,
  fetchReportsPassengersSummary,
  exportPassengersReport,
} from "../../services/adminService";
import DateRangeFilter from "../../components/ui/DateRangeFilter";
import PassengerReportCharts from "../../components/reports/PassengerReportCharts";
import CustomDataTable from "../../components/ui/CustomDataTable";

export default function PassengerReport() {
  const [loading, setLoading] = useState(true);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [waitTimes, setWaitTimes] = useState([]);

  const [passengers, setPassengers] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [passengersPage, setPassengersPage] = useState(1);
  const [passengersTotal, setPassengersTotal] = useState(0);

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

  const fetchPaginatedPassengers = async (pageVal, searchVal) => {
    try {
      const params = { per_page: 5, page: pageVal, search: searchVal };
      if (startDate) params.start_date = formatDate(startDate);
      if (endDate) params.end_date = formatDate(endDate);

      const result = await fetchReportsPassengersSummary(params);
      setPassengers(result?.data || []);
      setPassengersTotal(result?.total || 0);
    } catch (error) {
      console.error("Error al cargar pasajeros paginados:", error);
    }
  };

  const loadData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = formatDate(startDate);
      if (endDate) params.end_date = formatDate(endDate);

      const data = await fetchReportsAllSummary(params);
      setHourly(data.hourly || []);
      setDaily(data.daily || []);
      setCancellations(data.cancellations || []);
      setWaitTimes(data.wait_times || []);

      await fetchPaginatedPassengers(1, debouncedGlobalFilter);
      setPassengersPage(1);
    } catch (error) {
      console.error("Error al cargar datos del reporte de pasajeros:", error);
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
      setPassengersPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  useEffect(() => {
    if (!loading) {
      fetchPaginatedPassengers(passengersPage, debouncedGlobalFilter);
    }
  }, [debouncedGlobalFilter, passengersPage]);

  const handleExport = async () => {
    const params = {
      start_date: startDate ? formatDate(startDate) : null,
      end_date: endDate ? formatDate(endDate) : null,
    };
    if (debouncedGlobalFilter) {
      params.search = debouncedGlobalFilter;
    }
    await exportPassengersReport(params);
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
    { header: "Estado", body: statusTemplate },
  ];

  return (
    <div
      className="reports-layout"
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>Reporte de Pasajeros y Demanda</h1>
          <p>
            Análisis de flujos, horarios pico de transporte y comportamiento
            <br />
            general de la demanda diaria.
          </p>
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

      <PassengerReportCharts
        hourly={hourly}
        daily={daily}
        cancellations={cancellations}
        waitTimes={waitTimes}
        loading={loading}
      />

      <CustomDataTable
        value={passengers}
        columns={tableColumns}
        loading={loading}
        page={passengersPage}
        totalRecords={passengersTotal}
        onPageChange={setPassengersPage}
        title="Detalle de Pasajeros"
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        searchPlaceholder="Buscar pasajero..."
        onExport={handleExport}
        showExport={true}
      />
    </div>
  );
}
