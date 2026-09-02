import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";

export default function DateRangeFilter({ startDate, setStartDate, endDate, setEndDate, onFilter, loading }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "1rem",
        marginBottom: "1rem",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", marginLeft: "0.25rem" }}>
            Desde (Fecha Inicio)
          </label>
          <Calendar
            value={startDate}
            onChange={(e) => setStartDate(e.value)}
            dateFormat="yy-mm-dd"
            showIcon
            placeholder="Fecha Inicio"
            className="p-inputtext-sm"
            inputStyle={{ borderRadius: "8px" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", marginLeft: "0.25rem" }}>
            Hasta (Fecha Fin)
          </label>
          <Calendar
            value={endDate}
            onChange={(e) => setEndDate(e.value)}
            dateFormat="yy-mm-dd"
            showIcon
            placeholder="Fecha Fin"
            className="p-inputtext-sm"
            inputStyle={{ borderRadius: "8px" }}
            minDate={startDate}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "1.5rem" }}>
          <Button
            label="Filtrar"
            icon="pi pi-filter"
            onClick={() => onFilter(true)}
            loading={loading}
            className="p-button-sm"
            style={{ borderRadius: "8px" }}
          />
        </div>
      </div>
    </div>
  );
}
