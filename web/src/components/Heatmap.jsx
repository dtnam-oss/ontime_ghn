import { ontimeColor } from '../lib/colors.js';

// Section 4: heatmap lưới Mã lộ trình × Ngày, ô tô màu theo ontime%.
export default function Heatmap({ heatmap, onDrill }) {
  const { dates, rows } = heatmap;
  return (
    <div>
      <h3>Heatmap ontime — Lộ trình × Ngày ({rows.length} tuyến)</h3>
      <div className="heatmap-wrap">
        <table className="heatmap">
          <thead>
            <tr>
              <th className="sticky-col">Mã lộ trình</th>
              {dates.map((d) => <th key={d}>{d.slice(5)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.route}>
                <td className="sticky-col" style={{ cursor: 'pointer' }} title="Click xem cả tuyến"
                  onClick={() => onDrill && onDrill({ kind: 'route', value: r.route })}>{r.route}</td>
                {r.cells.map((c, i) => (
                  <td key={i} style={{ background: ontimeColor(c.val), cursor: c.val == null ? 'default' : 'pointer' }}
                    title={c.val == null ? '—' : `${c.val}% — click xem chi tiết`}
                    onClick={() => c.val != null && onDrill && onDrill({ kind: 'route', value: r.route, date: c.date })}>
                    {c.val == null ? '' : Math.round(c.val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
