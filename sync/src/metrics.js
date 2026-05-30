// Pure functions: rows (2D) -> các bảng agg_* (2D, sẵn sàng ghi sheet).
// Không I/O => test offline trên CSV.
// Ontime/chuyến = đúng giờ / đã-check-in. Gộp nhiều chuyến = STOP-POOLED:
//   (Σ điểm đúng giờ) / (Σ điểm đã check-in) — khớp tab "Tổng quan" nguồn.
import { COL, TYPES, isOntime, isLate, isCheckedIn, parseDate, TABS } from './constants.js';

const round2 = (x) => Math.round(x * 100) / 100;
const pct = (frac) => (frac == null ? '' : round2(frac * 100));

// Gộp stop-pooled: trả fraction | null (null nếu không có điểm nào đã check-in).
function pooled(trips) {
  let on = 0, ch = 0;
  for (const t of trips) { on += t.ontimeCount; ch += t.checkedIn; }
  return ch ? on / ch : null;
}

// Hồi quy tuyến tính y theo index -> mảng trend cùng độ dài.
function trendLine(ys) {
  const pts = ys.map((y, i) => [i, y]).filter(([, y]) => y != null);
  if (pts.length < 2) return ys.map(() => '');
  const n = pts.length;
  const sx = pts.reduce((a, [x]) => a + x, 0);
  const sy = pts.reduce((a, [, y]) => a + y, 0);
  const sxy = pts.reduce((a, [x, y]) => a + x * y, 0);
  const sxx = pts.reduce((a, [x]) => a + x * x, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
  const intercept = (sy - slope * sx) / n;
  return ys.map((_, i) => round2(intercept + slope * i));
}

// Gom theo Mã chuyến -> object/chuyến.
export function groupTrips(rows) {
  const map = new Map();
  for (const r of rows) {
    const trip = r[COL.TRIP];
    if (!trip) continue;
    if (!map.has(trip)) {
      map.set(trip, {
        trip, date: parseDate(r[COL.DATE]), type: r[COL.TYPE] || '',
        bks: r[COL.BKS] || '', driver: r[COL.DRIVER] || '',
        route: r[COL.ROUTE] || '', statuses: [],
      });
    }
    map.get(trip).statuses.push(r[COL.CHECKIN_STATUS] || '');
  }
  for (const t of map.values()) {
    t.stops = t.statuses.length;
    t.checkedIn = t.statuses.filter(isCheckedIn).length;
    t.ontimeCount = t.statuses.filter(isOntime).length;
    t.lateCount = t.statuses.filter(isLate).length;
    t.ontime = t.checkedIn ? t.ontimeCount / t.checkedIn : null; // fraction/chuyến
  }
  return [...map.values()];
}

// Group trips theo keyFn -> Map<key, trip[]>.
function groupBy(trips, keyFn) {
  const m = new Map();
  for (const t of trips) {
    const k = keyFn(t);
    if (!k) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(t);
  }
  return m;
}

function buildTrip(trips) {
  const head = ['Mã chuyến', 'Ngày', 'Loại', 'BKS', 'Tài xế', 'Mã lộ trình', 'Điểm dừng', 'Đã check-in', 'Ontime%'];
  const rows = trips.map((t) => [t.trip, t.date, t.type, t.bks, t.driver, t.route, t.stops, t.checkedIn, pct(t.ontime)]);
  return [head, ...rows];
}

function buildDaily(trips) {
  const byDate = groupBy(trips, (t) => t.date);
  const dates = [...byDate.keys()].sort();
  const avgs = dates.map((d) => { const f = pooled(byDate.get(d)); return f == null ? null : round2(f * 100); });
  const trend = trendLine(avgs);
  const head = ['Ngày', 'Ontime TB', 'Số chuyến', 'Trend'];
  const rows = dates.map((d, i) => [d, avgs[i] ?? '', byDate.get(d).length, trend[i]]);
  return [head, ...rows];
}

function buildType(trips) {
  const present = [...new Set(trips.map((t) => t.type).filter(Boolean))];
  const ordered = [...TYPES.filter((t) => present.includes(t)), ...present.filter((t) => !TYPES.includes(t))];
  const head = ['Loại', 'Ontime TB', 'Số chuyến'];
  const rows = ordered.map((type) => {
    const ts = trips.filter((t) => t.type === type);
    return [type, pct(pooled(ts)), ts.length];
  });
  return [head, ...rows];
}

function buildHeatmap(trips) {
  const routes = [...new Set(trips.map((t) => t.route).filter(Boolean))].sort();
  const dates = [...new Set(trips.map((t) => t.date).filter(Boolean))].sort();
  const cell = new Map(); // route|date -> trip[]
  for (const t of trips) {
    if (!t.route || !t.date) continue;
    const k = `${t.route}|${t.date}`;
    if (!cell.has(k)) cell.set(k, []);
    cell.get(k).push(t);
  }
  const head = ['Mã lộ trình', ...dates];
  const rows = routes.map((rt) => [rt, ...dates.map((d) => pct(pooled(cell.get(`${rt}|${d}`) || [])))]);
  return [head, ...rows];
}

function topLowest(trips, keyFn, label, topN) {
  return [...groupBy(trips, keyFn).entries()]
    .map(([k, ts]) => ({ k, cnt: ts.length, avg: pooled(ts) }))
    .filter((x) => x.avg != null)
    .sort((x, y) => x.avg - y.avg || x.k.localeCompare(y.k)) // tiebreak ổn định
    .slice(0, topN)
    .map((x) => [label, x.k, x.cnt, round2(x.avg * 100)]);
}

function buildTop(trips, topN) {
  const head = ['Loại', 'Mã/Tên', 'Số chuyến', 'Ontime%'];
  return [head,
    ...topLowest(trips, (t) => t.route, 'Tuyến', topN),
    ...topLowest(trips, (t) => t.driver, 'Tài xế', topN),
    ...topLowest(trips, (t) => t.bks, 'BKS', topN),
  ];
}

function buildVehicle(trips) {
  const map = new Map(); // bks|date -> {ontime, late, notChecked}
  for (const t of trips) {
    if (!t.bks || !t.date) continue; // nhất quán với heatmap
    const k = `${t.bks}|${t.date}`;
    if (!map.has(k)) map.set(k, { ontime: 0, late: 0, notChecked: 0 });
    const a = map.get(k);
    a.ontime += t.ontimeCount;
    a.late += t.lateCount;
    a.notChecked += t.stops - t.checkedIn;
  }
  const head = ['BKS', 'Ngày', 'Đúng giờ', 'Trễ', 'Chưa check-in'];
  const rows = [...map.entries()]
    .map(([k, a]) => { const [bks, date] = k.split('|'); return [bks, date, a.ontime, a.late, a.notChecked]; })
    .sort((x, y) => (x[0] === y[0] ? x[1].localeCompare(y[1]) : x[0].localeCompare(y[0])));
  return [head, ...rows];
}

// Từ rows -> agg_* (dùng cho test). Tách groupTrips để index.js dùng lại trips cho Telegram.
export function buildAggregates(rows, opts) {
  return aggregatesFromTrips(groupTrips(rows), opts);
}

export function aggregatesFromTrips(trips, { topN = 10 } = {}) {
  return {
    [TABS.TRIP]: buildTrip(trips),
    [TABS.DAILY]: buildDaily(trips),
    [TABS.TYPE]: buildType(trips),
    [TABS.HEATMAP]: buildHeatmap(trips),
    [TABS.TOP]: buildTop(trips, topN),
    [TABS.VEHICLE]: buildVehicle(trips),
  };
}
