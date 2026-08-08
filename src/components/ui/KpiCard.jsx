import { Card } from "primereact/card";

export default function KpiCard({ title, value, icon, iconBgColor, iconColor }) {
  return (
    <Card
      className="shadow-sm border-none transition-all duration-300 hover:shadow-md"
      style={{
        borderRadius: "16px",
        background: "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)",
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div
          className="p-3 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBgColor, color: iconColor }}
        >
          <i className={`${icon} text-xl`}></i>
        </div>
      </div>
    </Card>
  );
}
