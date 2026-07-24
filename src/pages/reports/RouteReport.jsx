import { useEffect, useState } from "react";
import { Card } from "primereact/card";

export default function RouteReport() {
  return (
    <div className="reports-layout" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-content">
          <h1>Reporte de Rutas</h1>
          <p>Análisis de las rutas más frecuentes y destinos populares.</p>
        </div>
      </div>
      <Card className="chart-card-premium">
        <h3>Próximamente...</h3>
        <p>Los gráficos de rutas y destinos estarán disponibles aquí.</p>
      </Card>
    </div>
  );
}
