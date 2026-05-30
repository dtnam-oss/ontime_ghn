// Pure: 2D array (agg_*) -> dữ liệu sẵn cho chart. Test bằng node (không React).
const num = (x) => (x === '' || x == null ? null : Number(x));
export const body = (values) => (values || []).slice(1);

// KPI: ontime toàn cục (pooled từ agg_trip: Σ(checkedIn*pct)/Σ checkedIn), tổng chuyến, theo loại.
export function kpi(data) {
  const trips = body(data.agg_trip);
  let on = 0, ch = 0;
  for (const r of trips) {
    const c = num(r[7]) || 0;
    const p = num(r[8]);
    if (p != null) { on += (c * p) / 100; ch += c; }
  }
  const overall = ch ? Math.round((on / ch) * 1000) / 10 : null;
  return { overall, totalTrips: trips.length, byType: typeBar(data) };
}

export function daily(data) {
  return body(data.agg_daily).map((r) => ({ date: r[0], ontime: num(r[1]), count: num(r[2]), trend: num(r[3]) }));
}

export function typeBar(data) {
  return body(data.agg_type).map((r) => ({ type: r[0], ontime: num(r[1]), count: num(r[2]) }));
}

export function heatmap(data) {
  const v = data.agg_heatmap || [];
  const dates = (v[0] || []).slice(1);
  const rows = v.slice(1).map((r) => ({ route: r[0], cells: dates.map((d, i) => ({ date: d, val: num(r[i + 1]) })) }));
  return { dates, rows };
}

export function top(data) {
  const groups = { Tuyến: [], 'Tài xế': [], BKS: [] };
  for (const r of body(data.agg_top)) {
    if (groups[r[0]]) groups[r[0]].push({ name: r[1], count: num(r[2]), ontime: num(r[3]) });
  }
  return groups;
}

// Gộp check-in theo BKS trong khoảng ngày [from,to] (null = tất cả).
export function vehicle(data, range) {
  const inRange = (d) => !range || (d >= range.from && d <= range.to);
  const map = new Map();
  for (const r of body(data.agg_vehicle_checkin)) {
    const bks = r[0];
    if (!inRange(r[1])) continue;
    if (!map.has(bks)) map.set(bks, { bks, ontime: 0, late: 0, notChecked: 0 });
    const a = map.get(bks);
    a.ontime += num(r[2]) || 0;
    a.late += num(r[3]) || 0;
    a.notChecked += num(r[4]) || 0;
  }
  return [...map.values()];
}

export function allDates(data) {
  const dates = body(data.agg_daily).map((r) => r[0]).filter(Boolean).sort();
  return dates;
}
