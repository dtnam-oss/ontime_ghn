import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PALETTE } from '../lib/colors.js';

// Stacked bar check-in theo xe (rows đã lọc + cắt top sẵn từ transform.vehicle).
export default function VehicleCheckin({ rows }) {
  return (
    <div>
      <h3>Tình trạng check-in theo xe (top {rows.length} nhiều vấn đề nhất)</h3>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={rows} margin={{ top: 8, right: 24, bottom: 60, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bks" angle={-45} textAnchor="end" interval={0} height={70} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="ontime" name="Đúng giờ" stackId="s" fill={PALETTE.ontime} />
          <Bar dataKey="late" name="Trễ" stackId="s" fill={PALETTE.late} />
          <Bar dataKey="notChecked" name="Chưa check-in" stackId="s" fill={PALETTE.notChecked} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
