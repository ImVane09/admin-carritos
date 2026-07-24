import { useEffect, useState } from "react";
import { Card } from "primereact/card";

export default function PassengerReport() {
  return (
    <div className="reports-layout" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>Reporte de Pasajeros</h1>
          <p>Análisis del flujo de pasajeros y horarios pico.</p>
        </div>
      </div>
      <Card className="chart-card-premium">
        <h3>Próximamente...</h3>
        <p>Las métricas de pasajeros estarán disponibles aquí.</p>
      </Card>
    </div>
  );
}
