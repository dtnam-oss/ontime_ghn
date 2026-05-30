import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PALETTE } from '../lib/colors.js';

// Section 2: ontime theo ngày + đường xu hướng (trend).
export default function TrendChart({ daily }) {
  return (
    <div>
      <h3>Ontime theo ngày + đường xu hướng</h3>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={daily} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} unit="%" />
          <Tooltip formatter={(v) => (v == null ? '—' : `${v}%`)} />
          <Legend />
          <Line type="monotone" dataKey="ontime" name="Ontime" stroke={PALETTE.bar} strokeWidth={2} dot />
          <Line type="monotone" dataKey="trend" name="Xu hướng" stroke={PALETTE.trend} strokeDasharray="6 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
