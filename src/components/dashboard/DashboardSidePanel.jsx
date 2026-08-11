import React from 'react';
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

export default function DashboardSidePanel({
  activeDrivers,
  offlineDrivers,
  disconnectRequests,
  approvedDisconnects,
  handleApproveDisconnect,
  handleRejectDisconnect,
  shifts,
  selectedShiftId,
  setSelectedShiftId,
}) {
  return (
    <div
      className="dashboard-side-card"
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: "1.25rem",
        background: "#fafcff",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1rem",
        height: "100%",
        overflowY: "auto"
      }}
    >
      {/* Disconnect Requests */}
      {disconnectRequests.length > 0 && (
        <div className="dashboard-driver-list" style={{ marginBottom: "0.5rem" }}>
          <h3
            style={{
              color: "var(--brand-900)",
              marginTop: 0,
              marginBottom: "0.5rem",
              fontSize: "1.05rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <i className="pi pi-exclamation-triangle" style={{ color: "#eab308" }} />
            Solicitudes de Desconexión
          </h3>
          {disconnectRequests.map((req, idx) => (
            <div
              key={idx}
              className="dashboard-driver-item"
              style={{
                border: "1px solid #fef08a",
                background: "#fef9c3",
                flexDirection: "column",
                alignItems: "stretch",
                gap: "0.5rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "#854d0e", fontSize: "0.95rem" }}>{req.driverName}</strong>
              </div>
              <p style={{ margin: "0", fontSize: "0.85rem", color: "#a16207" }}>
                Motivo: "{req.reason}"
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                <Button 
                  icon="pi pi-check" 
                  size="small" 
                  severity="success" 
                  onClick={() => handleApproveDisconnect(idx)} 
                  style={{ flex: 1, padding: "0.25rem" }}
                />
                <Button 
                  icon="pi pi-times" 
                  size="small" 
                  severity="danger" 
                  outlined
                  onClick={() => handleRejectDisconnect(idx)} 
                  style={{ flex: 1, padding: "0.25rem" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3
          style={{
            fontSize: "1.15rem",
            fontWeight: 800,
            color: "var(--primary-main)",
            marginBottom: "1rem",
            marginTop: 0,
          }}
        >
          Carritos Activos en Campus ({activeDrivers.length})
        </h3>

        <div
          className="dashboard-driver-list"
          style={{
            maxHeight: "250px",
            overflowY: "auto",
            paddingRight: "0.25rem",
          }}
        >
          {activeDrivers.length > 0 ? (
            activeDrivers.map((driver) => (
              <div
                key={driver.id}
                className="dashboard-driver-item-premium"
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className="driver-premium-avatar">
                    {driver.name ? driver.name.slice(0, 1).toUpperCase() : "C"}
                  </div>
                  <div className="driver-premium-info">
                    <strong>
                      {driver.name || `Conductor #${driver.id}`}
                    </strong>
                    {driver.is_in_event && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '0.65rem', 
                        padding: '2px 6px', 
                        backgroundColor: 'var(--primary)', 
                        color: 'white', 
                        borderRadius: '4px',
                        fontWeight: 'bold' 
                      }}>
                        EN EVENTO
                      </span>
                    )}
                    {driver.vehicle && (
                      <span
                        className="driver-subtext"
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <i className="pi pi-car" /> {driver.vehicle.brand}{" "}
                        ({driver.vehicle.plate})
                      </span>
                    )}
                    <span className="driver-subtext">
                      <i className="pi pi-map-marker" />{" "}
                      {driver.latitude?.toFixed(5)},{" "}
                      {driver.longitude?.toFixed(5)}
                    </span>
                    <span
                      className="driver-subtext"
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-tertiary)",
                        marginTop: "0.25rem",
                      }}
                    >
                      <i
                        className="pi pi-clock"
                        style={{ fontSize: "0.7rem" }}
                      />{" "}
                      {driver.location_updated_at
                        ? new Date(
                            driver.location_updated_at,
                          ).toLocaleTimeString("es-ES")
                        : "en vivo"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "0.35rem",
                  }}
                >
                  <Tag
                    value="En línea"
                    severity="success"
                    style={{
                      borderRadius: "0.5rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.5rem",
                    }}
                  />
                  {driver.vehicle?.status === "maintenance" && (
                    <Tag
                      value="Mantenimiento"
                      severity="warning"
                      style={{
                        borderRadius: "0.5rem",
                        fontWeight: 700,
                        padding: "0.25rem 0.5rem",
                      }}
                    />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div
              className="empty-state"
              style={{
                padding: "3.5rem 1rem",
                background: "white",
                borderRadius: "1rem",
                border: "1px dashed var(--border-color)",
                textAlign: "center",
              }}
            >
              <i
                className="pi pi-car"
                style={{
                  fontSize: "3rem",
                  color: "var(--border-color)",
                  marginBottom: "1rem",
                  opacity: 0.8,
                }}
              />
              <h3
                style={{
                  margin: "0.5rem 0",
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                }}
              >
                No hay carritos conectados
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                Cuando un conductor active su GPS desde la aplicación móvil, aparecerá aquí.
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#6c757d",
              margin: 0,
            }}
          >
            Conductores Desconectados ({offlineDrivers.length})
          </h3>
          <Dropdown
            value={selectedShiftId}
            options={[
              { label: 'Horario Actual', value: null },
              ...shifts.map(s => ({ label: s.name, value: s.id }))
            ]}
            onChange={(e) => setSelectedShiftId(e.value)}
            placeholder="Filtrar por turno"
            style={{ minWidth: '150px' }}
          />
        </div>

        <div
          className="dashboard-driver-list"
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            paddingRight: "0.25rem",
          }}
        >
          {offlineDrivers.length > 0 ? (
            offlineDrivers.map((driver) => (
              <div
                key={driver.id}
                className="dashboard-driver-item-premium"
                style={{ opacity: 0.7 }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    className="driver-premium-avatar"
                    style={{ background: "#e9ecef", color: "#6c757d" }}
                  >
                    {driver.name ? driver.name.slice(0, 1).toUpperCase() : "C"}
                  </div>
                  <div className="driver-premium-info">
                    <strong>
                      {driver.name || `Conductor #${driver.id}`}
                    </strong>
                  </div>
                </div>
                <Tag
                  value={approvedDisconnects?.has(driver.id) ? "Desconexión Aprobada" : "Offline"}
                  severity={approvedDisconnects?.has(driver.id) ? "info" : "secondary"}
                  style={{
                    borderRadius: "0.5rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.5rem",
                  }}
                />
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "1rem",
                textAlign: "center",
                color: "#6c757d",
                fontSize: "0.9rem",
              }}
            >
              Todos los conductores están activos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
