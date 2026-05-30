import { ontimeColor } from '../lib/colors.js';

// Section 1: KPI tổng quan + ontime theo Loại.
export default function KpiCards({ kpi }) {
  const Card = ({ label, value, color }) => (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className="card-value" style={{ color }}>{value}</div>
    </div>
  );
  return (
    <div className="kpi-grid">
      <Card label="Ontime TB toàn cục" value={kpi.overall != null ? `${kpi.overall}%` : '—'} color={ontimeColor(kpi.overall)} />
      <Card label="Tổng số chuyến" value={kpi.totalTrips.toLocaleString('vi-VN')} color="#1976d2" />
      {kpi.byType.map((t) => (
        <Card key={t.type} label={`${t.type} (${t.count})`} value={t.ontime != null ? `${t.ontime}%` : '—'} color={ontimeColor(t.ontime)} />
      ))}
    </div>
  );
}
