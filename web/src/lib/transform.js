// Pure: agg_trip (2D) -> trip objects -> filter -> builders cho từng chart.
// Gộp STOP-POOLED: (Σ đúng giờ)/(Σ đã check-in). Test bằng node.
const TYPES = ['Nội thành', 'Nội tỉnh/Nội vùng', 'Tuyến trục'];
const N = (x) => Number(x) || 0;
const r1 = (x) => Math.round(x * 10) / 10;
const asPct = (f) => (f == null ? null : r1(f * 100));

// agg_trip cột: 0 trip,1 ngày,2 loại,3 bks,4 tài xế,5 tuyến,6 stops,7 checkedIn,8 ontime,9 late,10 %
export function parseTrips(values) {
  return (values || []).slice(1).map((r) => ({
    trip: r[0], date: r[1], type: r[2], bks: r[3], driver: r[4], route: r[5],
    stops: N(r[6]), checkedIn: N(r[7]), ontimeCount: N(r[8]), lateCount: N(r[9]),
  }));
}

const has = (arr, v) => !arr.length || arr.includes(v);
export function filterTrips(trips, f) {
  return trips.filter((t) =>
    has(f.loai, t.type) && has(f.xe, t.bks) && has(f.taixe, t.driver) && has(f.tuyen, t.route)
    && (!f.from || t.date >= f.from) && (!f.to || t.date <= f.to));
}

const uniq = (vals) => [...new Set(vals.filter(Boolean))].sort();
export function options(trips) {
  return {
    loai: uniq(trips.map((t) => t.type)), xe: uniq(trips.map((t) => t.bks)),
    taixe: uniq(trips.map((t) => t.driver)), tuyen: uniq(trips.map((t) => t.route)),
    dates: uniq(trips.map((t) => t.date)),
  };
}

function groupBy(arr, fn) {
  const m = new Map();
  for (const x of arr) { const k = fn(x); if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return m;
}
const pooled = (ts) => { let o = 0, c = 0; for (const t of ts) { o += t.ontimeCount; c += t.checkedIn; } return c ? o / c : null; };

function trendLine(ys) {
  const pts = ys.map((y, i) => [i, y]).filter(([, y]) => y != null);
  if (pts.length < 2) return ys.map(() => null);
  const n = pts.length;
  const sx = pts.reduce((a, [x]) => a + x, 0), sy = pts.reduce((a, [, y]) => a + y, 0);
  const sxy = pts.reduce((a, [x, y]) => a + x * y, 0), sxx = pts.reduce((a, [x]) => a + x * x, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
  const b = (sy - slope * sx) / n;
  return ys.map((_, i) => r1(b + slope * i));
}

export function typeBar(trips) {
  const present = [...new Set(trips.map((t) => t.type).filter(Boolean))];
  const ordered = [...TYPES.filter((t) => present.includes(t)), ...present.filter((t) => !TYPES.includes(t))];
  return ordered.map((type) => { const ts = trips.filter((t) => t.type === type); return { type, ontime: asPct(pooled(ts)), count: ts.length }; });
}

export function kpi(trips) {
  return { overall: asPct(pooled(trips)), totalTrips: trips.length, byType: typeBar(trips) };
}

export function daily(trips) {
  const by = groupBy(trips, (t) => t.date);
  const dates = [...by.keys()].sort();
  const ont = dates.map((d) => asPct(pooled(by.get(d))));
  const trend = trendLine(ont);
  return dates.map((d, i) => ({ date: d, ontime: ont[i], count: by.get(d).length, trend: trend[i] }));
}

export function checkin(trips) {
  let on = 0, late = 0, nc = 0;
  for (const t of trips) { on += t.ontimeCount; late += t.lateCount; nc += t.stops - t.checkedIn; }
  return [{ name: 'Đúng giờ', value: on }, { name: 'Trễ', value: late }, { name: 'Chưa check-in', value: nc }];
}

export function heatmap(trips) {
  const routes = uniq(trips.map((t) => t.route));
  const dates = uniq(trips.map((t) => t.date));
  const cell = groupBy(trips, (t) => (t.route && t.date ? `${t.route}|${t.date}` : ''));
  const rows = routes.map((rt) => ({ route: rt, cells: dates.map((d) => ({ date: d, val: asPct(pooled(cell.get(`${rt}|${d}`) || [])) })) }));
  return { dates, rows };
}

export function top(trips, n = 10) {
  const g = (keyFn) => [...groupBy(trips, keyFn).entries()]
    .map(([k, ts]) => ({ name: k, count: ts.length, ontime: asPct(pooled(ts)) }))
    .filter((x) => x.ontime != null)
    .sort((a, b) => a.ontime - b.ontime || a.name.localeCompare(b.name))
    .slice(0, n);
  return { Tuyến: g((t) => t.route), 'Tài xế': g((t) => t.driver), BKS: g((t) => t.bks) };
}

// --- Chi tiết hành trình (drill) ---
export function parseStops(values) {
  return (values || []).slice(1).map((r) => ({
    trip: r[0], date: r[1], bks: r[2], driver: r[3], type: r[4], route: r[5],
    name: r[6], status: r[7],
    ciPlan: r[8], ciActual: r[9], coPlan: r[10], coActual: r[11], seal: r[12],
    delay: r[13] === '' || r[13] == null ? null : Number(r[13]),
  }));
}

// trips khớp drill {kind:'route'|'driver'|'bks', value, date?}, xấu (ontime thấp) lên đầu.
export function tripsForDrill(trips, d) {
  if (!d) return [];
  const ot = (t) => (t.checkedIn ? t.ontimeCount / t.checkedIn : 1);
  return trips
    .filter((t) => t[d.kind] === d.value && (!d.date || t.date === d.date))
    .sort((a, b) => ot(a) - ot(b));
}

export function stopsForTrip(stops, tripId) {
  return stops.filter((s) => s.trip === tripId);
}

export function vehicle(trips, n = 15) {
  return [...groupBy(trips, (t) => t.bks).entries()]
    .map(([bks, ts]) => {
      let on = 0, late = 0, nc = 0;
      for (const t of ts) { on += t.ontimeCount; late += t.lateCount; nc += t.stops - t.checkedIn; }
      return { bks, ontime: on, late, notChecked: nc };
    })
    .sort((a, b) => (b.late + b.notChecked) - (a.late + a.notChecked))
    .slice(0, n);
}
