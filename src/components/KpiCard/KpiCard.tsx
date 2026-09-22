import './KpiCard.css'; // Importamos SU propio CSS

interface Props {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  alert?: boolean;
}

export default function KpiCard({ title, value, icon, color, alert }: Props) {
  return (
    <div className="kpi-card" style={{ borderLeft: `6px solid ${color}` }}>
      <div className="kpi-icon-wrapper">
        {icon}
      </div>
      <div className="kpi-content">
        <span className="kpi-title">{title}</span>
        <span className="kpi-value">{value}</span>
        {alert && <span className="kpi-alert">Revisar Stock</span>}
      </div>
    </div>
  );
}