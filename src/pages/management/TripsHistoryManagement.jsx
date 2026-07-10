import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { fetchTrips } from "../../services/adminService";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function TripsHistoryManagement() {
  const toast = useRef(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchTrips({ per_page: 10, page, search: debouncedQuery });
        setTrips(result?.data || []);
        setTotalRecords(result?.total || 0);
      } catch (err) {
        console.error("Error al cargar historial de viajes:", err);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar el historial de viajes de la API.",
        });
        setTrips([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, debouncedQuery]);



  // Retorna color y texto del estado del viaje
  const getStatusBadge = (stateId, stateName) => {
    const name = stateName || "Desconocido";
    switch (stateId) {
      case 1: // Solicitado (Requested)
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: "#e3f2fd",
              color: "#1565c0",
              borderLeft: "3px solid #1565c0",
            }}
          >
            {name}
          </span>
        );
      case 2: // Aceptado (Accepted)
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: "#e0f7fa",
              color: "#00838f",
              borderLeft: "3px solid #00838f",
            }}
          >
            {name}
          </span>
        );
      case 4: // Iniciado / En curso (Started)
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: "#fff3e0",
              color: "#ef6c00",
              borderLeft: "3px solid #ef6c00",
            }}
          >
            {name}
          </span>
        );
      case 3: // Finalizado (Finished)
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: "#e8f5e9",
              color: "#2e7d32",
              borderLeft: "3px solid #2e7d32",
            }}
          >
            {name}
          </span>
        );
      case 5: // Cancelado (Cancelled)
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              borderLeft: "3px solid #c62828",
            }}
          >
            {name}
          </span>
        );
      default:
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: "#f5f5f5",
              color: "#666666",
              borderLeft: "3px solid #666666",
            }}
          >
            {name}
          </span>
        );
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const val = Math.round(Number(rating || 0));
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`pi ${i <= val ? "pi-star-fill" : "pi-star"}`}
          style={{
            color: i <= val ? "#fbc02d" : "#bdbdbd",
            marginRight: "2px",
            fontSize: "1rem",
          }}
        />,
      );
    }
    return <span>{stars}</span>;
  };

  return (
    <>
      <Toast ref={toast} />

      <div className="management-section">
        <div className="management-header">
          <i className="pi pi-history" />
          <div className="management-header-content">
            <h2>Historial de Viajes</h2>
            <p>
              Auditoría de trayectos, conductores asignados, distancias y
              opiniones de pasajeros
            </p>
          </div>
        </div>

        <Card className="management-table">
          <div className="management-toolbar">
            <h3>Lista de Viajes ({totalRecords})</h3>
            <div className="management-toolbar-actions">
              <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por pasajero, conductor, estado..."
                  style={{ width: "18rem" }}
                />
              </span>
            </div>
          </div>

          <DataTable
            value={trips}
            lazy
            paginator
            first={(page - 1) * 10}
            rows={10}
            totalRecords={totalRecords}
            onPage={(e) => setPage(e.page + 1)}
            responsiveLayout="scroll"
            stripedRows
            emptyMessage="No hay viajes registrados"
            loading={loading}
          >
            <Column
              field="id"
              header="ID Viaje"
              sortable
              style={{ width: "7%" }}
            />
            <Column
              header="Pasajero"
              body={(row) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "1.85rem",
                      height: "1.85rem",
                      borderRadius: "50%",
                      background: "#e8f5e9",
                      color: "#2e7d32",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    {(row.passenger?.name || "P").slice(0, 1).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600 }}>
                    {row.passenger?.name || "Desconocido"}
                  </span>
                </div>
              )}
              sortable
              sortField="passenger.name"
            />
            <Column
              header="Conductor"
              body={(row) =>
                row.driver ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "1.85rem",
                        height: "1.85rem",
                        borderRadius: "50%",
                        background: "#e3f2fd",
                        color: "#1565c0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    >
                      {row.driver.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{row.driver.name}</span>
                  </div>
                ) : (
                  <span style={{ color: "#999", fontStyle: "italic" }}>
                    Sin conductor asignado
                  </span>
                )
              }
              sortable
              sortField="driver.name"
            />
            <Column
              header="Origen"
              body={(row) => (
                <span
                  title={row.origin_address}
                  style={{
                    display: "inline-block",
                    maxWidth: "180px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {row.origin_address || "—"}
                </span>
              )}
            />
            <Column
              header="Destino"
              body={(row) => (
                <span
                  title={row.destination_address}
                  style={{
                    display: "inline-block",
                    maxWidth: "180px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 600,
                  }}
                >
                  {row.destination_address || "—"}
                </span>
              )}
            />
            <Column
              header="Distancia / Pasajeros"
              body={(row) => (
                <div style={{ fontSize: "0.9rem" }}>
                  <div>
                    <i
                      className="pi pi-directions"
                      style={{
                        fontSize: "0.75rem",
                        marginRight: "4px",
                        color: "var(--primary-light)",
                      }}
                    />
                    {row.distance
                      ? `${Number(row.distance).toFixed(2)} km`
                      : "—"}
                  </div>
                  <div
                    style={{ color: "var(--text-secondary)", marginTop: "2px" }}
                  >
                    <i
                      className="pi pi-users"
                      style={{ fontSize: "0.75rem", marginRight: "4px" }}
                    />
                    {row.passengers_count || 1}{" "}
                    {row.passengers_count === 1 ? "pasajero" : "pasajeros"}
                  </div>
                </div>
              )}
            />
            <Column
              header="Fecha Solicitud"
              body={(row) => formatDate(row.created_at)}
              sortable
              sortField="created_at"
            />
            <Column
              header="Estado"
              body={(row) => getStatusBadge(row.state_id, row.state?.state_name)}
              sortable
              sortField="state_id"
            />
            <Column
              header="Acciones"
              body={(row) => (
                <div className="action-buttons">
                  <Button
                    size="small"
                    icon="pi pi-eye"
                    text
                    onClick={() => setSelected(row)}
                    title="Ver detalles completos del viaje"
                  />
                </div>
              )}
            />
          </DataTable>
        </Card>

        {/* Modal de Detalles del Viaje */}
        <Dialog
          header={`Detalles del Viaje #${selected?.id}`}
          visible={!!selected}
          style={{ width: "42rem" }}
          onHide={() => setSelected(null)}
          draggable={false}
          resizable={false}
        >
          {selected && (
            <div
              style={{ display: "grid", gap: "1.25rem", padding: "0.5rem 0" }}
            >
              {/* Sección Trayecto */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 1rem 0",
                    color: "var(--primary-main)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="pi pi-map" /> Información del Trayecto
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <i
                      className="pi pi-map-marker"
                      style={{ color: "#2563eb", marginTop: "0.2rem" }}
                    />
                    <div>
                      <strong
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                          display: "block",
                          textTransform: "uppercase",
                        }}
                      >
                        Punto de Origen
                      </strong>
                      <span style={{ fontSize: "0.95rem" }}>
                        {selected.origin_address || "Ubicación GPS"}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          color: "#94a3b8",
                          marginTop: "0.15rem",
                        }}
                      >
                        Lat: {selected.origin_lat ? Number(selected.origin_lat).toFixed(6) : "—"} | Lng:{" "}
                        {selected.origin_lng ? Number(selected.origin_lng).toFixed(6) : "—"}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      borderTop: "1px dashed #e2e8f0",
                      paddingTop: "0.75rem",
                      }}
                  >
                    <i
                      className="pi pi-flag-fill"
                      style={{ color: "#ef4444", marginTop: "0.2rem" }}
                    />
                    <div>
                      <strong
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                          display: "block",
                          textTransform: "uppercase",
                        }}
                      >
                        Destino Campus
                      </strong>
                      <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                        {selected.destination_address || "—"}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          color: "#94a3b8",
                          marginTop: "0.15rem",
                        }}
                      >
                        Lat: {selected.destination_lat ? Number(selected.destination_lat).toFixed(6) : "—"} |
                        Lng: {selected.destination_lng ? Number(selected.destination_lng).toFixed(6) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Pasajero y Conductor */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "0.8rem",
                      color: "#64748b",
                      display: "block",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Pasajero
                  </strong>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "50%",
                        background: "#e8f5e9",
                        color: "#2e7d32",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                    >
                      {(selected.passenger?.name || "P")
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, display: "block" }}>
                        {selected.passenger?.name || "Desconocido"}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "0.8rem",
                      color: "#64748b",
                      display: "block",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Conductor
                  </strong>
                  {selected.driver ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: "2rem",
                          height: "2rem",
                          borderRadius: "50%",
                          background: "#e3f2fd",
                          color: "#1565c0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}
                      >
                        {selected.driver.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, display: "block" }}>
                          {selected.driver.name}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Conductor asignado
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span
                      style={{
                        color: "#94a3b8",
                        fontStyle: "italic",
                        display: "block",
                        padding: "0.35rem 0",
                      }}
                    >
                      Sin conductor asignado
                    </span>
                  )}
                </div>
              </div>

              {/* Estadísticas Básicas y Fechas */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  background: "#fafafa",
                  border: "1px solid #eee",
                  borderRadius: "0.75rem",
                  padding: "1rem",
                }}
              >
                <div>
                  <strong
                    style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      display: "block",
                    }}
                  >
                    Distancia de Trayecto
                  </strong>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--primary-main)",
                    }}
                  >
                    {selected.distance
                      ? `${Number(selected.distance).toFixed(2)} km`
                      : "—"}
                  </span>
                </div>
                <div>
                  <strong
                    style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      display: "block",
                    }}
                  >
                    Capacidad / Pasajeros
                  </strong>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--primary-main)",
                    }}
                  >
                    {selected.passengers_count || 1} pasajeros
                  </span>
                </div>
                <div
                  style={{
                    borderTop: "1px solid #eee",
                    paddingTop: "0.5rem",
                    gridColumn: "1 / -1",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>
                    <strong>Fecha Solicitado:</strong>{" "}
                    {formatDate(selected.created_at)}
                  </span>
                  <span>
                    <strong>Última Actividad:</strong>{" "}
                    {formatDate(selected.updated_at)}
                  </span>
                </div>
              </div>

              {/* Calificaciones y Comentarios */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 1rem 0",
                    color: "var(--primary-main)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="pi pi-comments" /> Calificación del Viaje
                </h4>
                {selected.ratings && selected.ratings.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {selected.ratings.map((rating) => (
                      <div
                        key={rating.id}
                        style={{
                          borderBottom:
                            selected.ratings.length > 1
                              ? "1px solid #eee"
                              : "none",
                          paddingBottom: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: "var(--primary-dark)",
                            }}
                          >
                            {rating.emitter?.name || "Pasajero"}
                          </span>
                          <div>{renderStars(rating.rating)}</div>
                        </div>
                        {rating.comment ? (
                          <div
                            style={{
                              backgroundColor: "#f8fafc",
                              borderLeft: "4px solid #cbd5e1",
                              padding: "0.75rem 1rem",
                              borderRadius: "0 0.5rem 0.5rem 0",
                              fontStyle: "italic",
                              color: "#334155",
                              fontSize: "0.9rem",
                            }}
                          >
                            "{rating.comment}"
                          </div>
                        ) : (
                          <span
                            style={{
                              color: "#94a3b8",
                              fontStyle: "italic",
                              fontSize: "0.85rem",
                            }}
                          >
                            Sin comentarios detallados
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "1rem 0",
                      color: "#94a3b8",
                    }}
                  >
                    <i
                      className="pi pi-info-circle"
                      style={{
                        fontSize: "1.5rem",
                        marginBottom: "0.5rem",
                        display: "block",
                        opacity: 0.6,
                      }}
                    />
                    <span style={{ fontStyle: "italic", fontSize: "0.9rem" }}>
                      Este viaje aún no ha recibido calificaciones ni
                      comentarios.
                    </span>
                  </div>
                )}
              </div>

              {/* Botón de Cerrar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "0.5rem",
                }}
              >
                <Button
                  label="Cerrar"
                  onClick={() => setSelected(null)}
                  className="p-button-text"
                />
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </>
  );
}
