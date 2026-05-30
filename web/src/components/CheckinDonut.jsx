import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PALETTE } from '../lib/colors.js';

const COLORS = { 'Đúng giờ': PALETTE.ontime, 'Trễ': PALETTE.late, 'Chưa check-in': PALETTE.notChecked };

// Donut tình trạng check-in tổng (theo bộ lọc hiện tại).
export default function CheckinDonut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div>
      <h3>Tình trạng check-in (điểm dừng)</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}
            label={({ name, value }) => `${name}: ${total ? Math.round((value / total) * 100) : 0}%`}>
            {data.map((d, i) => <Cell key={i} fill={COLORS[d.name]} />)}
          </Pie>
          <Tooltip /><Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
