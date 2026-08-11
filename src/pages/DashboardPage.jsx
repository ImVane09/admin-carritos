import { useEffect, useMemo, useState } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  fetchDestinations,
  fetchDrivers,
  fetchAllDrivers,
  fetchDashboardStats,
  fetchHourlyReport,
  fetchShifts,
  approveDriverDisconnect,
  rejectDriverDisconnect,
} from "../services/adminService";
import DashboardLiveMap from "../components/DashboardLiveMap";
import { createEcho } from "../services/echoService";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";

const CAMPUS_CENTER = [-0.9525, -80.745];

import StatCardPremium from "../components/StatCardPremium";
import DashboardStatsGrid from "../components/dashboard/DashboardStatsGrid";
import DashboardSidePanel from "../components/dashboard/DashboardSidePanel";

export default function DashboardPage() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    drivers: 0,
    trips: 0,
    active: 0,
    completed: 0,
    destinations: 0,
  });
  const [drivers, setDrivers] = useState([]);
  const [approvedDisconnects, setApprovedDisconnects] = useState(new Set());
  const [allDrivers, setAllDrivers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [disconnectRequests, setDisconnectRequests] = useState([]);
  const [hourlyData, setHourlyData] = useState(null);
  const [cancellations, setCancellations] = useState([]);
  const [waitTimes, setWaitTimes] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState(null);

  const activeDrivers = useMemo(() => {
    return drivers.filter(
      (driver) =>
        driver.is_online &&
        driver.latitude !== null &&
        driver.longitude !== null,
    );
  }, [drivers]);

  const offlineDrivers = useMemo(() => {
    const activeIds = activeDrivers.map((d) => d.id);
    return allDrivers.filter((d) => {
      if (activeIds.includes(d.id)) return false;
      
      if (selectedShiftId) {
        return d.shift_id === selectedShiftId;
      }
      
      return d.is_in_shift;
    });
  }, [allDrivers, activeDrivers, selectedShiftId]);

  useEffect(() => {
    let echoInstance = null;

    // 1. Cargar destinos una sola vez al montar el componente (son estáticos)
    const loadDestinations = async () => {
      try {
        const list = await fetchDestinations({ only_active: true });
        setDestinations(list || []);
      } catch (error) {
        console.error("Error al cargar destinos del campus:", error);
      }
    };
    loadDestinations();

    // 2. Cargar estadísticas y conductores en línea de manera asíncrona
    const loadDynamicData = async (isInitial = false) => {
      if (isInitial) setStatsLoading(true);
      try {
        const [dashboardStats, driversList, allDriversList, hourlyReport, shiftsList] =
          await Promise.all([
            fetchDashboardStats(),
            fetchDrivers(),
            fetchAllDrivers(),
            fetchHourlyReport(),
            fetchShifts({ status: 'active' })
          ]);

        setShifts(shiftsList?.data || shiftsList || []);

        setStats(dashboardStats);
        setDrivers(driversList);
        
        // Populate initial disconnect requests
        const pendingRequests = driversList
          .filter(d => d.is_disconnect_pending)
          .map(d => ({
            driverId: d.id,
            driverName: d.name,
            reason: "Pendiente de aprobación (recargado)",
            timestamp: new Date().toISOString()
          }));
        setDisconnectRequests(prev => {
          // Merge avoiding duplicates
          const newRequests = [...prev];
          pendingRequests.forEach(req => {
            if (!newRequests.find(r => r.driverId === req.driverId)) {
              newRequests.push(req);
            }
          });
          return newRequests;
        });
        setAllDrivers(
          allDriversList.filter(
            (u) =>
              u.rol?.rol_name === "conductor" ||
              u.rol_id === 3 ||
              u.role === "conductor",
          ),
        );
        setCancellations(dashboardStats.cancellations || []);
        setWaitTimes(dashboardStats.wait_times || []);
        setApprovedDisconnects(new Set(dashboardStats.approved_disconnects || []));

        if (hourlyReport) {
          setHourlyData({
            labels: hourlyReport.labels || [],
            datasets: [
              {
                label: "Viajes Completados",
                data: hourlyReport.data || [],
                fill: true,
                borderColor: "#1E88E5",
                tension: 0.4,
                backgroundColor: "rgba(30, 136, 229, 0.1)",
              },
            ],
          });
        }

        setLastUpdate(new Date());
      } catch (error) {
        console.error(
          "Error al cargar datos en tiempo real del dashboard:",
          error,
        );
      } finally {
        if (isInitial) setStatsLoading(false);
      }
    };

    loadDynamicData(true);

    // 3. Inicializar WebSocket para actualización de GPS en vivo
    const token = localStorage.getItem("admin_token");
    if (token) {
      try {
        echoInstance = createEcho(token);
        
        // Función común para actualizar el estado del driver en vivo
        const handleDriverLocationUpdate = (event, isInEvent = false) => {
          setDrivers((prevDrivers) => {
            const driverExists = prevDrivers.find(
              (d) => d.id === event.driver_id,
            );
            if (driverExists) {
              return prevDrivers.map((d) =>
                d.id === event.driver_id
                  ? {
                      ...d,
                      latitude: parseFloat(event.latitude),
                      longitude: parseFloat(event.longitude),
                      location_updated_at:
                        event.timestamp || new Date().toISOString(),
                      is_online: true,
                      is_in_event: isInEvent
                    }
                  : d,
              );
            } else {
              return [
                ...prevDrivers,
                {
                  id: event.driver_id,
                  name: event.name || `Conductor ${event.driver_id}`,
                  latitude: parseFloat(event.latitude),
                  longitude: parseFloat(event.longitude),
                  location_updated_at:
                    event.timestamp || new Date().toISOString(),
                  is_online: true,
                  vehicle: event.vehicle,
                  is_in_event: isInEvent
                },
              ];
            }
          });
        };

        const adminChannel = echoInstance.private("admin.live_tracking");
        adminChannel.listen(".DriverGlobalLocationUpdated", (e) => handleDriverLocationUpdate(e, e.is_in_event || false));

        const statsChannel = echoInstance.channel("dashboard.stats");
        statsChannel.listen(".DashboardStatsUpdated", (event) => {
          if (event.stats) setStats(event.stats);
          if (event.stats?.cancellations)
            setCancellations(event.stats.cancellations);
          if (event.stats?.wait_times) setWaitTimes(event.stats.wait_times);

          if (event.hourly) {
            setHourlyData({
              labels: event.hourly.labels || [],
              datasets: [
                {
                  label: "Viajes Completados",
                  data: event.hourly.data || [],
                  fill: true,
                  borderColor: "#1E88E5",
                  tension: 0.4,
                  backgroundColor: "rgba(30, 136, 229, 0.1)",
                },
              ],
            });
          }
          setLastUpdate(new Date());
        });

        channel.listen(".DriverOffline", (event) => {
          setDrivers((prevDrivers) => {
            return prevDrivers.map((d) =>
              d.id === event.driver_id ? { ...d, is_online: false } : d,
            );
          });
        });

        // Escuchar cambios en las estadísticas del dashboard
        const publicChannel = echoInstance.channel("dashboard.stats");
        publicChannel.listen(".DashboardStatsUpdated", (event) => {
          if (event.stats) {
            setStats(event.stats);
            setCancellations(event.stats.cancellations || []);
            setWaitTimes(event.stats.wait_times || []);
          }
          if (event.hourly) {
            setHourlyData({
              labels: event.hourly.labels || [],
              datasets: [
                {
                  label: "Viajes Completados",
                  data: event.hourly.data || [],
                  fill: true,
                  borderColor: "#1E88E5",
                  tension: 0.4,
                  backgroundColor: "rgba(30, 136, 229, 0.1)",
                },
              ],
            });
          }
          setLastUpdate(new Date());
        });
      } catch (wsError) {
        console.error(
          "Error al inicializar la conexión de WebSockets:",
          wsError,
        );
      }

      try {
        const adminChannel = echoInstance.private("admin.notifications");
        adminChannel.listen(".driver.disconnect.requested", (event) => {
          setDisconnectRequests((prev) => [
            ...prev,
            {
              driverId: event.driverId,
              driverName: event.driverName,
              reason: event.reason,
            },
          ]);
        });
      } catch (wsError) {
        console.error("Error al inicializar notificaciones de admin:", wsError);
      }
    }

    return () => {
      if (echoInstance) {
        echoInstance.disconnect();
      }
    };
  }, []);

  const totalCancellations = useMemo(
    () =>
      cancellations.reduce((sum, item) => sum + parseInt(item.count || 0), 0),
    [cancellations],
  );
  const avgWaitTime = useMemo(() => {
    if (waitTimes.length === 0) return "0.0";
    const sum = waitTimes.reduce(
      (acc, item) => acc + parseFloat(item.avg_wait_minutes || 0),
      0,
    );
    return (sum / waitTimes.length).toFixed(1);
  }, [waitTimes]);

  const handleApproveDisconnect = async (requestIndex) => {
    const req = disconnectRequests[requestIndex];
    try {
      await approveDriverDisconnect(req.driverId);
      setApprovedDisconnects((prev) => new Set([...prev, req.driverId]));
      setDisconnectRequests((prev) =>
        prev.filter((_, i) => i !== requestIndex),
      );
    } catch (error) {
      console.error("Error approving disconnect:", error);
    }
  };

  const handleRejectDisconnect = async (requestIndex) => {
    const req = disconnectRequests[requestIndex];
    try {
      await rejectDriverDisconnect(req.driverId);
      setDisconnectRequests((prev) =>
        prev.filter((_, i) => i !== requestIndex),
      );
    } catch (error) {
      console.error("Error rejecting disconnect:", error);
    }
  };

  return (
    <div
      className="dashboard-layout"
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      {/* Banner de Bienvenida Premium */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>¡Bienvenido, Administrador!</h1>
          <p>
            Monitoreo unificado de la red de carritos y destinos del campus
            universitario.
          </p>
        </div>
        <div className="welcome-banner-date">
          <i className="pi pi-calendar" />
          <span>
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <DashboardStatsGrid
        stats={stats}
        statsLoading={statsLoading}
        activeDriversCount={activeDrivers.length}
        totalCancellations={totalCancellations}
        avgWaitTime={avgWaitTime}
      />

      {/* Panel Principal de Monitoreo */}
      <Card
        style={{
          borderRadius: "1.25rem",
          border: "1px solid var(--border-color)",
          padding: "0.75rem 0.5rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
        }}
      >
        {/* Cabecera del Panel de Monitoreo */}
        <div
          className="hero-panel-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "1.25rem",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "var(--primary-main)",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              Monitoreo Satelital en Tiempo Real
            </h2>
            <p
              style={{
                margin: "0.25rem 0 0",
                color: "var(--text-secondary)",
                fontSize: "0.95rem",
              }}
            >
              Seguimiento de carritos activos y destinos predeterminados del
              campus.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <div className="pulse-indicator">
              <div className="pulse-dot" />
              <span>SISTEMA EN VIVO</span>
            </div>
            <div
              className="welcome-banner-date"
              style={{
                color: "var(--text-primary)",
                background: "var(--border-light)",
                border: "1px solid var(--border-color)",
                padding: "0.5rem 1rem",
                borderRadius: "0.75rem",
              }}
            >
              <i
                className="pi pi-clock"
                style={{ color: "var(--primary-light)" }}
              />
              <span>
                Sincronizado:{" "}
                {lastUpdate
                  ? lastUpdate.toLocaleTimeString("es-ES")
                  : "conectando..."}
              </span>
            </div>
          </div>
        </div>

        {/* Grid del Mapa y Lista Lateral */}
        <div className="dashboard-monitor-grid">
          <div
            className="dashboard-map-card"
            style={{
              border: "1px solid var(--border-color)",
              borderRadius: "1.25rem",
              overflow: "hidden",
              padding: 0,
            }}
          >
            <DashboardLiveMap
              drivers={activeDrivers}
              destinations={destinations}
              center={CAMPUS_CENTER}
            />
          </div>

          <DashboardSidePanel
            activeDrivers={activeDrivers}
            offlineDrivers={offlineDrivers}
            disconnectRequests={disconnectRequests}
            approvedDisconnects={approvedDisconnects}
            handleApproveDisconnect={handleApproveDisconnect}
            handleRejectDisconnect={handleRejectDisconnect}
            shifts={shifts}
            selectedShiftId={selectedShiftId}
            setSelectedShiftId={setSelectedShiftId}
          />
        </div>
      </Card>
    </div>
  );
}
