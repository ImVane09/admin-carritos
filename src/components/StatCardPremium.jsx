import { ProgressSpinner } from 'primereact/progressspinner';

export default function StatCardPremium({ title, value, icon, tone, subtitle, loading }) {
  return (
    <div className={`stat-card-premium ${tone}`}>
      <div className="stat-premium-info">
        <span>{title}</span>
        {loading ? (
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              height: "2.5rem",
              margin: "0.25rem 0",
            }}
          >
            <ProgressSpinner
              style={{ width: "22px", height: "22px" }}
              strokeWidth="6"
            />
          </h2>
        ) : (
          <h2>{value ?? 0}</h2>
        )}
        <p>
          <i
            className="pi pi-check-circle"
            style={{ color: "#4caf50", fontSize: "0.8rem", marginRight: "4px" }}
          />
          {subtitle || "Sincronizado"}
        </p>
      </div>
      <div className="stat-icon-wrapper">
        <i className={icon} />
      </div>
    </div>
  );
}
