import { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { vehicle } from '../lib/transform.js';
import { PALETTE } from '../lib/colors.js';

const TOP_N = 15;

// Section 6: tình trạng check-in theo xe (BKS) theo giai đoạn (stacked bar).
export default function VehicleCheckin({ data, dates }) {
  const [period, setPeriod] = useState('all');

  const range = useMemo(() => {
    if (period === 'all') return null;
    if (period === 'week') { const w = dates.slice(-7); return { from: w[0], to: w[w.length - 1] }; }
    return { from: period, to: period };
  }, [period, dates]);

  // Top xe nhiều vấn đề nhất (trễ + chưa check-in) để bảng đọc được.
  const rows = useMemo(() => vehicle(data, range)
    .sort((a, b) => (b.late + b.notChecked) - (a.late + a.notChecked))
    .slice(0, TOP_N), [data, range]);

  return (
    <div>
      <h3>Tình trạng check-in theo xe (top {TOP_N} nhiều vấn đề nhất)</h3>
      <label>Giai đoạn:{' '}
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="week">7 ngày gần nhất</option>
          {dates.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
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
