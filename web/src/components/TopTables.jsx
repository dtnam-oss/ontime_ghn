import { ontimeColor } from '../lib/colors.js';

// Section 5: Top thấp nhất — tuyến / tài xế / BKS.
function Table({ title, rows }) {
  return (
    <div className="top-table">
      <h4>{title}</h4>
      <table>
        <thead><tr><th>Mã/Tên</th><th>Chuyến</th><th>Ontime</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.name}</td>
              <td style={{ textAlign: 'center' }}>{r.count}</td>
              <td style={{ background: ontimeColor(r.ontime), textAlign: 'right' }}>{r.ontime}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TopTables({ top }) {
  return (
    <div>
      <h3>Top tỉ lệ ontime thấp nhất</h3>
      <div className="top-grid">
        <Table title="Tuyến tải" rows={top['Tuyến']} />
        <Table title="Tài xế" rows={top['Tài xế']} />
        <Table title="Biển số (BKS)" rows={top['BKS']} />
      </div>
    </div>
  );
}
