import { ontimeColor } from '../lib/colors.js';

// Section 5: Top thấp nhất — tuyến / tài xế / BKS. Click dòng -> drill chi tiết.
function Table({ title, rows, kind, onDrill }) {
  return (
    <div className="top-table">
      <h4>{title}</h4>
      <table>
        <thead><tr><th>Mã/Tên</th><th>Chuyến</th><th>Ontime</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="drill" onClick={() => onDrill && onDrill({ kind, value: r.name })}>
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

export default function TopTables({ top, onDrill }) {
  return (
    <div>
      <h3>Top tỉ lệ ontime thấp nhất <span className="muted">(click dòng để xem chi tiết)</span></h3>
      <div className="top-grid">
        <Table title="Tuyến tải" rows={top['Tuyến']} kind="route" onDrill={onDrill} />
        <Table title="Tài xế" rows={top['Tài xế']} kind="driver" onDrill={onDrill} />
        <Table title="Biển số (BKS)" rows={top['BKS']} kind="bks" onDrill={onDrill} />
      </div>
    </div>
  );
}
