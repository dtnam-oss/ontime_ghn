import { stopsForTrip } from '../lib/transform.js';

const tripPct = (t) => (t.checkedIn ? Math.round((t.ontimeCount / t.checkedIn) * 1000) / 10 : null);
const parseTs = (s) => { const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null; };
// "2026-05-30 4:50" -> "05-30 04:50"; trống -> "—"
const fmt = (s) => { const m = String(s || '').match(/\d{4}-(\d{2}-\d{2})\s+(\d{1,2}):(\d{2})/); return m ? `${m[1]} ${m[2].padStart(2, '0')}:${m[3]}` : '—'; };
const lateMin = (plan, actual) => { const p = parseTs(plan), a = parseTs(actual); return p != null && a != null && a > p ? Math.round((a - p) / 60000) : 0; };
const rowBg = (s) => (/đúng giờ/i.test(s) ? '#eaf6ec' : /trễ/i.test(s) ? '#fdecea' : '#f3f3f3');

// 1 ô giờ thực tế: tô đỏ + +X′ nếu trễ so với dự kiến.
function ActualCell({ plan, actual }) {
  const d = lateMin(plan, actual);
  return <td className={d > 0 ? 'late' : ''}>{fmt(actual)}{d > 0 ? ` +${d}′` : ''}</td>;
}

export default function TripDetail({ drill, matchedTrips, selected, onSelect, allStops }) {
  if (!drill) return <div><h3>Chi tiết hành trình</h3><p className="muted">Click 1 ô (hoặc tên tuyến) trong Heatmap, hoặc 1 dòng bảng Top, để xem chi tiết các điểm của chuyến.</p></div>;
  if (!matchedTrips.length) return <div><h3>Chi tiết hành trình</h3><p className="muted">Không có chuyến khớp.</p></div>;

  const stops = selected ? stopsForTrip(allStops, selected.trip) : [];
  const kindLabel = drill.kind === 'route' ? 'Tuyến' : drill.kind === 'driver' ? 'Tài xế' : 'BKS';

  return (
    <div>
      <h3>Chi tiết hành trình — {kindLabel}: {drill.value}{drill.date ? ` · ${drill.date}` : ''} ({matchedTrips.length} chuyến)</h3>
      <div className="detail-grid">
        <div className="trip-list">
          <table>
            <thead><tr><th>Mã chuyến</th><th>Ontime</th></tr></thead>
            <tbody>
              {matchedTrips.map((t) => (
                <tr key={t.trip} className={selected && t.trip === selected.trip ? 'sel' : ''} onClick={() => onSelect(t)}>
                  <td>{t.trip}</td>
                  <td style={{ background: tripPct(t) == null ? '#eee' : undefined }}>{tripPct(t) == null ? '—' : tripPct(t) + '%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="trip-stops">
          {selected && (
            <>
              <div className="trip-head">
                <b>{selected.trip}</b> · {selected.bks} · {selected.driver} · {selected.route} · {selected.date}
                · ontime <b>{tripPct(selected) == null ? '—' : tripPct(selected) + '%'}</b>
              </div>
              {stops.length === 0 && <p className="muted">Chi tiết điểm chỉ có cho ~90 ngày gần nhất — chuyến này nằm ngoài cửa sổ.</p>}
              {stops.length > 0 && (
              <div className="stop-table-wrap">
                <table className="stop-table">
                  <thead>
                    <tr>
                      <th>Tên điểm</th><th>Trạng thái</th>
                      <th>CI dự kiến</th><th>CI thực tế</th>
                      <th>CO dự kiến</th><th>CO thực tế</th>
                      <th>Đóng seal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stops.map((s, i) => (
                      <tr key={i} style={{ background: rowBg(s.status) }}>
                        <td className="sn">{s.name}</td>
                        <td className="status">{s.status || '(chưa)'}</td>
                        <td>{fmt(s.ciPlan)}</td>
                        <ActualCell plan={s.ciPlan} actual={s.ciActual} />
                        <td>{fmt(s.coPlan)}</td>
                        <ActualCell plan={s.coPlan} actual={s.coActual} />
                        <td>{fmt(s.seal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
