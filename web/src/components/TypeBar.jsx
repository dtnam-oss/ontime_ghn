import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { ontimeColor } from '../lib/colors.js';

// Section 3: ontime theo Loại.
export default function TypeBar({ byType }) {
  return (
    <div>
      <h3>Ontime theo Loại</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={byType} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis domain={[0, 100]} unit="%" />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="ontime" name="Ontime">
            {byType.map((t, i) => <Cell key={i} fill={ontimeColor(t.ontime)} />)}
            <LabelList dataKey="ontime" position="top" formatter={(v) => `${v}%`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
