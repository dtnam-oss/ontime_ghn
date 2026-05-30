// Pure functions: rows (2D) -> bảng agg_trip (2D, sẵn sàng ghi sheet). Không I/O.
// FE đọc agg_trip rồi tự gom + lọc client-side -> sync chỉ cần bảng chi tiết này.
// Ontime/chuyến = đúng giờ / đã-check-in.
import { COL, isOntime, isLate, isCheckedIn, parseDate, TABS } from './constants.js';

const round2 = (x) => Math.round(x * 100) / 100;
const pct = (frac) => (frac == null ? '' : round2(frac * 100));

// Gom theo Mã chuyến -> object/chuyến (kèm count đúng giờ / trễ / đã check-in).
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

// agg_trip: 1 dòng/chuyến. Cột count (Đúng giờ/Trễ) để FE pool chính xác + dựng stacked bar.
function buildTrip(trips) {
  const head = ['Mã chuyến', 'Ngày', 'Loại', 'BKS', 'Tài xế', 'Mã lộ trình',
    'Điểm dừng', 'Đã check-in', 'Đúng giờ', 'Trễ', 'Ontime%'];
  const rows = trips.map((t) => [
    t.trip, t.date, t.type, t.bks, t.driver, t.route,
    t.stops, t.checkedIn, t.ontimeCount, t.lateCount, pct(t.ontime),
  ]);
  return [head, ...rows];
}

export function aggregatesFromTrips(trips) {
  return { [TABS.TRIP]: buildTrip(trips) };
}

// "YYYY-MM-DD H:MM" -> ms (UTC, để hiệu số triệt tz). Không khớp -> null.
function parseDateTime(s) {
  const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
}

// agg_stops: 1 dòng/điểm dừng (cho FE dựng timeline + độ trễ). delay phút = thực tế - dự kiến.
// since (YYYY-MM-DD, optional): chỉ giữ điểm có ngày ≥ since (cửa sổ FE drill).
export function buildStops(rows, { since } = {}) {
  const head = ['Mã chuyến', 'Ngày', 'BKS', 'Tài xế', 'Loại', 'Mã lộ trình',
    'Tên điểm', 'Trạng thái', 'Check-in dự kiến', 'Check-in thực tế',
    'Check-out dự kiến', 'Check-out thực tế', 'Đóng seal', 'Trễ (phút)'];
  const out = [head];
  for (const r of rows) {
    if (!r[COL.TRIP]) continue;
    if (since && parseDate(r[COL.DATE]) < since) continue;
    const plan = r[COL.CHECKIN_PLAN] || '';
    const actual = r[COL.CHECKIN_ACTUAL] || '';
    const p = parseDateTime(plan), a = parseDateTime(actual);
    const delay = (a != null && p != null && a > p) ? Math.round((a - p) / 60000) : (actual ? 0 : '');
    out.push([r[COL.TRIP], parseDate(r[COL.DATE]), r[COL.BKS] || '', r[COL.DRIVER] || '',
      r[COL.TYPE] || '', r[COL.ROUTE] || '', r[COL.STOP_NAME] || '', r[COL.CHECKIN_STATUS] || '',
      plan, actual, r[COL.CHECKOUT_PLAN] || '', r[COL.CHECKOUT_ACTUAL] || '', r[COL.SEAL] || '', delay]);
  }
  return out;
}

// Từ rows -> { agg_trip } (dùng cho test & dump-fixture).
export function buildAggregates(rows) {
  return aggregatesFromTrips(groupTrips(rows));
}
